import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: any) {
  const { pathname } = req.nextUrl;
  
  const isPrelaunch = process.env.PRELAUNCH_MODE === "true";
  const token = await getToken({ req });

  const email = token?.email;
  const allowedUsers =
    process.env.PRELAUNCH_ALLOWED_USERS?.split(",").map(e => e.trim()) || [];
  const admins =
    process.env.PRELAUNCH_ALLOWED_ADMIN?.split(",").map(e => e.trim()) || [];

  const isWhitelisted =
    email && (allowedUsers.includes(email) || admins.includes(email));

  // Public cannot see anything except Coming Soon + Auth routes
  const publicRoutes = [
    "/coming-soon",
    "/api/auth",
    "/auth"
  ];

  // Allow static + image assets always
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // These paths are always public
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // 🚧 PRELAUNCH LOCK: must be logged in AND whitelisted
  if (isPrelaunch) {
    if (!token || !isWhitelisted) {
      return NextResponse.redirect(new URL("/coming-soon", req.url));
    }
  }

  // Authenticated + Whitelisted users proceed freely
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|.*\\.).*)"],
};
