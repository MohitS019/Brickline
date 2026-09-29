import type { NextConfig } from "next";

const isVercelTarget =
  process.env.VERCEL === "1" || process.env.BRICKLINE_VERCEL_BUILD === "1";

const nextConfig: NextConfig = {
  // The production application uses Cloudflare bindings through Vinext/Sites.
  // Vercel builds alias that platform module to an environment-only shim so
  // the public site can compile and hand secure workflows back to Sites.
  ...(isVercelTarget
    ? {
        turbopack: {
          resolveAlias: {
            "cloudflare:workers": "./lib/platform/vercel-cloudflare-workers.ts",
          },
        },
      }
    : {
        turbopack: {},
      }),
};

export default nextConfig;
