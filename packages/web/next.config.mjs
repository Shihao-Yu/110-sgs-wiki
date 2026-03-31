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
};

export default nextConfig;
