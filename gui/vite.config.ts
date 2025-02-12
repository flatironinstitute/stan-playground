import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { configDefaults, coverageConfigDefaults } from "vitest/config";

// https://vitejs.dev/config/
export default defineConfig({
  optimizeDeps: { exclude: ["pyodide"] },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          utilities: [
            "jszip",
            "@octokit/rest",
            "react-dropzone",
            "pyodide",
            "webr",
          ],
          mui: ["@mui/material", "@mui/icons-material"],
        },
      },
    },
  },
  test: {
    // Consider logHeapUsage flag to diagnose memory leaks.
    clearMocks: true,
    coverage: {
      enabled: true,
      exclude: [
        ...coverageConfigDefaults.exclude,
        "**/*Types.ts",
        // "**/types/*ts",
        "index.ts",
        "vite*ts",
        // vitest seems to always reports 100% coverage for workers
        "**/*Worker.ts",
      ],
      include: ["src/**/*.ts", "src/**/*.tsx"],
      provider: "v8",
      reporter: ["text", "lcov"],
    },
    exclude: [...configDefaults.exclude],
  },
  plugins: [react(), tsconfigPaths()],
  server: {
    host: "127.0.0.1",
  },
  worker: {
    format: "es",
    plugins: () => [tsconfigPaths()],
  },
});
