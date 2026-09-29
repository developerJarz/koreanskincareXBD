import fs from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

import { LOCAL_UPLOAD_DIR } from "@/server/uploads";

// Serves locally stored images (development / self-hosted). Cloudinary images never come here.
export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const parts = (await params).path;
  // Only our own generated file names: folder/yyyy/mm/<hex>.webp — no "..", no other files
  if (
    parts.length !== 4 ||
    !["products", "brands", "categories", "site"].includes(parts[0]) ||
    !/^\d{4}$/.test(parts[1]) ||
    !/^\d{2}$/.test(parts[2]) ||
    !/^[a-f0-9]{24}\.webp$/.test(parts[3])
  ) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const data = await fs.readFile(path.join(LOCAL_UPLOAD_DIR, ...parts));
    return new NextResponse(new Uint8Array(data), {
      headers: {
        "Content-Type": "image/webp",
        // File names are random and never reused, so they can be cached forever
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
