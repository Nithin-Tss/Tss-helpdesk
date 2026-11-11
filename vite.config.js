import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Port 5174: the shop uses 5173, and the backend allows both origins (CORS_ALLOWED_ORIGINS).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5174 },
  test: { environment: "node", include: ["src/**/*.test.js"] },
});
