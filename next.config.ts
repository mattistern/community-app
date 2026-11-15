import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Dev only: lets a phone on the same Wi-Fi open the dev server by the PC's LAN
  // address (e.g. http://192.168.1.20:3000). Next blocks every hostname except
  // localhost by default, which leaves the page without any JavaScript.
  // Private ranges only: home networks, plus the iPhone hotspot range.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.20.10.*"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
