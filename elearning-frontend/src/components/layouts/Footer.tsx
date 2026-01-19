import Link from "next/link";
import {
  Facebook,
  Instagram,
  Twitter,
  Envelope,
  Phone,
  Address,
} from "@/components/icons";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 relative">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About Section */}
          <div className="space-y-4">
            <h3 className="text-white text-lg font-semibold mb-4">
              Về E-Learning
            </h3>
            <p className="text-sm leading-relaxed">
              Nền tảng học trực tuyến hàng đầu Việt Nam, cung cấp các khóa học
              chất lượng cao với giảng viên giàu kinh nghiệm.
            </p>
            <div className="flex space-x-4 pt-2">
              <Link
                href="https://facebook.com"
                target="_blank"
                className="hover:text-blue-400 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-6 h-6" />
              </Link>
              <Link
                href="https://instagram.com"
                target="_blank"
                className="hover:text-pink-400 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-6 h-6" />
              </Link>
              <Link
                href="https://twitter.com"
                target="_blank"
                className="hover:text-blue-300 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-6 h-6" />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">
              Liên kết nhanh
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/courses"
                  className="text-sm hover:text-white transition-colors"
                >
                  Khóa học
                </Link>
              </li>
              <li>
                <Link
                  href="/teachers"
                  className="text-sm hover:text-white transition-colors"
                >
                  Giảng viên
                </Link>
              </li>
              <li>
                <Link
                  href="/about"
                  className="text-sm hover:text-white transition-colors"
                >
                  Về chúng tôi
                </Link>
              </li>
              <li>
                <Link
                  href="/blog"
                  className="text-sm hover:text-white transition-colors"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-sm hover:text-white transition-colors"
                >
                  Liên hệ
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Hỗ trợ</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/help-center"
                  className="text-sm hover:text-white transition-colors"
                >
                  Trung tâm trợ giúp
                </Link>
              </li>
              <li>
                <Link
                  href="/faq"
                  className="text-sm hover:text-white transition-colors"
                >
                  Câu hỏi thường gặp
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-sm hover:text-white transition-colors"
                >
                  Điều khoản sử dụng
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-sm hover:text-white transition-colors"
                >
                  Chính sách bảo mật
                </Link>
              </li>
              <li>
                <Link
                  href="/refund"
                  className="text-sm hover:text-white transition-colors"
                >
                  Chính sách hoàn tiền
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white text-lg font-semibold mb-4">Liên hệ</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <Address className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span className="text-sm">
                  Km10, Nguyễn Trãi, Hà Đông, Hà Nội, Việt Nam
                </span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone className="w-5 h-5 flex-shrink-0" />
                <Link
                  href="tel:+84123456789"
                  className="text-sm hover:text-white transition-colors"
                >
                  (+84) 32 892 7727
                </Link>
              </li>
              <li className="flex items-center space-x-3">
                <Envelope className="w-5 h-5 flex-shrink-0" />
                <Link
                  href="mailto:support@elearning.vn"
                  className="text-sm hover:text-white transition-colors"
                >
                  admin@elearning.com
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} E-Learning. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <Link
                href="/sitemap"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Sơ đồ trang
              </Link>
              <Link
                href="/accessibility"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Khả năng tiếp cận
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
