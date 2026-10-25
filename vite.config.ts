import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  server: { hmr: false },
  build: { sourcemap: false, modulePreload: false },
});
