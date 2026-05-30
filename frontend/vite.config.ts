import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const proxyTarget = process.env.VITE_PROXY_TARGET ?? "http://localhost:8000";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": {
        target: proxyTarget,
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      "/shortlist": {
        target: "http://shortlist-agent:8001",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/shortlist/, ""),
      },
    },
    watch: {
      usePolling: true,
    },
  },
});
