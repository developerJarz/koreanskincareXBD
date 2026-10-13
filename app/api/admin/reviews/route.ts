import { Types } from "mongoose";
import { NextRequest, NextResponse } from "next/server";

import { connectDB } from "@/server/db/connection";
import { Product, Review } from "@/server/db/models";
import { requirePermission } from "@/server/auth/permissions";
import { serverError } from "@/server/auth/session";
import { audit } from "@/server/audit";
import { cleanString, escapeRegex, isObjectId } from "@/server/security/validation";

/** Keeps a product's star rating and review count in line with its approved reviews. */
async function refreshProductRating(productId: Types.ObjectId | string) {
  const [row] = await Review.aggregate([
    { $match: { product: new Types.ObjectId(String(productId)), status: "approved" } },
    { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);
  await Product.updateOne(
    { _id: productId },
    { $set: { avgRating: row ? Math.round(row.avg * 10) / 10 : 0, totalReviews: row?.count ?? 0 } },
  );
}

/** GET — Reviews. ?status=pending|approved|rejected|all &rating=1-5 &q= &page= */
export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "reviews.manage");
    if (!auth.ok) return auth.response;

    const sp = new URL(request.url).searchParams;
    const page = Math.max(1, Math.floor(Number(sp.get("page")) || 1));
    const pageSize = 20;
    const filter: Record<string, unknown> = {};
    const status = sp.get("status") ?? "pending";
    if (["pending", "approved", "rejected"].includes(status)) filter.status = status;
    const rating = Number(sp.get("rating"));
    if (Number.isInteger(rating) && rating >= 1 && rating <= 5) filter.rating = rating;
    const q = sp.get("q")?.trim().slice(0, 100);
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      filter.$or = [{ comment: rx }, { title: rx }, { userName: rx }];
    }

    await connectDB();
    const [items, total, counts, avg] = await Promise.all([
      Review.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .populate("product", "name slug images")
        .lean(),
      Review.countDocuments(filter),
      Review.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Review.aggregate([
        { $match: { status: "approved" } },
        { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
      ]),
    ]);

    return NextResponse.json({
      items: JSON.parse(JSON.stringify(items)),
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      counts: Object.fromEntries(counts.map((c) => [c._id, c.count])),
      averageRating: avg[0]?.avg ?? null,
    });
  } catch (err) {
    return serverError("List reviews error", err, "Couldn't load reviews.");
  }
}

/** PATCH — { id, status?: "approved"|"rejected"|"pending", reply?: string } */
export async function PATCH(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "reviews.manage");
    if (!auth.ok) return auth.response;

    const body = await request.json().catch(() => ({}));
    if (!isObjectId(body.id)) return NextResponse.json({ error: "Review not found." }, { status: 404 });

    await connectDB();
    const review = await Review.findById(body.id);
    if (!review) return NextResponse.json({ error: "Review not found." }, { status: 404 });

    const changes: string[] = [];
    if (body.status !== undefined) {
      if (!["approved", "rejected", "pending"].includes(body.status)) {
        return NextResponse.json({ error: "Invalid status." }, { status: 400 });
      }
      if (review.status !== body.status) {
        review.status = body.status;
        changes.push(body.status);
      }
    }
    if (body.reply !== undefined) {
      const message = cleanString(body.reply, 1000);
      review.reply = message
        ? { message, repliedBy: auth.user._id, repliedAt: new Date() }
        : { message: undefined, repliedBy: undefined, repliedAt: undefined };
      changes.push(message ? "replied" : "removed reply");
    }
    await review.save();
    await refreshProductRating(review.product);

    audit(request, auth.user, {
      action: "review.update",
      summary: `Review by ${review.userName} (${review.rating}★): ${changes.join(", ") || "no change"}`,
      entity: "Review",
      entityId: body.id,
    });
    return NextResponse.json(review.toJSON());
  } catch (err) {
    return serverError("Update review error", err, "Couldn't update the review.");
  }
}

/** DELETE — { id } */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "reviews.manage");
    if (!auth.ok) return auth.response;
    const body = await request.json().catch(() => ({}));
    if (!isObjectId(body.id)) return NextResponse.json({ error: "Review not found." }, { status: 404 });

    await connectDB();
    const review = await Review.findByIdAndDelete(body.id);
    if (!review) return NextResponse.json({ error: "Review not found." }, { status: 404 });
    await refreshProductRating(review.product);
    audit(request, auth.user, {
      action: "review.delete",
      summary: `Deleted a ${review.rating}★ review by ${review.userName}`,
      entity: "Review",
      entityId: body.id,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return serverError("Delete review error", err, "Couldn't delete the review.");
  }
}
