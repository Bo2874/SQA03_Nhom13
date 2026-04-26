/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  async headers() {
    if (process.env.NEXT_ENV === process.env.NEXT_ENV_PROD) {
      return [
        {
          source: "/:all*(svg|jpg|png|gif|js|webp)",
          locale: false,
          headers: [
            {
              key: "Cache-Control",
              value: "public, max-age=86400, must-revalidate",
            },
          ],
        },
      ];
    }
    return [];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
