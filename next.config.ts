import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },

  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: "https://estoque-lima-api.onrender.com/api/v1/:path*",
      },
    ];
  },
};

export default nextConfig;