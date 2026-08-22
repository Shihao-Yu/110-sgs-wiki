import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    include: [
      "packages/*/src/**/*.test.{ts,tsx}",
      "scripts/**/*.test.ts",
    ],
    passWithNoTests: true,
    testTimeout: 15000,
  },
  resolve: {
    alias: {
      // 只有 packages/web 使用 "@/" 前缀；与 packages/web/vitest.config.ts 保持一致。
      "@": fileURLToPath(new URL("./packages/web/src", import.meta.url)),
    },
  },
});
