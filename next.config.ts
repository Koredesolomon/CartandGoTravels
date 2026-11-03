import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/lead-submissions": ["./src/assets/fonts/*.ttf"],
    "/api/itinerary-pdf": ["./src/assets/fonts/*.ttf", "./public/assets/logo.jpg"],
  },
  async headers() {
    return [
      {
        source: "/pdf.worker.min.js",
        headers: [{ key: "Content-Type", value: "application/javascript; charset=utf-8" }],
      },
    ];
  },
};

export default nextConfig;
