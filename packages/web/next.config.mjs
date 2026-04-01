import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  transpilePackages: ["@sgs/data", "@sgs/engine"],
  outputFileTracingRoot: resolve(__dirname, "../../"),
  experimental: {
    devtoolSegmentExplorer: false,
  },
  typescript: {
    // Workspace packages (@sgs/data, @sgs/engine) have no pre-built dist/
    // directory, so `import type` from those packages fails during the
    // Next.js post-build type-check even though webpack compilation
    // succeeds.  Type safety is enforced by the root `tsc --build` instead.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
