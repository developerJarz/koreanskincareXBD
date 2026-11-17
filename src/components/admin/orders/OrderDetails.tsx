"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Copy,
  ExternalLink,
  Globe2,
  Mail,
  MapPin,
  Package,
  Phone,
  ReceiptText,
  Save,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { COURIER_OPTIONS } from "@/lib/checkout";
import { ORDER_STATUS_CONFIG, PAYMENT_STATUS_CONFIG } from "@/lib/constants";
import { optimizedImageUrl } from "@/lib/image";
import { cn } from "@/lib/utils";
import { Field, inputClass, textareaClass } from "../catalog/ui";
import { fmtDateTime, fmtTaka, Panel, Pill } from "../shared";
import type { AdminOrder } from "./types";

const FLOW = ["pending", "confirmed", "processing", "shipped", "delivered"] as const;
const FLOW_ICONS = [ShoppingBag, CheckCheck, Package, Truck, Check];

export function OrderStatusBadge({ status }: { status: AdminOrder["status"] }) {
  const config = ORDER_STATUS_CONFIG[status];
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium">
      <span
        className="size-2 rounded-full"
        style={{ background: config?.color }}
        aria-hidden="true"
      />
      {config?.label ?? status}
    </span>
  );
}

export function OrderPaymentBadge({ status }: { status: string }) {
  return (
    <Pill
      tone={
        status === "paid"
          ? "good"
          : status === "failed"
            ? "bad"
            : status.includes("refund")
              ? "info"
              : "warn"
      }
    >
      {PAYMENT_STATUS_CONFIG[status as keyof typeof PAYMENT_STATUS_CONFIG]?.label ??
        status.replaceAll("_", " ")}
    </Pill>
  );
}

async function copy(value: string, label: string) {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied.`);
  } catch {
    toast.error("Couldn't copy. Select the text and copy it manually.");
  }
}

function safeTrackingUrl(value?: string) {
  try {
    const url = new URL(value ?? "");
    return ["https:", "http:"].includes(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}

export function OrderDetails({
  order,
  canManage,
  canRefund,
  updating,
  onBack,
  onPatch,
  onStatus,
  onCreateInvoice,
}: {
  order: AdminOrder;
  canManage: boolean;
  canRefund: boolean;
  updating: boolean;
  onBack: () => void;
  onPatch: (body: Record<string, unknown>) => Promise<AdminOrder>;
  onStatus: (status: string) => void;
  onCreateInvoice?: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  const address = order.shippingAddress;
  const phone = (address?.phone ?? order.guestPhone ?? "").replace(/[^\d+]/g, "");
  const email = order.user?.email ?? order.guestEmail;
  const fullAddress = [
    address?.streetAddress,
    address?.area,
    address?.district,
    address?.division,
    address?.postalCode,
  ]
    .filter(Boolean)
    .join(", ");
  const location = order.orderLocation;
  const country =
    location?.country ||
    (location?.countryCode
      ? new Intl.DisplayNames(["en"], { type: "region" }).of(
          location.countryCode.toUpperCase().match(/^[A-Z]{2}$/)
            ? location.countryCode.toUpperCase()
            : "ZZ",
        )
      : undefined);
  const currentStep = FLOW.findIndex((status) => status === order.status);
  const trackUrl = safeTrackingUrl(order.trackingUrl);
  const quantity = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [hasEdits, setHasEdits] = useState(false);
  const canLeave = () =>
    !hasEdits || window.confirm("Leave this order and discard your unsaved changes?");
  useEffect(() => {
    if (!hasEdits) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasEdits]);

  const updatePayment = async (paymentStatus: string) => {
    setPaymentSaving(true);
    try {
      await onPatch({ paymentStatus });
      toast.success("Payment status saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't update payment.");
    } finally {
      setPaymentSaving(false);
    }
  };

  return (
    <div className="flex min-w-0 flex-col gap-5" aria-busy={updating}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            if (canLeave()) onBack();
          }}
        >
          <ArrowLeft data-icon="inline-start" />
          Back to orders
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => copy(order.orderNumber, "Order number")}
          >
            <Copy data-icon="inline-start" />
            Copy order number
          </Button>
          {onCreateInvoice && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (canLeave()) onCreateInvoice();
              }}
            >
              <ReceiptText data-icon="inline-start" />
              Create invoice
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
        <div className="flex min-w-0 flex-col gap-2">
          <h2
            ref={heading}
            tabIndex={-1}
            className="break-all font-sans text-2xl font-bold tracking-tight outline-none sm:text-3xl"
          >
            {order.orderNumber}
          </h2>
          <p className="text-xs text-muted-foreground">Placed {fmtDateTime(order.createdAt)}</p>
          <div className="flex flex-wrap items-center gap-2">
            <OrderStatusBadge status={order.status} />
            <OrderPaymentBadge status={order.paymentStatus} />
          </div>
        </div>
        <div className="flex flex-col gap-1 sm:items-end">
          <span className="text-xs text-muted-foreground">Order total</span>
          <p className="text-3xl font-bold tracking-tight tabular-nums">{fmtTaka(order.total)}</p>
          <span className="text-xs text-muted-foreground">
            {quantity} {quantity === 1 ? "item" : "items"} / {order.paymentMethod}
          </span>
        </div>
      </div>

      <div className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(18rem,1fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          <Panel
            title="Order progress"
            action={
              canManage ? (
                <select
                  aria-label="Order status"
                  disabled={updating}
                  value={order.status}
                  onChange={(event) => onStatus(event.target.value)}
                  className={cn(inputClass, "h-9 w-36 shrink-0 text-xs")}
                >
                  {Object.entries(ORDER_STATUS_CONFIG).map(([status, config]) => (
                    <option
                      key={status}
                      value={status}
                      disabled={(status === "returned" || status === "refunded") && !canRefund}
                    >
                      {config.label}
                    </option>
                  ))}
                </select>
              ) : undefined
            }
          >
            {currentStep >= 0 ? (
              <ol aria-label="Fulfillment progress" className="grid grid-cols-5 gap-1 py-2">
                {FLOW.map((status, index) => {
                  const Icon = index < currentStep ? Check : FLOW_ICONS[index];
                  return (
                    <li
                      key={status}
                      aria-current={index === currentStep ? "step" : undefined}
                      className="relative flex min-w-0 flex-col items-center gap-2 text-center"
                    >
                      {index < FLOW.length - 1 && (
                        <span
                          aria-hidden="true"
                          className={`absolute left-1/2 top-4 h-px w-full ${index < currentStep ? "bg-primary" : "bg-border"}`}
                        />
                      )}
                      <span
                        className={`relative flex size-8 items-center justify-center rounded-full border ${index <= currentStep ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground"}`}
                      >
                        <Icon className="size-3.5" aria-hidden="true" />
                      </span>
                      <span
                        className={`text-[10px] sm:text-xs ${index === currentStep ? "font-semibold text-primary" : "text-muted-foreground"}`}
                      >
                        {ORDER_STATUS_CONFIG[status].label}
                      </span>
                    </li>
                  );
                })}
              </ol>
            ) : (
              <div className="flex flex-col gap-2 rounded-xl bg-secondary/60 p-4 text-sm">
                <p className="font-medium">
                  Order {ORDER_STATUS_CONFIG[order.status]?.label.toLowerCase()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {order.cancelReason || "This order is no longer in the active fulfillment flow."}
                </p>
              </div>
            )}
            {order.deliveredAt && (
              <p className="mt-3 text-xs text-muted-foreground">
                Delivered {fmtDateTime(order.deliveredAt)}
              </p>
            )}
          </Panel>

          <Panel
            title="Order items"
            description={`${quantity} ${quantity === 1 ? "item" : "items"} in this order`}
          >
            <ul className="divide-y divide-border">
              {order.items.map((item, index) => (
                <li
                  key={`${item.product}-${index}`}
                  className="flex items-start gap-3 py-4 first:pt-0"
                >
                  {item.productImage ? (
                    <img
                      src={optimizedImageUrl(item.productImage, 112)}
                      alt=""
                      className="size-14 shrink-0 rounded-lg bg-secondary object-cover"
                    />
                  ) : (
                    <span className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-secondary">
                      <ShoppingBag className="size-5 text-muted-foreground" aria-hidden="true" />
                    </span>
                  )}
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="break-words text-sm font-medium">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">
                      {[item.variant?.color, item.variant?.size, item.variant?.sku]
                        .filter(Boolean)
                        .join(" / ")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.quantity} × {fmtTaka(item.price)}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums">
                    {fmtTaka(item.total)}
                  </span>
                </li>
              ))}
            </ul>
            <dl className="ml-auto flex max-w-sm flex-col gap-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between gap-3 text-muted-foreground">
                <dt>Subtotal</dt>
                <dd className="tabular-nums">{fmtTaka(order.subtotal)}</dd>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between gap-3 text-muted-foreground">
                  <dt>
                    Discount{" "}
                    {order.couponCode && <span className="text-xs">({order.couponCode})</span>}
                  </dt>
                  <dd className="tabular-nums">−{fmtTaka(order.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between gap-3 text-muted-foreground">
                <dt>Delivery</dt>
                <dd className="tabular-nums">
                  {order.shippingCost ? fmtTaka(order.shippingCost) : "Free"}
                </dd>
              </div>
              {Boolean(order.tax) && (
                <div className="flex justify-between gap-3 text-muted-foreground">
                  <dt>Tax</dt>
                  <dd>{fmtTaka(order.tax!)}</dd>
                </div>
              )}
              <div className="mt-1 flex justify-between gap-3 border-t border-border pt-3 font-semibold">
                <dt>Total</dt>
                <dd className="tabular-nums">{fmtTaka(order.total)}</dd>
              </div>
            </dl>
          </Panel>

          {canManage && (
            <FulfillmentEditor
              key={order._id}
              order={order}
              updating={updating}
              onPatch={onPatch}
              onDirtyChange={setHasEdits}
            />
          )}
        </div>

        <aside className="flex min-w-0 flex-col gap-5" aria-label="Customer and payment details">
          <Panel
            title="Deliver to"
            action={<MapPin className="size-4 text-muted-foreground" aria-hidden="true" />}
          >
            <div className="flex flex-col gap-3 text-sm">
              <div className="flex items-center gap-3">
                <span
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary font-semibold text-primary"
                  aria-hidden="true"
                >
                  {(address?.fullName || "Guest").trim().slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="break-words font-semibold">
                    {address?.fullName || order.user?.name || "Guest customer"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {order.user ? "Registered customer" : "Guest checkout"}
                  </p>
                </div>
              </div>
              <p className="break-words leading-relaxed text-muted-foreground">
                {fullAddress || "No delivery address available."}
              </p>
              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="flex min-h-9 items-center gap-2 text-foreground hover:text-primary"
                >
                  <Phone className="size-3.5" aria-hidden="true" />
                  {address?.phone ?? order.guestPhone}
                </a>
              )}
              {email && (
                <a
                  href={`mailto:${encodeURIComponent(email)}`}
                  className="flex min-h-9 items-center gap-2 break-all text-xs text-foreground hover:text-primary"
                >
                  <Mail className="size-3.5 shrink-0" aria-hidden="true" />
                  {email}
                </a>
              )}
              {fullAddress && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    copy(
                      [address?.fullName, address?.phone, fullAddress].filter(Boolean).join("\n"),
                      "Delivery details",
                    )
                  }
                >
                  <Copy data-icon="inline-start" />
                  Copy delivery details
                </Button>
              )}
              {order.deliveryNotes && (
                <div className="rounded-lg bg-secondary/60 p-3">
                  <p className="mb-1 text-xs font-medium">Customer note</p>
                  <p className="whitespace-pre-wrap break-words text-xs text-muted-foreground">
                    {order.deliveryNotes}
                  </p>
                </div>
              )}
            </div>
          </Panel>

          <Panel
            title="Customer location"
            description="Approximate city from checkout IP"
            action={<Globe2 className="size-4 text-primary" aria-hidden="true" />}
            className="border-primary/20"
          >
            {location?.status === "located" && location.city ? (
              <div className="flex flex-col gap-2">
                <p className="break-words text-xl font-semibold tracking-tight">{location.city}</p>
                <p className="text-xs text-muted-foreground">
                  {[location.region, country]
                    .filter((value) => value && value !== location.city)
                    .join(", ")}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Captured {fmtDateTime(location.capturedAt)}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium">Location unavailable</p>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {location?.status === "private_network"
                    ? "This order was placed from localhost or a private network."
                    : location
                      ? "The checkout IP lookup could not determine a city."
                      : "IP location was not recorded when this order was placed."}
                </p>
              </div>
            )}
            <p className="mt-3 border-t border-border pt-3 text-[11px] leading-relaxed text-muted-foreground">
              IP location can differ from the customer's actual city. Use the delivery address to
              ship this order.
            </p>
          </Panel>

          <Panel
            title="Payment"
            action={<ReceiptText className="size-4 text-muted-foreground" aria-hidden="true" />}
          >
            <div className="flex flex-col gap-4 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{order.paymentMethod}</span>
                <OrderPaymentBadge status={order.paymentStatus} />
              </div>
              {order.paymentTransactionId && (
                <div className="rounded-lg bg-secondary/60 p-3">
                  <p className="mb-1 text-xs text-muted-foreground">Transaction ID</p>
                  <p className="break-all text-xs font-medium">{order.paymentTransactionId}</p>
                </div>
              )}
              {canManage && (
                <Field label="Payment status" htmlFor="order-payment-status">
                  <select
                    id="order-payment-status"
                    className={inputClass}
                    disabled={paymentSaving || updating}
                    value={order.paymentStatus}
                    onChange={(event) => updatePayment(event.target.value)}
                  >
                    {Object.entries(PAYMENT_STATUS_CONFIG).map(([status, config]) => (
                      <option
                        key={status}
                        value={status}
                        disabled={status.includes("refund") && !canRefund}
                      >
                        {config.label}
                      </option>
                    ))}
                  </select>
                </Field>
              )}
            </div>
          </Panel>

          {(order.courierName || order.trackingId) && (
            <Panel
              title="Shipment"
              action={<Truck className="size-4 text-muted-foreground" aria-hidden="true" />}
            >
              <div className="flex flex-col gap-3 text-sm">
                <p className="font-medium">{order.courierName || "Courier not assigned"}</p>
                {order.trackingId && (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-auto min-h-9 whitespace-normal break-all py-2"
                    onClick={() => copy(order.trackingId!, "Tracking ID")}
                  >
                    <Copy className="shrink-0" />
                    {order.trackingId}
                  </Button>
                )}
                {trackUrl && (
                  <Button variant="outline" asChild>
                    <a href={trackUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink data-icon="inline-start" />
                      Track shipment
                    </a>
                  </Button>
                )}
              </div>
            </Panel>
          )}
        </aside>
      </div>
      <p className="text-xs text-muted-foreground">Last updated {fmtDateTime(order.updatedAt)}</p>
    </div>
  );
}

function FulfillmentEditor({
  order,
  updating,
  onPatch,
  onDirtyChange,
}: {
  order: AdminOrder;
  updating: boolean;
  onPatch: (body: Record<string, unknown>) => Promise<AdminOrder>;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const snapshot = (value: AdminOrder) => ({
    courierName: value.courierName ?? "",
    trackingId: value.trackingId ?? "",
    trackingUrl: value.trackingUrl ?? "",
    paymentTransactionId: value.paymentTransactionId ?? "",
    notes: value.notes ?? "",
  });
  const [fields, setFields] = useState(() => snapshot(order));
  const [saved, setSaved] = useState(() => snapshot(order));
  const [markShipped, setMarkShipped] = useState(false);
  const [saving, setSaving] = useState(false);
  const dirty = Object.keys(fields).some(
    (key) => fields[key as keyof typeof fields] !== saved[key as keyof typeof saved],
  );
  const canShip = ["pending", "confirmed", "processing"].includes(order.status);
  useEffect(() => {
    onDirtyChange(dirty || markShipped);
  }, [dirty, markShipped, onDirtyChange]);

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const updated = await onPatch({
        ...fields,
        ...(canShip && markShipped && fields.trackingId.trim() ? { status: "shipped" } : {}),
      });
      const next = snapshot(updated);
      setFields(next);
      setSaved(next);
      setMarkShipped(false);
      toast.success("Order details saved.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't save order details.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel
      title="Fulfillment & internal notes"
      description="Manage courier, tracking and payment references."
    >
      <form onSubmit={save} className="flex flex-col gap-4">
        <fieldset disabled={saving || updating} className="grid min-w-0 gap-4 sm:grid-cols-2">
          <Field label="Courier" htmlFor="order-courier">
            <input
              id="order-courier"
              list="order-couriers"
              className={inputClass}
              value={fields.courierName}
              onChange={(event) => setFields({ ...fields, courierName: event.target.value })}
              placeholder="Choose a courier"
            />
            <datalist id="order-couriers">
              {COURIER_OPTIONS.map((courier) => (
                <option key={courier} value={courier} />
              ))}
            </datalist>
          </Field>
          <Field label="Tracking / consignment ID" htmlFor="order-tracking">
            <input
              id="order-tracking"
              className={inputClass}
              value={fields.trackingId}
              onChange={(event) => setFields({ ...fields, trackingId: event.target.value })}
              placeholder="Enter tracking ID"
              maxLength={100}
            />
          </Field>
          <Field label="Tracking link" htmlFor="order-tracking-url">
            <input
              id="order-tracking-url"
              type="url"
              pattern="https?://.*"
              className={inputClass}
              value={fields.trackingUrl}
              onChange={(event) => setFields({ ...fields, trackingUrl: event.target.value })}
              placeholder="https://"
              maxLength={500}
            />
          </Field>
          <Field label="Payment transaction ID" htmlFor="order-transaction">
            <input
              id="order-transaction"
              className={inputClass}
              value={fields.paymentTransactionId}
              onChange={(event) =>
                setFields({ ...fields, paymentTransactionId: event.target.value })
              }
              maxLength={100}
            />
          </Field>
          <Field
            label="Internal note"
            htmlFor="order-notes"
            hint="Visible only to staff."
            className="sm:col-span-2"
          >
            <textarea
              id="order-notes"
              className={textareaClass}
              rows={4}
              value={fields.notes}
              onChange={(event) => setFields({ ...fields, notes: event.target.value })}
              placeholder="Add packing instructions or follow-up details…"
              maxLength={2000}
            />
          </Field>
          {canShip && (
            <label className="flex items-center gap-2 text-xs text-muted-foreground sm:col-span-2">
              <input
                type="checkbox"
                className="size-4 accent-primary"
                checked={markShipped}
                disabled={!fields.trackingId.trim()}
                onChange={(event) => setMarkShipped(event.target.checked)}
              />
              Mark as shipped when a tracking ID is saved
            </label>
          )}
        </fieldset>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <span className="text-xs text-muted-foreground" role="status">
            {dirty || markShipped ? "Unsaved changes" : "All details saved"}
          </span>
          <Button type="submit" disabled={saving || updating || (!dirty && !markShipped)}>
            <Save data-icon="inline-start" />
            {saving ? "Saving…" : "Save details"}
          </Button>
        </div>
      </form>
    </Panel>
  );
}
