import assert from "node:assert/strict";
import fs from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

async function loadLocation() {
  const source = await fs.readFile(
    new URL("../src/server/orders/location.ts", import.meta.url),
    "utf8",
  );
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}`);
}

const { captureOrderLocation } = await loadLocation();
const publicHeaders = (ip = "8.8.8.8") => new Headers({ "x-forwarded-for": ip });
const response = (body) => new Response(JSON.stringify(body));
const city = {
  success: true,
  city: "Dhaka",
  region: "Dhaka Division",
  country: "Bangladesh",
  country_code: "BD",
};

test("captures the checkout client's city through HTTPS without persisting the IP", async () => {
  let called;
  const result = await captureOrderLocation(publicHeaders("8.8.8.8, 10.0.0.2"), {
    trustedVercel: false,
    fetcher: async (url, options) => {
      called = String(url);
      assert.ok(options.signal instanceof AbortSignal);
      return response(city);
    },
  });
  assert.equal(called, "https://ipwho.is/8.8.8.8?fields=success,city,region,country,country_code");
  assert.equal(result.status, "located");
  assert.equal(result.city, "Dhaka");
  assert.equal(result.countryCode, "BD");
  assert.equal(result.source, "ipwhois");
  assert.ok(result.capturedAt instanceof Date);
  assert.equal(result.ipAddress, undefined);
});

test("checkout location persists in the model but is removed from customer JSON", async () => {
  const source = await fs.readFile(
    new URL("../src/server/db/models/order.model.ts", import.meta.url),
    "utf8",
  );
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  const resolved = outputText.replace(
    'from "mongoose"',
    `from "${import.meta.resolve("mongoose")}"`,
  );
  const { Order } = await import(
    `data:text/javascript;base64,${Buffer.from(resolved).toString("base64")}`
  );
  const order = new Order({
    orderNumber: "TEST-001",
    subtotal: 100,
    total: 170,
    paymentMethod: "COD",
    orderLocation: {
      status: "located",
      city: "Dhaka",
      countryCode: "BD",
      source: "ipwhois",
      capturedAt: new Date(),
    },
  });
  assert.equal(order.toObject().orderLocation.city, "Dhaka");
  assert.equal(order.toJSON().orderLocation, undefined);
  assert.equal(JSON.parse(JSON.stringify(order)).orderLocation, undefined);
  const legacy = new Order({ orderNumber: "OLD-001" });
  assert.equal(legacy.toObject().orderLocation, undefined);
});

test("skips private, loopback, reserved and missing client IPs", async () => {
  for (const ip of [
    "127.0.0.1",
    "10.1.2.3",
    "172.16.4.5",
    "192.168.1.3",
    "100.64.0.1",
    "169.254.1.1",
    "192.0.2.1",
    "198.51.100.3",
    "203.0.113.1",
    "224.0.0.1",
    "::1",
    "::ffff:127.0.0.1",
    "::ffff:c0a8:101",
    "fc00::1",
    "fe80::1",
    "2001:db8::1",
    "not-an-ip",
    "",
  ]) {
    let calls = 0;
    const result = await captureOrderLocation(publicHeaders(ip), {
      trustedVercel: false,
      fetcher: async () => {
        calls++;
        return response(city);
      },
    });
    assert.notEqual(result.status, "located", ip);
    assert.equal(calls, 0, ip);
  }
});

test("accepts public IPv6 clients", async () => {
  const result = await captureOrderLocation(publicHeaders("2606:4700:4700::1111"), {
    trustedVercel: false,
    fetcher: async () => response(city),
  });
  assert.equal(result.city, "Dhaka");
});

test("uses decoded Vercel city headers only on a trusted Vercel deployment", async () => {
  const headers = new Headers({
    "x-forwarded-for": "8.8.8.8",
    "x-vercel-ip-city": "New%20York",
    "x-vercel-ip-country": "US",
    "x-vercel-ip-country-region": "NY",
  });
  const trusted = await captureOrderLocation(headers, {
    trustedVercel: true,
    fetcher: async () => {
      throw new Error("must not fetch");
    },
  });
  assert.equal(trusted.city, "New York");
  assert.equal(trusted.source, "vercel");
  const untrusted = await captureOrderLocation(headers, {
    trustedVercel: false,
    fetcher: async () => response(city),
  });
  assert.equal(untrusted.city, "Dhaka");
});

test("provider errors, partial/malformed data and timeout become unavailable", async () => {
  for (const fetcher of [
    async () => {
      throw new DOMException("timed out", "TimeoutError");
    },
    async () => new Response("rate limit", { status: 429 }),
    async () => new Response("invalid json"),
    async () => response({ success: false, message: "reserved range" }),
    async () => response({ success: true, country: "Bangladesh" }),
    async () => response({ ...city, city: { bad: true } }),
  ]) {
    assert.equal(
      (await captureOrderLocation(publicHeaders(), { trustedVercel: false, fetcher })).status,
      "unavailable",
    );
  }
});
