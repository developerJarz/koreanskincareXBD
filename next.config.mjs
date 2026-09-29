/** Security headers applied to every response. */
const securityHeaders = [
  // Force HTTPS for one year (only honoured by browsers over HTTPS)
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
  // Block clickjacking
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self)" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  {
    key: "Content-Security-Policy",
    value: [
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "object-src 'none'",
      "form-action 'self'",
    ].join("; "),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Lets a verification build run in a separate folder (NEXT_DIST_DIR=.next-verify) without
  // touching the .next folder a running `npm run dev` is using
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // Verification builds are type-checked separately with `npx tsc --noEmit`; the built-in check
  // would also read the running dev server's generated types in .next and fail on them
  typescript: { ignoreBuildErrors: Boolean(process.env.NEXT_DIST_DIR) },
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        // Never cache authenticated / private API responses in shared caches
        source: "/api/:area(auth|admin|orders|vendor)/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
};

export default nextConfig;
