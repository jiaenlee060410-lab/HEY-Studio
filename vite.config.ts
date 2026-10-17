import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The cloud workspace forwards its preview through a non-local hostname.
// Vite otherwise rejects that request before React can load.
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_ACTIONS ? "/HEY-Studio/" : "/",
  server: { host: "0.0.0.0", allowedHosts: true },
});
