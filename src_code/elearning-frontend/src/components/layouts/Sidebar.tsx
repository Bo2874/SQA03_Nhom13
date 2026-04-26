"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";

interface SidebarItem {
  icon: ReactNode;
  label: string;
  href: string;
}

const SVGHome = () => (
  <svg
    width="28"
    height="28"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg">
    <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
    <g
      id="SVGRepo_tracerCarrier"
      strokeLinecap="round"
      strokeLinejoin="round"></g>
    <g id="SVGRepo_iconCarrier">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 0L0 6V8H1V15H4V10H7V15H15V8H16V6L14 4.5V1H11V2.25L8 0ZM9 10H12V13H9V10Z"
        fill="#2f9849"></path>
    </g>
  </svg>
);

export const SVGCourse = () => (
  <svg
    width="32"
    height="32"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg">
    <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
    <g
      id="SVGRepo_tracerCarrier"
      strokeLinecap="round"
      strokeLinejoin="round"></g>
    <g id="SVGRepo_iconCarrier">
      <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="#FF5722"></path>
      <path d="M2 17L12 22L22 17V12L12 17L2 12V17Z" fill="#E64A19"></path>
      <path d="M2 12L12 17L22 12V7L12 12L2 7V12Z" fill="#FF7043"></path>
    </g>
  </svg>
);

const sidebarItems: SidebarItem[] = [
  { icon: <SVGHome />, label: "Trang chủ", href: "/" },
  { icon: <SVGCourse />, label: "Khóa học", href: "/courses" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-20 bg-white border-r border-gray-200 flex flex-col items-center py-4 z-50">
      {/* Logo */}
      <Link href="/" className="mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
          <img
            src="https://sf-static.upanhlaylink.com/img/image_20251225a9dcbf7f5797856bc744d79ac3569931.jpg"
            alt="Image image_20251225a9dcbf7f5797856bc744d79ac3569931.jpg"
          />
        </div>
      </Link>

      {/* Navigation Items */}
      <nav className="flex-1 flex flex-col gap-4">
        {sidebarItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                isActive ?
                  "bg-gray-100 text-gray-900"
                : "text-gray-600 hover:bg-gray-50"
              }`}>
              <span className="text-2xl">{item.icon}</span>
              <span className="text-xs font-medium text-center leading-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
