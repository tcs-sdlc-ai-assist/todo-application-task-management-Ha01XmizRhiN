import { NextRequest, NextResponse } from "next/server";
import { login } from "@/services/auth-service";
import { formatErrorResponse } from "@/lib/errors";
import { rateLimit } from "@/lib/rate-limiter";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown";

  const isAllowed = rateLimit(ip, { windowMs: 60000, maxRequests: 10 });

  if (!isAllowed) {
    return NextResponse.json(
      {
        error: {
          code: "RATE_LIMITED",
          message: "Too many requests. Please try again later.",
        },
      },
      { status: 429 }
    );
  }

  try {
    const body = await request.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_INPUT",
            message: "Request body is required",
          },
        },
        { status: 400 }
      );
    }

    const { email, password } = body;

    const result = await login(email, password);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const { body: errorBody, status } = formatErrorResponse(error);
    return NextResponse.json(errorBody, { status });
  }
}