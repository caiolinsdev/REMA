import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("rema_token")?.value;
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/aluno") || pathname.startsWith("/professor")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  if (pathname === "/login" && token) {
    const role = request.cookies.get("rema_role")?.value;
    if (role === "aluno") {
      return NextResponse.redirect(new URL("/aluno", request.url));
    }
    if (role === "professor") {
      return NextResponse.redirect(new URL("/professor", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/aluno/:path*", "/professor/:path*", "/login"],
};
