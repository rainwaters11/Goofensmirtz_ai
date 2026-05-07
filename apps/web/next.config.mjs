/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@pet-pov/db"],
  images: {
    remotePatterns: [
      // Cloudinary — session thumbnails, rendered videos, audio waveforms
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      // Google — OAuth user profile photos shown in the top navigation avatar
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
