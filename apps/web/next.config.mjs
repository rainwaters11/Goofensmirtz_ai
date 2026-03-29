/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@pet-pov/db"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        // Supabase Storage — avatars + videos buckets
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/**",
      },
      {
        // Supabase signed URLs pattern
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/sign/**",
      },
    ],
  },
};

export default nextConfig;
