import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;
  const path = req.nextUrl.pathname;

  const needsOwner = path.startsWith("/dashboard") || path.startsWith("/register-shop");
  const needsAdmin = path.startsWith("/admin");

  if (needsOwner && (!isLoggedIn || role !== "SHOP_OWNER")) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (needsAdmin && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  if (needsAdmin && isLoggedIn && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }
});

export const config = {
  matcher: ["/dashboard/:path*", "/register-shop", "/admin/:path*"],
};
