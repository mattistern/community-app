import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Mirrors the "@/*" path in tsconfig.json so tests import like the app does.
    alias: { "@": fileURLToPath(new URL(".", import.meta.url)).replace(/[\\/]$/, "") },
  },
  test: {
    // Business logic only (CLAUDE.md testing strategy); no DOM needed.
    environment: "node",
    // *.test.ts is Vitest. Playwright E2E specs will use *.spec.ts and stay out of this run.
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**"],
  },
});
