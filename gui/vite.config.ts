import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { configDefaults, coverageConfigDefaults } from "vitest/config";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          monaco: ["monaco-editor", "@monaco-editor/react"],
          utilities: ["jszip", "@octokit/rest"],
        },
      },
    },
  },
  test: {
    // note for testing: mockReset clears all spies/mocks and resets to empty function,
    // while restoreMocks: true calls .mockRestore() thereby clearing spies & mock
    // history and resets implementation to origina implementation.
    // Consider logHeapUsage flag to diagnose memory leaks.
    mockReset: true,
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
  plugins: [react()],
  server: {
    host: "127.0.0.1",
  },
  worker: {
    format: 'es',
  },
});
