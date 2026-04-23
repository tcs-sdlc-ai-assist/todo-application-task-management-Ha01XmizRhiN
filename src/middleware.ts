import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { JWT_COOKIE_NAME } from "@/constants";

const PUBLIC_ROUTES = ["/", "/login", "/register"];

const PUBLIC_API_PREFIXES = ["/api/auth/", "/api/health"];

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.includes(pathname)) {
    return true;
  }

  for (const prefix of PUBLIC_API_PREFIXES) {
    if (pathname.startsWith(prefix)) {
      return true;
    }
  }

  return false;
}

function isProtectedRoute(pathname: string): boolean {
  if (pathname.startsWith("/tasks") || pathname.startsWith("/api/tasks")) {
    return true;
  }

  return false;
}

async function verifyTokenFromRequest(token: string): Promise<boolean> {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return false;
  }

  try {
    const encodedSecret = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, encodedSecret);

    if (!payload.userId || !payload.email) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  if (!isProtectedRoute(pathname)) {
    return NextResponse.next();
  }

  const token =
    request.cookies.get(JWT_COOKIE_NAME)?.value ??
    request.headers.get("Authorization")?.replace("Bearer ", "") ??
    null;

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
        { status: 401 }
      );
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const isValid = await verifyTokenFromRequest(token);

  if (!isValid) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
        { status: 401 }
      );
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/tasks/:path*",
    "/api/tasks/:path*",
  ],
};