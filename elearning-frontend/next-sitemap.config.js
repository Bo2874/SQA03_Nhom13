/** @type {import('next-sitemap').IConfig} */
const routerDisallow = [
  "/forget-password",
  "/new-password",
  "/register",
  "/cart",
  "/payment-success",
  "/user/my-account",
  "/user/notification",
  "/user/orders",
  "/user/voucher",
  "/checkout",
  "/user/my-address",
];

module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000", // URL chính của website
  generateRobotsTxt: true, // Tự động tạo file robots.txt
  sitemapSize: 5000, // Đảm bảo chỉ tạo 1 file sitemap duy nhất
  generateIndexSitemap: false, // Không tạo sitemapindex.xml

  // Loại bỏ các URL không cần thiết khỏi sitemap.xml
  exclude: routerDisallow,

  // Cấu hình robots.txt
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*", // Cho phép mọi bot
        allow: "/", // Cho phép truy cập toàn bộ website
        disallow: routerDisallow,
      },
    ],
    additionalSitemaps: [
      `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/sitemap.xml`,
    ],
  },

  // Các tính năng tùy chỉnh (comment lại nếu không dùng)
  // sitemapBaseFileName: "my-sitemap", // Tên file sitemap

  // autoLastmod: false, // Tự động thêm thời gian cập nhật gần nhất của URL

  // Hàm tùy chỉnh để thay đổi cách sitemap được tạo cho mỗi URL
  // transform: async (config, url) => {
  //   if (url === "/private") return null; // Loại bỏ "/private" khỏi sitemap
  //   return {
  //     loc: url, // Đường dẫn URL
  //     changefreq: "weekly", // Tần suất thay đổi
  //     priority: 0.8, // Mức độ ưu tiên
  //   };
  // },
};
