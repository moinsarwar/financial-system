import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 9010,
    proxy: {
      "/api": "http://127.0.0.1:9011",
      "/health": "http://127.0.0.1:9011",
    },
  },
});
