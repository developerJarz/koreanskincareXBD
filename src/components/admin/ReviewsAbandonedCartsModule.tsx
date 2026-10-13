"use client";

import React, { useEffect, useState } from "react";
import { Check, Heart, Mail, MessageSquare, ShoppingCart, Star, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { optimizedImageUrl } from "@/lib/image";
import {
  api,
  iconButton,
  inputClass,
  primaryButton,
  secondaryButton,
  textareaClass,
} from "./catalog/ui";
import {
  EmptyState,
  ErrorNotice,
  fmtNumber,
  fmtRelative,
  fmtTaka,
  PageHeader,
  Pagination,
  Panel,
  Pill,
  qs,
  rangeQuery,
  RangePicker,
  Segmented,
  Skeleton,
  StatTile,
  useAdminData,
  useDebounced,
  type RangeValue,
} from "./shared";

export function ReviewsAbandonedCartsModule() {
  const [tab, setTab] = useState<"reviews" | "carts" | "wishlist">("reviews");
  return (
    <div className="space-y-5">
      <PageHeader
        title="Reviews & carts"
        description="Moderate product reviews and follow up shoppers who left items behind."
      />
      <Segmented
        label="Section"
        value={tab}
        onChange={setTab}
        options={[
          { value: "reviews", label: "Reviews" },
          { value: "carts", label: "Abandoned carts" },
          { value: "wishlist", label: "Wishlists" },
        ]}
      />
      {tab === "reviews" && <Reviews />}
      {tab !== "reviews" && <CartsAndWishlists view={tab} />}
    </div>
  );
}

type Review = {
  _id: string;
  product: { _id: string; name: string; slug: string; images?: string[] } | null;
  userName: string;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  isVerifiedPurchase: boolean;
  status: "pending" | "approved" | "rejected";
  reply?: { message?: string; repliedAt?: string };
  createdAt: string;
};

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i <= value ? "fill-amber-400 text-amber-400" : "text-border"}`}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}

function Reviews() {
  const [status, setStatus] = useState("pending");
  const [rating, setRating] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const q = useDebounced(search);
  useEffect(() => setPage(1), [status, rating, q]);
  const { data, error, reload, setData } = useAdminData<{
    items: Review[];
    total: number;
    totalPages: number;
    counts: Record<string, number>;
    averageRating: number | null;
  }>(`/api/admin/reviews${qs({ status, rating, q, page })}`);
  const [replying, setReplying] = useState<string | null>(null);
  const [reply, setReply] = useState("");

  const update = async (r: Review, body: Record<string, unknown>, message: string) => {
    try {
      const updated = await api<Review>("/api/admin/reviews", {
        method: "PATCH",
        json: { id: r._id, ...body },
      });
      setData((d) =>
        d
          ? {
              ...d,
              items: d.items.map((x) =>
                x._id === r._id ? { ...x, ...updated, product: x.product } : x,
              ),
            }
          : d,
      );
      toast.success(message);
      if (body.status) reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update the review.");
    }
  };
  const remove = async (r: Review) => {
    try {
      await api("/api/admin/reviews", { method: "DELETE", json: { id: r._id } });
      toast.success("Review deleted.");
      reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete.");
    }
  };

  const c = data?.counts ?? {};
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Waiting for approval" value={fmtNumber(c.pending ?? 0)} />
        <StatTile
          label="Published"
          value={fmtNumber(c.approved ?? 0)}
          hint={data?.averageRating ? `${data.averageRating.toFixed(1)}★ average` : undefined}
        />
        <StatTile label="Rejected" value={fmtNumber(c.rejected ?? 0)} />
        <StatTile
          label="All reviews"
          value={fmtNumber((c.pending ?? 0) + (c.approved ?? 0) + (c.rejected ?? 0))}
        />
      </div>
      <Panel>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Segmented
            label="Review status"
            value={status}
            onChange={setStatus}
            options={[
              { value: "pending", label: `Waiting (${c.pending ?? 0})` },
              { value: "approved", label: "Published" },
              { value: "rejected", label: "Rejected" },
              { value: "all", label: "All" },
            ]}
          />
          <select
            aria-label="Rating"
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            className={`${inputClass} h-9 w-auto`}
          >
            <option value="">Any rating</option>
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={r}>
                {r} stars
              </option>
            ))}
          </select>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search text or name"
            aria-label="Search reviews"
            className={`${inputClass} h-9 max-w-xs`}
          />
        </div>
        {error && <ErrorNotice message={error} onRetry={reload} />}
        {!data && !error && <Skeleton className="h-64" />}
        {data && data.items.length === 0 && (
          <EmptyState
            icon={MessageSquare}
            title={status === "pending" ? "No reviews waiting" : "No reviews here"}
          >
            Reviews customers leave on product pages appear here for approval.
          </EmptyState>
        )}
        <ul className="space-y-3">
          {data?.items.map((r) => (
            <li key={r._id} className="rounded-xl border border-border p-3 text-xs">
              <div className="flex flex-wrap items-start gap-3">
                {r.product?.images?.[0] && (
                  <img
                    src={optimizedImageUrl(r.product.images[0], 80)}
                    alt=""
                    className="h-12 w-12 rounded-md object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Stars value={r.rating} />
                    <span className="font-semibold">{r.userName}</span>
                    {r.isVerifiedPurchase && <Pill tone="good">Verified buyer</Pill>}
                    <Pill
                      tone={
                        r.status === "approved" ? "good" : r.status === "rejected" ? "bad" : "warn"
                      }
                    >
                      {r.status}
                    </Pill>
                    <span className="text-muted-foreground">{fmtRelative(r.createdAt)}</span>
                  </div>
                  {r.product && (
                    <a
                      href={`/product/${r.product.slug}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-primary hover:underline"
                    >
                      {r.product.name}
                    </a>
                  )}
                  {r.title && <p className="mt-1 font-medium">{r.title}</p>}
                  <p className="mt-0.5 whitespace-pre-line text-foreground">{r.comment}</p>
                  {r.reply?.message && (
                    <p className="mt-2 rounded-lg bg-secondary/60 p-2">
                      <strong>Your reply:</strong> {r.reply.message}
                    </p>
                  )}
                  {replying === r._id && (
                    <div className="mt-2 space-y-2">
                      <textarea
                        rows={2}
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        className={textareaClass}
                        placeholder="Public reply shown under the review"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className={primaryButton}
                          onClick={() =>
                            update(r, { reply }, "Reply saved.").then(() => setReplying(null))
                          }
                        >
                          Save reply
                        </button>
                        <button
                          type="button"
                          className={secondaryButton}
                          onClick={() => setReplying(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {r.status !== "approved" && (
                    <button
                      type="button"
                      className={`${iconButton} text-emerald-600`}
                      title="Approve"
                      aria-label="Approve review"
                      onClick={() => update(r, { status: "approved" }, "Review published.")}
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  {r.status !== "rejected" && (
                    <button
                      type="button"
                      className={iconButton}
                      title="Reject"
                      aria-label="Reject review"
                      onClick={() => update(r, { status: "rejected" }, "Review hidden.")}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    className={iconButton}
                    title="Reply"
                    aria-label="Reply to review"
                    onClick={() => {
                      setReplying(r._id);
                      setReply(r.reply?.message ?? "");
                    }}
                  >
                    <MessageSquare className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className={`${iconButton} text-destructive`}
                    title="Delete"
                    aria-label="Delete review"
                    onClick={() => remove(r)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {data && (
          <Pagination
            page={page}
            totalPages={data.totalPages}
            total={data.total}
            onPage={setPage}
            label="reviews"
          />
        )}
      </Panel>
    </div>
  );
}

type CartsData = {
  abandoned: {
    count: number;
    value: number;
    identified: number;
    items: {
      visitorId: string;
      sessionId: string;
      userName: string | null;
      userEmail: string | null;
      device?: string;
      location: string | null;
      lastActivityAt: string;
      items: { name: string; quantity: number; value: number }[];
      value: number;
      units: number;
    }[];
  };
  wishlist: {
    lists: number;
    items: number;
    top: {
      id: string;
      name: string;
      slug: string | null;
      stock: number | null;
      price: number | null;
      image: string | null;
      count: number;
    }[];
  };
};

function CartsAndWishlists({ view }: { view: "carts" | "wishlist" }) {
  const [range, setRange] = useState<RangeValue>({ key: "7d" });
  const { data, error, reload } = useAdminData<CartsData>(
    `/api/admin/carts${qs(rangeQuery(range))}`,
  );

  if (error && !data) return <ErrorNotice message={error} onRetry={reload} />;
  if (!data) return <Skeleton className="h-80" />;

  if (view === "wishlist") {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <StatTile label="Customers with a wishlist" value={fmtNumber(data.wishlist.lists)} />
          <StatTile label="Products saved" value={fmtNumber(data.wishlist.items)} />
        </div>
        <Panel
          title="Most wished-for products"
          description="Good candidates for restocking or a promotion"
        >
          {data.wishlist.top.length === 0 ? (
            <EmptyState icon={Heart} title="No wishlists yet" />
          ) : (
            <ul className="divide-y divide-border text-xs">
              {data.wishlist.top.map((w) => (
                <li key={w.id} className="flex items-center gap-3 py-2">
                  {w.image && (
                    <img
                      src={optimizedImageUrl(w.image, 80)}
                      alt=""
                      className="h-10 w-10 rounded-md object-cover"
                    />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{w.name}</span>
                    <span className="text-muted-foreground">
                      {w.price != null ? fmtTaka(w.price) : ""} · {w.stock ?? 0} in stock
                    </span>
                  </span>
                  <span className="shrink-0 font-semibold tabular-nums">
                    <Heart className="mr-1 inline h-3.5 w-3.5 text-rose-500" aria-hidden="true" />
                    {w.count}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    );
  }

  const a = data.abandoned;
  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <RangePicker value={range} onChange={setRange} options={["24h", "7d", "30d", "custom"]} />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatTile
          label="Abandoned carts"
          value={fmtNumber(a.count)}
          hint="added to cart, no order, quiet for 1h+"
        />
        <StatTile label="Value left in carts" value={fmtTaka(a.value)} />
        <StatTile
          label="Shoppers you can contact"
          value={fmtNumber(a.identified)}
          hint="were signed in"
        />
      </div>
      <Panel
        title="Carts left behind"
        description="Rebuilt from site activity (adds minus removals since their last order)"
      >
        {a.items.length === 0 ? (
          <EmptyState icon={ShoppingCart} title="No abandoned carts in this period">
            Carts are recorded from the moment the activity tracker went live.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-border text-xs">
            {a.items.map((cart) => (
              <li key={cart.visitorId} className="flex flex-wrap items-start gap-3 py-3">
                <div className="min-w-[10rem] flex-1">
                  <span className="block font-medium">{cart.userName ?? "Guest shopper"}</span>
                  <span className="block text-muted-foreground">
                    {cart.userEmail ?? [cart.device, cart.location].filter(Boolean).join(" · ")} ·{" "}
                    {fmtRelative(cart.lastActivityAt)}
                  </span>
                </div>
                <div className="min-w-[14rem] flex-[2]">
                  {cart.items.map((i) => (
                    <span key={i.name} className="block">
                      {i.quantity}× {i.name}{" "}
                      <span className="text-muted-foreground">{fmtTaka(i.value)}</span>
                    </span>
                  ))}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-semibold tabular-nums">{fmtTaka(cart.value)}</span>
                  {cart.userEmail && (
                    <a
                      className={secondaryButton}
                      href={`mailto:${cart.userEmail}?subject=${encodeURIComponent("You left something in your cart")}&body=${encodeURIComponent(
                        `Hi ${cart.userName ?? ""},\n\nYou left ${cart.items.map((i) => i.name).join(", ")} in your cart. Complete your order here: ${location.origin}/cart\n`,
                      )}`}
                    >
                      <Mail className="h-3.5 w-3.5" /> Email
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
