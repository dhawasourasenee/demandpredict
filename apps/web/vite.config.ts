import path from "path";
import { fileURLToPath } from "url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "src"),
      "@foc/shared": path.resolve(rootDir, "../../packages/shared/src/index.ts"),
      "@foc/ui": path.resolve(rootDir, "../../packages/ui/src/index.ts"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Run `pnpm dev:vercel` so /api/* uses Vercel functions with server-side env vars.
      "/api": {
        target: "http://127.0.0.1:3000",
        changeOrigin: true,
      },
    },
  },
});
