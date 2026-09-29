import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import slugify from "slugify";

import { connectDB } from "@/server/db/connection";
import { Category, Product, User, Vendor } from "@/server/db/models";
import { ADMIN_ROLES, requireAuth, serverError, STAFF_ROLES } from "@/server/auth/session";
import { getVendorProductCounts, getVendorSales } from "@/server/marketplace";
import {
  cleanString,
  generateStrongPassword,
  isEmail,
  isObjectId,
  passwordStrengthError,
  toNonNegativeNumber,
} from "@/server/security/validation";
import type { VendorStatus } from "@/types";

const STATUSES: VendorStatus[] = ["pending", "approved", "suspended"];

/** Validates the limits block sent by the admin form. Returns an error or cleaned limits. */
async function cleanLimits(
  raw: any,
): Promise<{ error: string } | { value: Record<string, unknown> }> {
  const value: Record<string, unknown> = {};
  if (raw === undefined) return { value };

  if (raw.maxProducts !== undefined) {
    const n = toNonNegativeNumber(raw.maxProducts, 10000);
    if (n === undefined || !Number.isInteger(n)) {
      return { error: "Product limit must be a whole number between 0 and 10,000." };
    }
    value["limits.maxProducts"] = n;
  }
  if (raw.maxDiscountPercent !== undefined) {
    const n = toNonNegativeNumber(raw.maxDiscountPercent, 90);
    if (n === undefined) return { error: "Maximum discount must be between 0% and 90%." };
    value["limits.maxDiscountPercent"] = n;
  }
  if (raw.requireProductApproval !== undefined) {
    value["limits.requireProductApproval"] = Boolean(raw.requireProductApproval);
  }
  if (raw.allowedCategories !== undefined) {
    if (!Array.isArray(raw.allowedCategories) || !raw.allowedCategories.every(isObjectId)) {
      return { error: "Invalid category selection." };
    }
    const found = await Category.countDocuments({ _id: { $in: raw.allowedCategories } });
    if (found !== raw.allowedCategories.length)
      return { error: "A selected category no longer exists." };
    value["limits.allowedCategories"] = raw.allowedCategories;
  }
  return { value };
}

// GET — Every vendor with product counts and sales (staff can view; only admins can change)
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request, STAFF_ROLES);
    if (!auth.ok) return auth.response;

    await connectDB();
    const vendors = await Vendor.find().sort({ createdAt: -1 }).lean();
    const ids = vendors.map((v) => v._id);
    const [counts, sales, pendingReview] = await Promise.all([
      getVendorProductCounts(ids),
      getVendorSales(vendors),
      Product.countDocuments({
        vendor: { $ne: null },
        approvalStatus: "pending",
        status: { $ne: "archived" },
      }),
    ]);

    const items = vendors.map((v) => ({
      ...JSON.parse(JSON.stringify(v)),
      products: counts.get(String(v._id)) ?? { total: 0, live: 0, pending: 0 },
      sales: sales.get(String(v._id)),
    }));

    return NextResponse.json({ items, pendingReview });
  } catch (err) {
    return serverError("List vendors error", err, "Failed to load vendors");
  }
}

// POST — Create a vendor store and its login account (admins only)
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request, ADMIN_ROLES);
    if (!auth.ok) return auth.response;

    const data = await request.json().catch(() => ({}));
    const storeName = cleanString(data.storeName, 120);
    const contactName = cleanString(data.contactName, 100);
    const email = cleanString(data.email, 254)?.toLowerCase();

    if (!storeName || storeName.length < 2) {
      return NextResponse.json({ error: "Enter the store name." }, { status: 400 });
    }
    if (!contactName) {
      return NextResponse.json({ error: "Enter the contact person's name." }, { status: 400 });
    }
    if (!isEmail(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    const commission = toNonNegativeNumber(data.commissionRate ?? 10, 60);
    if (commission === undefined) {
      return NextResponse.json(
        { error: "Commission must be between 0% and 60%." },
        { status: 400 },
      );
    }
    const status: VendorStatus = STATUSES.includes(data.status) ? data.status : "approved";

    let password: string | undefined = data.password || undefined;
    if (password) {
      const weak = passwordStrengthError(password);
      if (weak) return NextResponse.json({ error: weak }, { status: 400 });
    }

    await connectDB();

    const limits = await cleanLimits(data.limits);
    if ("error" in limits) return NextResponse.json({ error: limits.error }, { status: 400 });

    // Reuse an existing customer account, but never turn a staff/admin account into a vendor
    let user = await User.findOne({ email });
    let generatedPassword: string | undefined;
    if (user) {
      if (user.role !== "customer") {
        return NextResponse.json(
          {
            error:
              user.role === "vendor"
                ? "This email already belongs to a vendor."
                : "This email belongs to a team account and can't be used for a vendor.",
          },
          { status: 409 },
        );
      }
      user.role = "vendor";
      user.sessionVersion = (user.sessionVersion ?? 0) + 1;
      if (password) user.password = await bcryptjs.hash(password, 12);
      await user.save();
    } else {
      if (!password) {
        password = generateStrongPassword();
        generatedPassword = password;
      }
      user = await User.create({
        name: contactName,
        email,
        phone: cleanString(data.phone, 30),
        password: await bcryptjs.hash(password, 12),
        role: "vendor",
        provider: "credentials",
        emailVerified: true,
      });
    }

    const base = slugify(storeName, { lower: true, strict: true }) || "vendor";
    const slug = (await Vendor.exists({ slug: base }))
      ? `${base}-${Date.now().toString(36)}`
      : base;

    const limitValues = limits.value;
    const vendor = await Vendor.create({
      user: user._id,
      storeName,
      slug,
      contactName,
      email,
      phone: cleanString(data.phone, 30),
      district: cleanString(data.district, 60),
      pickupAddress: cleanString(data.pickupAddress, 300),
      description: cleanString(data.description, 2000) ?? "",
      status,
      commissionRate: commission,
      approvedAt: status === "approved" ? new Date() : undefined,
      adminNotes: cleanString(data.adminNotes, 2000) ?? "",
      limits: {
        maxProducts: (limitValues["limits.maxProducts"] as number | undefined) ?? 50,
        maxDiscountPercent: (limitValues["limits.maxDiscountPercent"] as number | undefined) ?? 50,
        requireProductApproval:
          (limitValues["limits.requireProductApproval"] as boolean | undefined) ?? true,
        allowedCategories: (limitValues["limits.allowedCategories"] as string[] | undefined) ?? [],
      },
    });

    return NextResponse.json(
      {
        vendor: vendor.toJSON(),
        // Shown to the admin once so they can pass it on; it is never stored in plain text
        temporaryPassword: generatedPassword,
        linkedExistingAccount: !generatedPassword && !data.password,
      },
      { status: 201 },
    );
  } catch (err) {
    return serverError("Create vendor error", err, "Failed to create vendor");
  }
}

// PATCH — Change a vendor's status, commission, limits or details (admins only)
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAuth(request, ADMIN_ROLES);
    if (!auth.ok) return auth.response;

    const data = await request.json().catch(() => ({}));
    if (!isObjectId(data.id)) {
      return NextResponse.json({ error: "Vendor ID is required." }, { status: 400 });
    }

    await connectDB();
    const vendor = await Vendor.findById(data.id);
    if (!vendor) return NextResponse.json({ error: "Vendor not found." }, { status: 404 });

    const set: Record<string, unknown> = {};

    const storeName = cleanString(data.storeName, 120);
    if (storeName) set.storeName = storeName;
    for (const [key, max] of [
      ["contactName", 100],
      ["phone", 30],
      ["district", 60],
      ["pickupAddress", 300],
      ["description", 2000],
      ["adminNotes", 2000],
    ] as const) {
      if (data[key] !== undefined) set[key] = cleanString(data[key], max) ?? "";
    }

    if (data.commissionRate !== undefined) {
      const commission = toNonNegativeNumber(data.commissionRate, 60);
      if (commission === undefined) {
        return NextResponse.json(
          { error: "Commission must be between 0% and 60%." },
          { status: 400 },
        );
      }
      set.commissionRate = commission;
    }

    const limits = await cleanLimits(data.limits);
    if ("error" in limits) return NextResponse.json({ error: limits.error }, { status: 400 });
    Object.assign(set, limits.value);

    let statusChanged = false;
    if (data.status !== undefined) {
      if (!STATUSES.includes(data.status)) {
        return NextResponse.json({ error: "Invalid status." }, { status: 400 });
      }
      if (data.status !== vendor.status) {
        statusChanged = true;
        set.status = data.status;
        if (data.status === "approved") {
          set.approvedAt = new Date();
          set.suspendedReason = "";
        }
        if (data.status === "suspended") {
          set.suspendedReason = cleanString(data.suspendedReason, 500) ?? "";
        }
      }
    }

    const updated = await Vendor.findByIdAndUpdate(vendor._id, { $set: set }, { new: true });

    // Suspending hides every product of this vendor from the shop at once; approving shows them again.
    // Uses a separate flag so each product's own status and review result are preserved.
    if (statusChanged) {
      await Product.updateMany(
        { vendor: vendor._id },
        { $set: { vendorActive: data.status === "approved" } },
      );
    }

    return NextResponse.json({ vendor: updated?.toJSON() });
  } catch (err) {
    return serverError("Update vendor error", err, "Failed to update vendor");
  }
}
