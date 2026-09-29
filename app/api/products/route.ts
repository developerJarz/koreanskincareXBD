import { NextRequest, NextResponse } from "next/server";

import { parseListingParams, queryProducts } from "@/server/catalog";
import { getClientIp, rateLimit } from "@/server/security/rate-limit";

/**
 * GET /api/products — public, paginated product search/listing.
 * ?q= &category=<slug> &brand=<slug,slug> &minPrice= &maxPrice= &rating= &inStock=1 &sale=1
 * &flag=featured|bestseller|new|trending &sort= &page= &pageSize= (max 48)
 * Only published, approved products; never cost prices or internal fields.
 */
export async function GET(request: NextRequest) {
  const limited = rateLimit(`products:${getClientIp(request)}`, 240, 60_000);
  if (limited) return limited;

  try {
    const sp = Object.fromEntries(new URL(request.url).searchParams);
    const params = parseListingParams(sp);
    const pageSize = Number(sp.pageSize);
    const result = await queryProducts({
      ...params,
      pageSize: Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 24,
    });
    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" },
    });
  } catch (err) {
    console.error("Public product listing error:", err);
    return NextResponse.json({ error: "Couldn't load products." }, { status: 500 });
  }
}
