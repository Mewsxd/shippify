import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: ["react-signature-canvas"],
  },
  // server: {
  //   host: "0.0.0.0", // Accept connections from any IP
  //   port: 5175, // (Optional) Explicit port
  //   strictPort: true, // (Optional) Fail if port is taken
  // },
});
