import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { configDefaults, coverageConfigDefaults } from "vitest/config";
import { codecovVitePlugin } from "@codecov/vite-plugin";

// https://vitejs.dev/config/
export default defineConfig({
  resolve: { tsconfigPaths: true },
  optimizeDeps: { exclude: ["pyodide"] },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "utilities",
              test: /[\\/]node_modules[\\/](jszip|lz-string|@octokit\/rest|react-dropzone|pyodide|webr)[\\/]/,
            },
            {
              name: "mui",
              test: /[\\/]node_modules[\\/](\@mui\/material|\@mui\/icons-material)[\\/]/,
            },
          ],
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
      ],
      include: ["src/**/*.ts", "src/**/*.tsx"],
      provider: "v8",
      reporter: ["text", "lcov"],
    },
    exclude: [...configDefaults.exclude],
  },
  plugins: [
    react(),
    codecovVitePlugin({
      enableBundleAnalysis: process.env.CODECOV_TOKEN !== undefined,
      bundleName: "stan-playground",
      uploadToken: process.env.CODECOV_TOKEN,
      telemetry: false,
    }),
  ],
  server: {
    host: "127.0.0.1",
    port: 3000,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
    hmr: {
      host: "127.0.0.1",
      port: 3001,
    },
  },
  worker: {
    format: "es",
  },
});
