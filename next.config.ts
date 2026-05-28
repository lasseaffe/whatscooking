import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "images.pexels.com" },
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "upload.wikimedia.org" },
    ],
  },
  redirects: async () => [
    {
      source: "/dashboard",
      destination: "/",
      permanent: true,
    },
  ],
};

export default nextConfig;
