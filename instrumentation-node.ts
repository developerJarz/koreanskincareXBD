import { connectDB } from "@/server/db/connection";

/** Opens the database connection at server start (see instrumentation.ts). */
export async function warmUpDatabase() {
  try {
    await connectDB();
  } catch (err) {
    // Not fatal: requests retry the connection themselves
    console.warn("Database warm-up failed; will connect on first request.", err);
  }
}
