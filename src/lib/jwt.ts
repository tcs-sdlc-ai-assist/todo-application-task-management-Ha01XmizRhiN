import { SignJWT, jwtVerify } from "jose";
import type { JWTPayload } from "@/types";

const getSecret = (): Uint8Array => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return new TextEncoder().encode(secret);
};

const DEFAULT_EXPIRY = "24h";

export async function signToken(payload: {
  userId: string;
  email: string;
}): Promise<string> {
  const secret = getSecret();

  const token = await new SignJWT({
    userId: payload.userId,
    email: payload.email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(DEFAULT_EXPIRY)
    .sign(secret);

  return token;
}

export async function verifyToken(token: string): Promise<JWTPayload> {
  const secret = getSecret();

  try {
    const { payload } = await jwtVerify(token, secret);

    if (!payload.userId || !payload.email) {
      throw new Error("Invalid token payload: missing userId or email");
    }

    return {
      userId: payload.userId as string,
      email: payload.email as string,
      iat: payload.iat as number,
      exp: payload.exp as number,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Token verification failed: ${error.message}`);
    }
    throw new Error("Token verification failed");
  }
}