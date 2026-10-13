import { NextRequest, NextResponse } from "next/server";

import { requirePermission } from "@/server/auth/permissions";
import { serverError } from "@/server/auth/session";
import { checkDatabase, collectionStats } from "@/server/admin/db-status";
import { isCloudinaryConfigured } from "@/server/uploads";
import { isEmailConfigured } from "@/server/email/mailer";

/** Which services are set up. Only whether keys exist is reported — never their values. */
function services() {
  const has = (...names: string[]) => names.every((n) => Boolean(process.env[n]));
  return [
    { name: "Database (MongoDB)", ok: has("MONGODB_URI"), detail: "MONGODB_URI" },
    {
      name: "Sign-in sessions",
      ok: (process.env.AUTH_SECRET?.length ?? 0) >= 32,
      detail: "AUTH_SECRET (32+ characters)",
    },
    { name: "Image hosting (Cloudinary)", ok: isCloudinaryConfigured(), detail: "CLOUDINARY_*" },
    { name: "Email (SMTP)", ok: isEmailConfigured(), detail: "SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM" },
    { name: "bKash", ok: has("BKASH_APP_KEY", "BKASH_APP_SECRET"), detail: "BKASH_*" },
    { name: "Nagad", ok: has("NAGAD_MERCHANT_ID", "NAGAD_MERCHANT_KEY"), detail: "NAGAD_*" },
    { name: "SSLCommerz", ok: has("SSLCOMMERZ_STORE_ID", "SSLCOMMERZ_STORE_PASSWORD"), detail: "SSLCOMMERZ_*" },
    { name: "Steadfast courier", ok: has("STEADFAST_API_KEY", "STEADFAST_SECRET_KEY"), detail: "STEADFAST_*" },
    { name: "Pathao courier", ok: has("PATHAO_CLIENT_ID", "PATHAO_CLIENT_SECRET"), detail: "PATHAO_*" },
    { name: "RedX courier", ok: has("REDX_API_KEY"), detail: "REDX_API_KEY" },
  ];
}

function runtime() {
  const mem = process.memoryUsage();
  return {
    node: process.version,
    environment: process.env.NODE_ENV ?? "unknown",
    uptimeSeconds: Math.round(process.uptime()),
    memoryMb: Math.round(mem.rss / 1048576),
    heapMb: Math.round(mem.heapUsed / 1048576),
    platform: process.platform,
  };
}

// GET — Database connection, collection sizes, service setup and server info
export async function GET(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "system.view");
    if (!auth.ok) return auth.response;

    const status = await checkDatabase();
    return NextResponse.json({
      database: status,
      collections: status.connected ? await collectionStats() : [],
      services: services(),
      runtime: runtime(),
    });
  } catch (err) {
    return serverError("System health error", err, "Couldn't check system health.");
  }
}

// POST — { action: "connect" } opens / tests the database connection right now
export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "system.view");
    if (!auth.ok) return auth.response;
    const status = await checkDatabase();
    return NextResponse.json({
      database: status,
      collections: status.connected ? await collectionStats() : [],
    });
  } catch (err) {
    return serverError("Database connect error", err, "Couldn't connect to the database.");
  }
}
