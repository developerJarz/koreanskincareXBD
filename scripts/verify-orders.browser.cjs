/* Run with PLAYWRIGHT_MODULE_PATH pointing to an installed Playwright package.
 * The temporary preview renders the real components; API fixtures never change real orders.
 */
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || "playwright");

async function main() {
  const root = path.resolve(__dirname, "..");
  const fixtureDirectory = path.join(root, "app", "orders-verification");
  const fixtureFile = path.join(fixtureDirectory, "page.tsx");
  const schemaDirectory = path.join(fixtureDirectory, "schema");
  const schemaFile = path.join(schemaDirectory, "route.ts");
  const output = path.join(root, "test-results", "orders");
  await fs.mkdir(output, { recursive: true });
  await fs.mkdir(fixtureDirectory, { recursive: true });
  await fs.mkdir(schemaDirectory, { recursive: true });
  await fs.writeFile(
    schemaFile,
    `import { Order } from "@/server/db/models/order.model";
export function GET() { return Response.json({ hasOrderLocation: Boolean(Order.schema.path("orderLocation")) }); }`,
    { flag: "wx" },
  );
  await fs.writeFile(
    fixtureFile,
    `"use client";
import { useState } from "react";
import { OrderManagementModule } from "@/components/admin/OrderManagementModule";
import { AccessProvider } from "@/components/admin/shared";
import type { Permission } from "@/lib/permissions";
export default function Preview() {
  const [readOnly, setReadOnly] = useState(false);
  const [invoice, setInvoice] = useState("");
  const permissions = (readOnly ? ["orders.view"] : ["orders.view", "orders.manage", "returns.manage", "invoices.manage"]) as Permission[];
  return <AccessProvider value={{ permissions, userId: "test", role: "admin" }}><main className="mx-auto flex max-w-[1280px] flex-col gap-4 p-4 sm:p-8"><div><button onClick={() => setReadOnly(!readOnly)}>Toggle read-only preview</button><p>{invoice && "Invoice requested: " + invoice}</p></div><OrderManagementModule onCreateInvoice={readOnly ? undefined : setInvoice} /></main></AccessProvider>;
}`,
    { flag: "wx" },
  );
  let browser;
  let currentPage;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1100 },
      permissions: ["clipboard-read", "clipboard-write"],
    });
    const page = await context.newPage();
    currentPage = page;
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const base = {
      _id: "507f1f77bcf86cd799439011",
      orderNumber: "NB-TEST-001",
      items: [
        {
          product: "p1",
          productName: "Daily hydration serum",
          variant: { size: "50 ml" },
          price: 800,
          quantity: 2,
          total: 1600,
        },
      ],
      subtotal: 1600,
      shippingCost: 70,
      discount: 100,
      couponCode: "WELCOME",
      total: 1570,
      status: "pending",
      paymentStatus: "pending",
      paymentMethod: "COD",
      guestEmail: "customer@example.com",
      shippingAddress: {
        fullName: "Test Customer",
        phone: "01700000000",
        division: "Dhaka",
        district: "Dhaka",
        area: "Dhanmondi",
        streetAddress: "Test delivery address",
        postalCode: "1205",
      },
      orderLocation: {
        status: "located",
        city: "Dhaka",
        region: "Dhaka Division",
        country: "Bangladesh",
        countryCode: "BD",
        source: "ipwhois",
        capturedAt: "2026-11-03T08:00:00.000Z",
      },
      createdAt: "2026-11-03T08:00:00.000Z",
      updatedAt: "2026-11-03T08:00:00.000Z",
      courierName: "Pathao",
      trackingId: "TRACK-TEST-1",
      trackingUrl: "https://example.com/tracking/1",
      notes: "Pack carefully",
    };
    const orders = [
      structuredClone(base),
      {
        ...structuredClone(base),
        _id: "507f1f77bcf86cd799439012",
        orderNumber: "NB-TEST-002",
        status: "cancelled",
        orderLocation: undefined,
        trackingUrl: "javascript:alert(1)",
        cancelReason: "Customer requested cancellation",
      },
      {
        ...structuredClone(base),
        _id: "507f1f77bcf86cd799439013",
        orderNumber: "NB-TEST-003",
        orderLocation: { status: "private_network", capturedAt: base.createdAt },
      },
    ];
    const patches = [];
    const listRequests = [];
    await page.route("**/api/orders**", async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const id = url.pathname.split("/")[3];
      if (id) {
        const item = orders.find((order) => order._id === id);
        if (request.method() === "PATCH") {
          const body = request.postDataJSON();
          patches.push({ id, ...body });
          Object.assign(item, body, { updatedAt: new Date().toISOString() });
        }
        return route.fulfill({ json: item });
      }
      listRequests.push(url.search);
      let items = orders.filter(
        (order) =>
          (!url.searchParams.get("status") || order.status === url.searchParams.get("status")) &&
          (!url.searchParams.get("paymentStatus") ||
            order.paymentStatus === url.searchParams.get("paymentStatus")) &&
          (!url.searchParams.get("q") || order.orderNumber.includes(url.searchParams.get("q"))),
      );
      const statusCounts = {};
      for (const order of orders)
        statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
      return route.fulfill({ json: { items, total: items.length, totalPages: 1, statusCounts } });
    });
    const url = `${process.env.ORDERS_TEST_ORIGIN || "http://localhost:3000"}/orders-verification`;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120000 });
    await page.getByRole("button", { name: "NB-TEST-001", exact: true }).waitFor();
    console.log("Order list rendered.");
    await page.screenshot({ path: path.join(output, "orders-desktop.png"), fullPage: true });
    const downloadEvent = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export", exact: true }).click();
    const download = await downloadEvent;
    await download.saveAs(path.join(output, "orders.csv"));
    assert.match(
      await fs.readFile(path.join(output, "orders.csv"), "utf8"),
      /Checkout city \(approximate\)/,
    );
    await page.getByRole("button", { name: "NB-TEST-001", exact: true }).click();
    await page.getByRole("heading", { name: "Customer location", exact: true }).waitFor();
    console.log("Full-width details rendered.");
    assert.equal(await page.getByRole("dialog").count(), 0);
    assert.match(await page.locator("aside").innerText(), /Dhaka Division, Bangladesh/);
    const deliveryBox = await page
      .getByRole("heading", { name: "Deliver to", exact: true })
      .boundingBox();
    const cityBox = await page
      .getByRole("heading", { name: "Customer location", exact: true })
      .boundingBox();
    assert.ok(cityBox.y > deliveryBox.y && Math.abs(cityBox.x - deliveryBox.x) < 2);
    await page.getByRole("button", { name: "Copy delivery details", exact: true }).click();
    assert.match(
      await page.evaluate(() => navigator.clipboard.readText()),
      /Test delivery address/,
    );
    assert.equal(
      await page.getByRole("link", { name: "Track shipment" }).getAttribute("href"),
      "https://example.com/tracking/1",
    );
    await page.getByLabel("Payment status", { exact: true }).selectOption("paid");
    await page.waitForFunction(
      () => document.querySelector("#order-payment-status")?.value === "paid",
    );
    await page.getByLabel("Internal note", { exact: true }).fill("New packing note");
    page.once("dialog", (dialog) => dialog.dismiss());
    await page.getByRole("button", { name: "Back to orders", exact: true }).click();
    assert.equal(
      await page.getByLabel("Internal note", { exact: true }).inputValue(),
      "New packing note",
    );
    await page.getByLabel("Order status", { exact: true }).selectOption("processing");
    await page
      .getByRole("button", { name: "Save details", exact: true })
      .waitFor({ state: "visible" });
    await page.waitForFunction(
      () => document.querySelector('select[aria-label="Order status"]')?.value === "processing",
    );
    assert.equal(
      await page.getByLabel("Internal note", { exact: true }).inputValue(),
      "New packing note",
    );
    await page.getByRole("button", { name: "Save details", exact: true }).click();
    await page.getByRole("status").filter({ hasText: "All details saved" }).waitFor();
    assert.ok(patches.some((patch) => patch.notes === "New packing note"));
    await page.screenshot({ path: path.join(output, "order-detail-desktop.png"), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(output, "order-detail-mobile.png"), fullPage: true });
    assert.ok(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      "mobile detail overflow",
    );
    await page.getByRole("button", { name: "Back to orders", exact: true }).click();
    await Promise.all([
      page.waitForResponse((response) => response.url().includes("paymentStatus=paid")),
      page.getByLabel("Filter by payment status", { exact: true }).selectOption("paid"),
    ]);
    assert.ok(listRequests.some((query) => query.includes("paymentStatus=paid")));
    await page.getByRole("button", { name: "Reset filters", exact: true }).click();
    await page.getByRole("button", { name: "NB-TEST-002", exact: true }).waitFor();
    await page.screenshot({ path: path.join(output, "orders-mobile.png"), fullPage: true });
    assert.ok(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      "mobile list overflow",
    );
    await page.setViewportSize({ width: 320, height: 760 });
    await page
      .getByRole("tablist", { name: "Date range", exact: true })
      .getByRole("tab", { name: "Custom", exact: true })
      .click();
    assert.ok(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
      "custom date filters overflow on a narrow phone",
    );
    await page
      .getByRole("tablist", { name: "Date range", exact: true })
      .getByRole("tab", { name: "All time", exact: true })
      .click();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole("button", { name: "NB-TEST-002", exact: true }).click();
    await page.getByText("Location unavailable", { exact: true }).waitFor();
    assert.match(await page.locator("aside").innerText(), /IP location was not recorded/);
    assert.equal(await page.getByRole("link", { name: "Track shipment" }).count(), 0);
    assert.equal(await page.getByRole("list", { name: "Fulfillment progress" }).count(), 0);
    await page.getByRole("button", { name: "Back to orders", exact: true }).click();
    await page.getByRole("button", { name: "NB-TEST-003", exact: true }).click();
    await page.getByText("This order was placed from localhost or a private network.").waitFor();
    await page.getByLabel("Order status", { exact: true }).selectOption("cancelled");
    await page.getByRole("dialog").waitFor();
    await page.getByRole("button", { name: "Don't restock", exact: true }).click();
    await page.waitForFunction(
      () => document.querySelector('select[aria-label="Order status"]')?.value === "cancelled",
    );
    assert.ok(patches.some((patch) => patch.status === "cancelled" && patch.restock === false));
    await page.getByRole("button", { name: "Create invoice", exact: true }).click();
    await page.getByText(`Invoice requested: ${orders[2]._id}`, { exact: true }).waitFor();
    await page.getByRole("button", { name: "Toggle read-only preview" }).click();
    assert.equal(await page.getByLabel("Order status", { exact: true }).count(), 0);
    assert.equal(await page.getByLabel("Internal note", { exact: true }).count(), 0);
    assert.equal(
      await page.getByRole("button", { name: "Create invoice", exact: true }).count(),
      0,
    );
    const schemaResponse = await context.request.get(
      `${process.env.ORDERS_TEST_ORIGIN || "http://localhost:3000"}/orders-verification/schema`,
    );
    const schema = await schemaResponse.json();
    console.log("Running server recognizes location schema:", schema.hasOrderLocation);
    assert.equal(
      schema.hasOrderLocation,
      true,
      "Restart the local server to reload its cached order model",
    );
    assert.deepEqual(errors, []);
    console.log(
      "PASS: full-width details; city below Deliver to; desktop/mobile layout; copy/contact/tracking; CSV; payment filter/reset; status, payment, notes and cancellation saves; legacy/private location; safe links; invoice; read-only permissions; no browser errors.",
    );
  } catch (error) {
    if (currentPage) {
      console.error("Preview URL:", currentPage.url());
      console.error(
        "Preview content:",
        (await currentPage.locator("body").innerText()).slice(0, 3000),
      );
      await currentPage
        .screenshot({ path: path.join(output, "failure.png"), fullPage: true })
        .catch(() => {});
    }
    throw error;
  } finally {
    await browser?.close();
    await fs.unlink(schemaFile);
    await fs.rmdir(schemaDirectory);
    await fs.unlink(fixtureFile);
    await fs.rmdir(fixtureDirectory);
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
