import { NextResponse } from "next/server";

import { getCheckoutConfig } from "@/server/checkout-config";

/** GET — Public: delivery charges and enabled payment methods for the cart and checkout pages. */
export async function GET() {
  return NextResponse.json(await getCheckoutConfig(), {
    headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
  });
}
