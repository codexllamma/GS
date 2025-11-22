import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: any) {
  const url = req.nextUrl.clone();
  const { pathname } = url;

  const isPrelaunch = process.env.PRELAUNCH_MODE === "true";
  const publicRoutes = [
    "/coming-soon",
    "/",
    "/auth",
    "/legal",
    "/api/auth",
  ];

  // Allow all static or Next built-in assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.includes(".") // assets, images etc.
  ) {
    return NextResponse.next();
  }

  // Always allow explicitly allowed public routes
  const isPublic = publicRoutes.some((route) =>
    pathname.startsWith(route)
  );
  if (isPublic) return NextResponse.next();

  const token = await getToken({ req });

  // 🚧 STRICT PRELAUNCH MODE
  if (isPrelaunch) {
    if (!token) {
      return NextResponse.redirect(new URL("/coming-soon", req.url));
    }
    return NextResponse.next();
  }

  // 🟢 After Launch → let authenticated sessions access normally
  if (!token) {
    return NextResponse.redirect(new URL("/coming-soon", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|.*\\.).*)",
  ],
};
