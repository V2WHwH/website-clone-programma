import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // media staat in public/ en wordt 1-op-1 gekopieerd; assets krijgen een hash
    assetsInlineLimit: 2048,
  },
});
