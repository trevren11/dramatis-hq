import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./lib/__tests__/setup.ts"],
    include: ["**/__tests__/**/*.test.{ts,tsx}", "**/*.test.{ts,tsx}"],
    exclude: ["node_modules", ".next", "coverage"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/**",
        ".next/**",
        "coverage/**",
        "**/*.config.{ts,mjs,js}",
        "**/__tests__/**",
        "**/*.test.{ts,tsx}",
        "app/**",
        "components/**",
        "lib/db/**",
        "lib/auth/**",
        "next-env.d.ts",
      ],
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
      "@/components": path.resolve(__dirname, "./components"),
      "@/lib": path.resolve(__dirname, "./lib"),
      "@/app": path.resolve(__dirname, "./app"),
    },
  },
});
