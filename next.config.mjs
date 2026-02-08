import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },

  images: {
    unoptimized: true,
  },

  // MOVED OUT OF `experimental`
  serverExternalPackages: [
    "@sentry/nextjs",
    "sharp",
    "puppeteer",
    "playwright",
    "onnxruntime-node",
    "tensorflow",
  ],
};

export default withSentryConfig(nextConfig, {
  org: "sarvajanik-college-of-engin-n5",
  project: "javascript-nextjs-2m",

  silent: true,

  // Safe for local dev without auth token
  dryRun: !process.env.SENTRY_AUTH_TOKEN,

  widenClientFileUpload: true,

  webpack: {
    automaticVercelMonitors: true,
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
