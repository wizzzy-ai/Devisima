import type { NextConfig } from "next";

const privateAccountPages = ["/dashboard", "/profile", "/wishlist", "/purchases", "/downloads", "/settings", "/admin", "/seller"];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
    ],
  },
  async headers() {
    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
      ...(process.env.NODE_ENV === "production" ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }] : []),
    ];
    return [
      { source: "/(.*)", headers: securityHeaders },
      ...privateAccountPages.map((source) => ({ source: `${source}/:path*`, headers: [{ key: "Cache-Control", value: "private, no-store, max-age=0" }] })),
    ];
  },
};

export default nextConfig;
