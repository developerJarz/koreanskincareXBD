import mongoose from "mongoose";

import { connectDB } from "@/server/db/connection";

const STATES: Record<number, string> = {
  0: "disconnected",
  1: "connected",
  2: "connecting",
  3: "disconnecting",
  99: "uninitialized",
};

export type DbStatus = {
  state: string;
  connected: boolean;
  database?: string;
  host?: string;
  pingMs?: number;
  serverVersion?: string;
  error?: string;
  checkedAt: string;
};

/**
 * Opens (or re-uses) the MongoDB connection and measures a round trip.
 * Never throws — connection problems come back as `error` so the admin page can show them.
 */
export async function checkDatabase(): Promise<DbStatus> {
  const checkedAt = new Date().toISOString();
  try {
    await connectDB();
    const conn = mongoose.connection;
    const db = conn.db;
    if (!db) throw new Error("No database handle");

    const started = performance.now();
    await db.admin().command({ ping: 1 });
    const pingMs = Math.round(performance.now() - started);

    let serverVersion: string | undefined;
    try {
      const info = await db.admin().command({ buildInfo: 1 });
      serverVersion = typeof info.version === "string" ? info.version : undefined;
    } catch {
      serverVersion = undefined;
    }

    return {
      state: STATES[conn.readyState] ?? "unknown",
      connected: conn.readyState === 1,
      database: conn.name,
      host: conn.host,
      pingMs,
      serverVersion,
      checkedAt,
    };
  } catch (err) {
    console.error("Database check failed:", err);
    const conn = mongoose.connection;
    return {
      state: STATES[conn.readyState] ?? "unknown",
      connected: false,
      error:
        err instanceof Error &&
        /ENOTFOUND|ECONNREFUSED|timed out|Server selection/i.test(err.message)
          ? "Can't reach the database server. Check the internet connection and MongoDB Atlas network access."
          : "The database didn't respond. See the server log for details.",
      checkedAt,
    };
  }
}

export type CollectionStat = {
  name: string;
  documents: number;
  sizeBytes: number | null;
  storageBytes: number | null;
  indexBytes: number | null;
};

/** Document counts and sizes per collection (sizes need the $collStats permission; null when unavailable). */
export async function collectionStats(names?: string[]): Promise<CollectionStat[]> {
  await connectDB();
  const db = mongoose.connection.db;
  if (!db) return [];
  const all = (await db.listCollections({}, { nameOnly: true }).toArray())
    .map((c) => c.name)
    .filter((n) => !n.startsWith("system."));
  const list = names ? all.filter((n) => names.includes(n)) : all;

  const stats = await Promise.all(
    list.map(async (name): Promise<CollectionStat> => {
      const coll = db.collection(name);
      try {
        const [row] = await coll
          .aggregate([{ $collStats: { storageStats: { scale: 1 } } }])
          .toArray();
        const s = row?.storageStats ?? {};
        return {
          name,
          documents: Number(s.count ?? 0),
          sizeBytes: Number(s.size ?? 0),
          storageBytes: Number(s.storageSize ?? 0),
          indexBytes: Number(s.totalIndexSize ?? 0),
        };
      } catch {
        return {
          name,
          documents: await coll.estimatedDocumentCount().catch(() => 0),
          sizeBytes: null,
          storageBytes: null,
          indexBytes: null,
        };
      }
    }),
  );
  return stats.sort((a, b) => b.documents - a.documents);
}
