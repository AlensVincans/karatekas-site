import vinext from "vinext";
import { defineConfig } from "vite";

export default defineConfig({
  optimizeDeps: {
    exclude: ["pg", "pg-native"],
  },
  plugins: [vinext()],
  ssr: {
    external: ["pg", "pg-pool", "pg-protocol", "pg-types"],
  },
});
