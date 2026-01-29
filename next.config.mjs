import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    serverComponentsExternalPackages: [
      "@sentry/nextjs",
      "sharp",
      "puppeteer",
      "playwright",
      "onnxruntime-node",
      "tensorflow",
    ],
  },
};

export default withSentryConfig(nextConfig, {
  org: "sarvajanik-college-of-engin-n5",
  project: "javascript-nextjs-2m",

  silent: true,

  // 👇 THIS IS THE IMPORTANT PART
  dryRun: !process.env.SENTRY_AUTH_TOKEN,

  widenClientFileUpload: true,

  webpack: {
    automaticVercelMonitors: true,
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
