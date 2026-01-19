import { NextResponse, NextRequest } from "next/server";

const AUTH_PATHS = ["/login", "/register"];
const PROTECTED_ROUTES = ["/user", "/student", "/teacher", "/admin"];
const ACCESS_TOKEN = "ACCESS_TOKEN";

// export function middleware(request: NextRequest) {
//   const { pathname } = request.nextUrl;
//   const token = request.cookies.get(ACCESS_TOKEN)?.value;

//   const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
//     pathname.startsWith(route)
//   );
//   const isAuthRoute = AUTH_PATHS.includes(pathname);

//   // Nếu không có token và vào route cần xác thực => chuyển hướng về /login
//   if (!token && isProtectedRoute) {
//     if (pathname !== "/login") {
//       const loginUrl = new URL("/login", request.url);
//       loginUrl.searchParams.set("redirect", pathname);
//       return NextResponse.redirect(loginUrl);
//     }
//   }

//   // Nếu đã có token mà vào trang login/register => chuyển về trang chủ (trừ khi đã ở trang chủ)
//   if (token && isAuthRoute && pathname !== "/") {
//     return NextResponse.redirect(new URL("/", request.url));
//   }

//   return NextResponse.next();
// }

export const config = {
  matcher: [
    // "/login",
    // "/register",
    // "/user/:path*",
    // "/student/:path*",
    // "/teacher/:path*",
    // "/admin/:path*",
  ],
};