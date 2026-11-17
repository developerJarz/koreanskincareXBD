import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

// Execute the real API handlers with an isolated database/auth boundary.
// A query returns location only when the handler explicitly requests the private field.
const harness = {
  user: { _id: "buyer-1", role: "admin" },
  permissions: ["orders.view", "orders.manage"],
  selects: [],
  order: {
    _id: "507f1f77bcf86cd799439011",
    orderNumber: "TEST-001",
    user: "buyer-1",
    status: "pending",
    paymentStatus: "pending",
    items: [],
    accessTokenHash: crypto.createHash("sha256").update("buyer-secret").digest("hex"),
    orderLocation: { status: "located", city: "Dhaka", source: "ipwhois", capturedAt: new Date() },
  },
};
globalThis.__orderLocationApiHarness = harness;
const stub = `
const h = globalThis.__orderLocationApiHarness;
function query(many = false, document = false) {
  let selection = "";
  const q = {
    select(value) { selection = value; h.selects.push(value); return q; },
    sort() { return q; }, skip() { return q; }, limit() { return q; }, populate() { return q; }, lean() { return q; },
    then(resolve, reject) {
      let body = structuredClone(h.order);
      if (!selection.includes("+orderLocation")) delete body.orderLocation;
      if (document) body.toJSON = () => { const json = { ...body }; delete json.toJSON; delete json.orderLocation; delete json.accessTokenHash; return json; };
      return Promise.resolve(many ? [body] : body).then(resolve, reject);
    }
  };
  return q;
}
export const Order = { find: () => query(true), findOne: () => query(false, true), findById: () => query(), findByIdAndUpdate: (_id, update) => { Object.assign(h.order, update.$set); return query(); }, countDocuments: async () => 1, aggregate: async () => [{ _id: "pending", count: 1 }] };
export const Coupon = {}, Product = {};
export const connectDB = async () => {};
export const getSessionUser = async () => h.user;
export const requireAuth = async () => ({ ok: true, user: h.user });
export const getAccessProfile = async () => ({ permissions: h.permissions });
export const requirePermission = async () => ({ ok: true, user: h.user, permissions: h.permissions });
export const STAFF_ROLES = ["admin", "super_admin", "staff"];
export const serverError = (_label, error) => { throw error; };
export const isCrossSiteRequest = () => false;
export const getClientIp = () => "127.0.0.1";
export const rateLimit = () => null;
export const cleanString = (value) => typeof value === "string" ? value.trim() : undefined;
export const escapeRegex = (value) => value;
export const isEmail = () => true;
export const isObjectId = (value) => /^[0-9a-f]{24}$/.test(value);
export const createdAtMatch = () => ({}), resolveRange = () => ({});
export const isPubliclyVisible = () => true;
export const recordServerEvent = () => {}, audit = () => {}, revalidateCatalog = () => {};
export const evaluateCoupon = () => {}, getCheckoutConfig = () => {}, shippingCostFor = () => 0;
export const captureOrderLocation = () => {};
`;
const stubUrl = `data:text/javascript;base64,${Buffer.from(stub).toString("base64")}`;
async function handler(file) {
  const source = await fs.readFile(new URL(file, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  const resolved = outputText.replace(
    /from "([^"]+)"/g,
    (_, name) =>
      `from "${name.startsWith("@/") ? stubUrl : import.meta.resolve(name === "next/server" ? "next/server.js" : name)}"`,
  );
  return import(`data:text/javascript;base64,${Buffer.from(resolved).toString("base64")}`);
}
const list = await handler("../app/api/orders/route.ts");
const detail = await handler("../app/api/orders/[id]/route.ts");
const params = { params: Promise.resolve({ id: harness.order._id }) };

test("only staff with order-view permission receive location in order lists", async () => {
  harness.user = { _id: "buyer-1", role: "admin" };
  harness.permissions = ["orders.view"];
  let body = await (await list.GET(new Request("http://localhost/api/orders"))).json();
  assert.equal(body.items[0].orderLocation.city, "Dhaka");
  body = await (await list.GET(new Request("http://localhost/api/orders?mine=1"))).json();
  assert.equal(body.items[0].orderLocation, undefined);
  harness.user.role = "customer";
  body = await (await list.GET(new Request("http://localhost/api/orders"))).json();
  assert.equal(body.items[0].orderLocation, undefined);
  harness.user.role = "staff";
  harness.permissions = [];
  body = await (await list.GET(new Request("http://localhost/api/orders"))).json();
  assert.equal(body.items[0].orderLocation, undefined);
});

test("staff detail includes city while buyer and guest-token detail never expose it", async () => {
  harness.user = { _id: "buyer-1", role: "admin" };
  harness.permissions = ["orders.view"];
  let body = await (
    await detail.GET(new Request("http://localhost/api/orders/TEST-001"), params)
  ).json();
  assert.equal(body.orderLocation.city, "Dhaka");
  assert.equal(body.accessTokenHash, undefined);
  harness.user.role = "customer";
  body = await (
    await detail.GET(new Request("http://localhost/api/orders/TEST-001"), params)
  ).json();
  assert.equal(body.orderLocation, undefined);
  harness.user = null;
  body = await (
    await detail.GET(new Request("http://localhost/api/orders/TEST-001?t=buyer-secret"), params)
  ).json();
  assert.equal(body.orderLocation, undefined);
  assert.equal(body.accessTokenHash, undefined);
});

test("saving courier details retains staff location and ignores client attempts to change it", async () => {
  harness.user = { _id: "staff-1", role: "staff" };
  harness.permissions = ["orders.manage", "orders.view"];
  const request = () =>
    new Request("http://localhost/api/orders/TEST-001", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ courierName: "Pathao", orderLocation: { city: "Forged city" } }),
    });
  let body = await (await detail.PATCH(request(), params)).json();
  assert.equal(body.courierName, "Pathao");
  assert.equal(body.orderLocation.city, "Dhaka");
  harness.permissions = ["orders.manage"];
  body = await (await detail.PATCH(request(), params)).json();
  assert.equal(body.orderLocation, undefined);
});
