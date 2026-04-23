import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getTasks, createTask } from "@/services/task-service";
import { formatErrorResponse } from "@/lib/errors";
import type { TaskStatus } from "@/types";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const payload = await getAuthenticatedUser(request);

    const { searchParams } = request.nextUrl;

    const pageParam = searchParams.get("page");
    const limitParam = searchParams.get("limit");
    const statusParam = searchParams.get("status");

    const page = pageParam ? parseInt(pageParam, 10) : undefined;
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;
    const status = statusParam ? (statusParam as TaskStatus) : undefined;

    const result = await getTasks(payload.userId, page, limit, status);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const { body, status } = formatErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const payload = await getAuthenticatedUser(request);

    const body = await request.json();

    const task = await createTask(payload.userId, body);

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    const { body, status } = formatErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}