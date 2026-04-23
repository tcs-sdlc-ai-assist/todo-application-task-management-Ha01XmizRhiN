import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getTaskById, updateTask, deleteTask } from "@/services/task-service";
import { formatErrorResponse } from "@/lib/errors";
import type { UpdateTaskInput } from "@/types";

interface RouteParams {
  params: { id: string };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const user = await getAuthenticatedUser(request);
    const task = await getTaskById(user.userId, params.id);

    return NextResponse.json(task, { status: 200 });
  } catch (error) {
    const { body, status } = formatErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const user = await getAuthenticatedUser(request);

    let body: UpdateTaskInput;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: { code: "INVALID_INPUT", message: "Invalid JSON body" } },
        { status: 400 }
      );
    }

    const task = await updateTask(user.userId, params.id, body);

    return NextResponse.json(task, { status: 200 });
  } catch (error) {
    const { body, status } = formatErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const user = await getAuthenticatedUser(request);

    let body: UpdateTaskInput;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: { code: "INVALID_INPUT", message: "Invalid JSON body" } },
        { status: 400 }
      );
    }

    const task = await updateTask(user.userId, params.id, body);

    return NextResponse.json(task, { status: 200 });
  } catch (error) {
    const { body, status } = formatErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const user = await getAuthenticatedUser(request);
    const result = await deleteTask(user.userId, params.id);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const { body, status } = formatErrorResponse(error);
    return NextResponse.json(body, { status });
  }
}