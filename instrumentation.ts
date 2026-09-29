/**
 * Runs once when the Next.js server starts. Opening the MongoDB connection here means the
 * first sign-in after a restart doesn't wait for the (slow) initial TLS handshake to Atlas.
 *
 * The Node-only code lives in a separate file behind this exact `=== "nodejs"` check, which the
 * bundler evaluates at build time — otherwise it tries to bundle mongoose for the Edge runtime.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { warmUpDatabase } = await import("./instrumentation-node");
    await warmUpDatabase();
  }
}
