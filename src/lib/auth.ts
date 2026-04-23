import { cookies } from "next/headers";
import { verifyToken } from "@/lib/jwt";
import { AuthenticationError } from "@/lib/errors";
import { JWT_COOKIE_NAME } from "@/constants";
import type { JWTPayload } from "@/types";

function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) {
    return null;
  }

  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    return token.length > 0 ? token : null;
  }

  return null;
}

function extractTokenFromCookie(): string | null {
  try {
    const cookieStore = cookies();
    const tokenCookie = cookieStore.get(JWT_COOKIE_NAME);
    return tokenCookie?.value ?? null;
  } catch {
    return null;
  }
}

export async function getAuthenticatedUser(
  request: Request
): Promise<JWTPayload> {
  const authHeader = request.headers.get("Authorization");
  let token = extractTokenFromHeader(authHeader);

  if (!token) {
    token = extractTokenFromCookie();
  }

  if (!token) {
    throw new AuthenticationError("Authentication required");
  }

  try {
    const payload = await verifyToken(token);
    return payload;
  } catch {
    throw new AuthenticationError("Invalid or expired token");
  }
}

export async function getOptionalUser(
  request: Request
): Promise<JWTPayload | null> {
  const authHeader = request.headers.get("Authorization");
  let token = extractTokenFromHeader(authHeader);

  if (!token) {
    token = extractTokenFromCookie();
  }

  if (!token) {
    return null;
  }

  try {
    const payload = await verifyToken(token);
    return payload;
  } catch {
    return null;
  }
}