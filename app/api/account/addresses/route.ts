import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/server/db/connection";
import { Address } from "@/server/db/models";
import { requireAuth, serverError } from "@/server/auth/session";
import { cleanString, isObjectId } from "@/server/security/validation";
import { BD_DISTRICTS, BD_DIVISIONS } from "@/lib/constants";

const MAX_ADDRESSES = 10;

/** Validates an address from the account page. Every address belongs to the signed-in user. */
function readAddress(
  raw: any,
): { value: Record<string, unknown> } | { fields: Record<string, string> } {
  const fields: Record<string, string> = {};
  const value = {
    label: cleanString(raw?.label, 30) || "Home",
    fullName: cleanString(raw?.fullName, 100) ?? "",
    phone: cleanString(raw?.phone, 20) ?? "",
    division: cleanString(raw?.division, 60) ?? "",
    district: cleanString(raw?.district, 60) ?? "",
    area: cleanString(raw?.area, 100) ?? "",
    streetAddress: cleanString(raw?.streetAddress, 300) ?? "",
    postalCode: cleanString(raw?.postalCode, 10) ?? "",
    isDefault: Boolean(raw?.isDefault),
  };
  if (value.fullName.length < 2) fields.fullName = "Enter the receiver's name.";
  if (!/^(\+?880|0)1[3-9]\d{8}$/.test(value.phone.replace(/[\s-]/g, "")))
    fields.phone = "Enter a Bangladeshi mobile number, e.g. 01711223344.";
  if (!(BD_DIVISIONS as readonly string[]).includes(value.division))
    fields.division = "Choose a division.";
  else if (!BD_DISTRICTS[value.division]?.includes(value.district))
    fields.district = "Choose a district.";
  if (!value.area) fields.area = "Enter the area or thana.";
  if (value.streetAddress.length < 4) fields.streetAddress = "Enter the house, road and street.";
  if (value.postalCode && !/^\d{4}$/.test(value.postalCode))
    fields.postalCode = "Postal codes are 4 digits.";
  return Object.keys(fields).length ? { fields } : { value };
}

async function list(userId: unknown) {
  const items = await Address.find({ user: userId }).sort({ isDefault: -1, updatedAt: -1 }).lean();
  return JSON.parse(JSON.stringify(items));
}

/** Only one default address; the first address is always the default. */
async function keepOneDefault(userId: unknown, preferId?: string) {
  const all = await Address.find({ user: userId }).select("_id isDefault").sort({ updatedAt: -1 });
  if (all.length === 0) return;
  const keep =
    (preferId && all.find((a) => String(a._id) === preferId)) ||
    all.find((a) => a.isDefault) ||
    all[0];
  await Address.updateMany({ user: userId, _id: { $ne: keep._id } }, { isDefault: false });
  if (!keep.isDefault) await Address.updateOne({ _id: keep._id }, { isDefault: true });
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;
    await connectDB();
    return NextResponse.json(await list(auth.user._id));
  } catch (err) {
    return serverError("List addresses error", err, "Couldn't load your addresses.");
  }
}

// POST — add an address
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;
    await connectDB();

    if ((await Address.countDocuments({ user: auth.user._id })) >= MAX_ADDRESSES) {
      return NextResponse.json(
        { error: `You can save up to ${MAX_ADDRESSES} addresses.` },
        { status: 400 },
      );
    }
    const checked = readAddress(await request.json().catch(() => ({})));
    if ("fields" in checked) {
      return NextResponse.json(
        { error: "Please check the address.", fields: checked.fields },
        { status: 400 },
      );
    }
    const created = await Address.create({ ...checked.value, user: auth.user._id });
    await keepOneDefault(auth.user._id, checked.value.isDefault ? String(created._id) : undefined);
    return NextResponse.json(await list(auth.user._id), { status: 201 });
  } catch (err) {
    return serverError("Add address error", err, "Couldn't save the address.");
  }
}

// PUT — edit one of your addresses: { id, ...fields }
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;
    await connectDB();

    const body = await request.json().catch(() => ({}));
    if (!isObjectId(body.id))
      return NextResponse.json({ error: "Address not found." }, { status: 404 });
    const checked = readAddress(body);
    if ("fields" in checked) {
      return NextResponse.json(
        { error: "Please check the address.", fields: checked.fields },
        { status: 400 },
      );
    }
    // Ownership: the filter includes the user, so nobody can edit someone else's address
    const updated = await Address.findOneAndUpdate(
      { _id: body.id, user: auth.user._id },
      checked.value,
      { new: true },
    );
    if (!updated) return NextResponse.json({ error: "Address not found." }, { status: 404 });
    await keepOneDefault(auth.user._id, checked.value.isDefault ? body.id : undefined);
    return NextResponse.json(await list(auth.user._id));
  } catch (err) {
    return serverError("Update address error", err, "Couldn't save the address.");
  }
}

// DELETE ?id=<address id>
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;
    await connectDB();

    const id = new URL(request.url).searchParams.get("id");
    if (!isObjectId(id)) return NextResponse.json({ error: "Address not found." }, { status: 404 });
    await Address.deleteOne({ _id: id, user: auth.user._id });
    await keepOneDefault(auth.user._id);
    return NextResponse.json(await list(auth.user._id));
  } catch (err) {
    return serverError("Delete address error", err, "Couldn't delete the address.");
  }
}
