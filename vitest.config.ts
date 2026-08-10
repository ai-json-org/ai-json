import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["packages/{core,cli}/test/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**"],
  },
});
