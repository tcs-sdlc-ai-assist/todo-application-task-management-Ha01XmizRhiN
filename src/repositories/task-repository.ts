import prisma from "@/lib/db";
import type { Task as PrismaTask, TaskStatus } from "@prisma/client";

interface FindByUserIdOptions {
  userId: string;
  page: number;
  limit: number;
  sortBy?: string;
  status?: TaskStatus;
}

interface CreateTaskData {
  userId: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  dueDate?: Date | null;
}

interface UpdateTaskData {
  title?: string;
  description?: string;
  status?: TaskStatus;
  dueDate?: Date | null;
}

export async function findByUserId(
  userId: string,
  page: number,
  limit: number,
  sortBy?: string,
  status?: TaskStatus
): Promise<PrismaTask[]> {
  const skip = (page - 1) * limit;

  let orderBy: Record<string, "asc" | "desc">;

  switch (sortBy) {
    case "dueDate":
      orderBy = { dueDate: "asc" };
      break;
    case "status":
      orderBy = { status: "asc" };
      break;
    case "title":
      orderBy = { title: "asc" };
      break;
    case "createdAt_asc":
      orderBy = { createdAt: "asc" };
      break;
    default:
      orderBy = { createdAt: "desc" };
      break;
  }

  const where: { userId: string; status?: TaskStatus } = { userId };

  if (status) {
    where.status = status;
  }

  const tasks = await prisma.task.findMany({
    where,
    orderBy,
    skip,
    take: limit,
  });

  return tasks;
}

export async function findById(id: string): Promise<PrismaTask | null> {
  const task = await prisma.task.findUnique({
    where: { id },
  });

  return task;
}

export async function create(data: CreateTaskData): Promise<PrismaTask> {
  const task = await prisma.task.create({
    data: {
      userId: data.userId,
      title: data.title,
      description: data.description ?? "",
      status: data.status ?? "TODO",
      dueDate: data.dueDate ?? null,
    },
  });

  return task;
}

export async function update(id: string, data: UpdateTaskData): Promise<PrismaTask> {
  const updateData: Record<string, unknown> = {};

  if (data.title !== undefined) {
    updateData.title = data.title;
  }

  if (data.description !== undefined) {
    updateData.description = data.description;
  }

  if (data.status !== undefined) {
    updateData.status = data.status;
  }

  if (data.dueDate !== undefined) {
    updateData.dueDate = data.dueDate;
  }

  const task = await prisma.task.update({
    where: { id },
    data: updateData,
  });

  return task;
}

export async function deleteTask(id: string): Promise<PrismaTask> {
  const task = await prisma.task.delete({
    where: { id },
  });

  return task;
}

export async function countByUserId(userId: string, status?: TaskStatus): Promise<number> {
  const where: { userId: string; status?: TaskStatus } = { userId };

  if (status) {
    where.status = status;
  }

  const count = await prisma.task.count({
    where,
  });

  return count;
}