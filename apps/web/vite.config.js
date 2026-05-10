import path from "path";
import { fileURLToPath } from "url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
var rootDir = path.dirname(fileURLToPath(import.meta.url));
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
    },
});
