import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./src/__tests__/setup.ts"],
    include: ["src/__tests__/**/*.test.ts"],
    env: {
      NODE_ENV: "test",
      JWT_SECRET: "cumpa_test_jwt_secret_key_1234567890",
      JWT_EXPIRES_IN: "7d",
      FRONTEND_URL: "http://localhost:5173",
      VITE_CONFIG_NATIVE_IGNORE_WARNING: "true",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve("./src"),
    },
  },
});
