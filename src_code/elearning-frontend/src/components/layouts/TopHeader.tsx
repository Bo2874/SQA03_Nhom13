"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { logout } from "@/apis/auth";
import { successToast, errorToast } from "@/utils/toast";
import { UserRole, User } from "@/@types/User.type";

export default function TopHeader() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [profile, setProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Get user profile from localStorage
  useEffect(() => {
    try {
      const storedData = localStorage.getItem("user");
      if (storedData) {
        const parsed = JSON.parse(storedData);
        setProfile(parsed || null);
      }
    } catch (error) {
      console.error("Error reading profile from localStorage:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle logout
  const handleLogout = async () => {
    setIsLoggingOut(true);
    setIsDropdownOpen(false);

    try {
      // Call backend logout API (clear httpOnly cookie)
      await logout();

      // Clear localStorage
      localStorage.removeItem("user");
      setProfile(null);

      successToast("Đăng xuất thành công!");
      router.push("/login");
    } catch (error: any) {
      console.error("Logout error:", error);
      // Even if API fails, still clear local data
      localStorage.removeItem("user");
      setProfile(null);
      errorToast("Có lỗi khi đăng xuất, nhưng đã xóa phiên làm việc.");
      router.push("/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Get user avatar letter (first letter of name)
  const getAvatarLetter = () => {
    if (!profile?.full_name) return "U";
    return profile.full_name.charAt(0).toUpperCase();
  };

  // Determine user role for navigation
  const isTeacher = profile?.role === UserRole.TEACHER;
  const isAdmin = profile?.role === UserRole.ADMIN;

  return (
    <header className="fixed top-0 right-0 left-20 h-16 bg-white border-b border-gray-200 z-40">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Brand Name */}
        <Link href="/" className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-gray-900">
            Elearning
          </h1>
        </Link>

        <div className="flex-1"></div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          {/* Search Icon */}
          <Link
            href="/student/search"
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="Tìm kiếm khóa học"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </Link>
          {/* My Courses Link */}
          {!isLoading && profile && (
            <Link
              href={isTeacher ? "/teacher/dashboard" : "/student/my-courses"}
              className="text-gray-700 hover:text-gray-900 font-medium"
            >
              {isTeacher ? "Quản lý khóa học" : "Khóa học của tôi"}
            </Link>
          )}

          {/* Notification Bell */}
          <button className="relative p-2 text-gray-600 hover:text-gray-900">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
            {/* Notification badge (optional) */}
            {/* <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span> */}
          </button>

          {/* User Avatar with Dropdown */}
          <div className="relative" ref={dropdownRef}>
            {isLoading ? (
              // Show loading skeleton while loading
              <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse"></div>
            ) : profile ? (
              <>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold cursor-pointer hover:shadow-md transition-shadow"
                  title={profile.full_name}
                >
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.full_name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    getAvatarLetter()
                  )}
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-semibold text-gray-900">
                        {profile.full_name}
                      </p>
                      <p className="text-xs text-gray-500">{profile.email}</p>
                      {profile.role && (
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                          {profile.role === UserRole.ADMIN
                            ? "Admin"
                            : profile.role === UserRole.TEACHER
                            ? "Giảng viên"
                            : "Học sinh"}
                        </span>
                      )}
                    </div>

                    <div className="py-2">
                      {/* TODO: Create my-account page
                      <Link
                        href="/user/my-account"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        Tài khoản của tôi
                      </Link>
                      */}

                      <Link
                        href={isTeacher ? "/teacher/dashboard" : "/student/my-courses"}
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                          />
                        </svg>
                        {isTeacher ? "Quản lý khóa học" : "Khóa học của tôi"}
                      </Link>

                      <div className="border-t border-gray-200 my-2"></div>

                      <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        {isLoggingOut ? "Đang đăng xuất..." : "Đăng xuất"}
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              // Not logged in - Show login button
              <Link
                href="/login"
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
