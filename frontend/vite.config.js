import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Renderer for both the web target and the Electron target.
// In dev, /api/* is proxied to the local FastAPI (uvicorn pump.api.main:app).
// In Electron, the same /api/* path hits the bundled sidecar — no client change needed.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:8000",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
