import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // `npm run dev:lan` öffnet den Server im lokalen Netz, damit Pete
    // die App auf dem iPhone im selben WLAN testen kann.
  },
});
