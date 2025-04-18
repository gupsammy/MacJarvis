import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), visualizer({ open: true })],
  base: "./", // Use relative paths for Electron packaging
  server: {
    port: 5173, // Different port than CRA default
  },
  build: {
    outDir: "dist", // Output directory for the build
  },
  envPrefix: "VITE_", // Prefix for environment variables
});
