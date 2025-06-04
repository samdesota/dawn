import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";

import UnocssPlugin from "@unocss/vite";

export default defineConfig({
  plugins: [
    solidPlugin(),
    UnocssPlugin({
      // your config or in uno.config.ts
    }),
  ],
  server: {
    port: 3333,
    host: true, // This makes the server accessible from your LAN for both IPv4 and IPv6
    strictPort: true, // Don't try alternative ports if 3000 is in use
  },
  build: {
    target: "esnext",
  },
});
