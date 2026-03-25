/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@pet-pov/db"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
