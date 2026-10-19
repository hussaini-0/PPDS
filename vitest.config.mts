import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  cacheDir: path.resolve(import.meta.dirname, ".vitest-cache"),
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },
  test: {
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
    },
    include: ["src/**/*.test.ts"],
  },
});
