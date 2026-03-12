import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    globals: true,
    projects: [
      {
        extends: true,
        test: {
          name: "frontend",
          include: [
            "app/**/*.test.tsx",
            "components/**/*.test.tsx",
            "app/**/*.test.ts",
            "components/**/*.test.ts",
          ],
          environment: "jsdom",
          setupFiles: ["./test/setup.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "backend",
          include: ["lib/**/*.test.ts", "database/**/*.test.ts", "app/api/**/*.test.ts"],
          environment: "node",
        },
      },
    ],
  },
});
