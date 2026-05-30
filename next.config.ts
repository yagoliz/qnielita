import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Dev-only: when accessing the dev server through VS Code port forwarding, the
  // browser's Origin stays `localhost:3000` while the tunnel injects an
  // `x-forwarded-host` of `*.devtunnels.ms`. The two no longer match, so we
  // whitelist the local origin. Intentionally NOT applied in production, where
  // loosening the origin check would weaken CSRF protection.
  ...(process.env.NODE_ENV === "development" && {
    experimental: {
      serverActions: {
        allowedOrigins: ["localhost:3000"],
      },
    },
  }),
};

export default nextConfig;
