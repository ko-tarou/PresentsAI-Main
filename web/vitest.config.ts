import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: ["src/**/*.{test,spec}.{ts,tsx}", "src/**/*.d.ts"],
      // Ratchet floor: thresholds are set just below the current measured
      // coverage so CI fails on any regression but does not break the build
      // today. The codebase is still mostly untested React UI (pages/panels),
      // so the 60% line target from the quality plan is reached by raising
      // these numbers incrementally as tests are added. Do NOT lower them;
      // only raise.
      thresholds: {
        lines: 22,
        statements: 22,
        functions: 52,
        branches: 70,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@features": path.resolve(__dirname, "./src/features"),
      "@shared": path.resolve(__dirname, "./src/shared"),
      "@lib": path.resolve(__dirname, "./src/lib"),
    },
  },
});
