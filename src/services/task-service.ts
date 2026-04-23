import type { Task, CreateTaskInput, UpdateTaskInput, PaginatedResponse } from "@/types";
import { TaskStatus } from "@/types";
import {
  findByUserId,
  findById,
  create,
  update,
  deleteTask as removeTask,
  countByUserId,
} from "@/repositories/task-repository";
import {
  validateCreateTaskInput,
  validateUpdateTaskInput,
  validatePaginationParams,
} from "@/lib/validation";
import { ValidationError, NotFoundError, ForbiddenError } from "@/lib/errors";
import { TASKS_PER_PAGE } from "@/constants";
import type { TaskStatus as PrismaTaskStatus } from "@prisma/client";

function toTask(prismaTask: {
  id: string;
  userId: string;
  title: string;
  description: string;
  status: PrismaTaskStatus;
  createdAt: Date;
  dueDate: Date | null;
}): Task {
  return {
    id: prismaTask.id,
    userId: prismaTask.userId,
    title: prismaTask.title,
    description: prismaTask.description,
    status: prismaTask.status as TaskStatus,
    createdAt: prismaTask.createdAt.toISOString(),
    dueDate: prismaTask.dueDate ? prismaTask.dueDate.toISOString() : null,
  };
}

export async function createTask(
  userId: string,
  input: CreateTaskInput
): Promise<Task> {
  const validation = validateCreateTaskInput(input);

  if (!validation.valid) {
    const messages = validation.errors.map((e) => e.message).join("; ");
    throw new ValidationError(messages);
  }

  const prismaTask = await create({
    userId,
    title: input.title.trim(),
    description: input.description?.trim() ?? "",
    status: (input.status as PrismaTaskStatus) ?? ("TODO" as PrismaTaskStatus),
    dueDate: input.dueDate ? new Date(input.dueDate) : null,
  });

  return toTask(prismaTask);
}

export async function getTasks(
  userId: string,
  page?: number,
  limit?: number,
  status?: TaskStatus
): Promise<PaginatedResponse<Task>> {
  const resolvedPage = page ?? 1;
  const resolvedLimit = limit ?? TASKS_PER_PAGE;

  const paginationValidation = validatePaginationParams({
    page: resolvedPage,
    limit: resolvedLimit,
  });

  if (!paginationValidation.valid) {
    const messages = paginationValidation.errors.map((e) => e.message).join("; ");
    throw new ValidationError(messages);
  }

  const prismaStatus = status as PrismaTaskStatus | undefined;

  const [prismaTasks, total] = await Promise.all([
    findByUserId(userId, resolvedPage, resolvedLimit, undefined, prismaStatus),
    countByUserId(userId, prismaStatus),
  ]);

  const tasks = prismaTasks.map(toTask);
  const totalPages = Math.max(1, Math.ceil(total / resolvedLimit));

  return {
    data: tasks,
    total,
    page: resolvedPage,
    limit: resolvedLimit,
    totalPages,
  };
}

export async function getTaskById(
  userId: string,
  taskId: string
): Promise<Task> {
  const prismaTask = await findById(taskId);

  if (!prismaTask) {
    throw new NotFoundError("Task not found");
  }

  if (prismaTask.userId !== userId) {
    throw new ForbiddenError("You do not have permission to access this task");
  }

  return toTask(prismaTask);
}

export async function updateTask(
  userId: string,
  taskId: string,
  input: UpdateTaskInput
): Promise<Task> {
  const validation = validateUpdateTaskInput(input);

  if (!validation.valid) {
    const messages = validation.errors.map((e) => e.message).join("; ");
    throw new ValidationError(messages);
  }

  const existingTask = await findById(taskId);

  if (!existingTask) {
    throw new NotFoundError("Task not found");
  }

  if (existingTask.userId !== userId) {
    throw new ForbiddenError("You do not have permission to update this task");
  }

  const updateData: {
    title?: string;
    description?: string;
    status?: PrismaTaskStatus;
    dueDate?: Date | null;
  } = {};

  if (input.title !== undefined) {
    updateData.title = input.title.trim();
  }

  if (input.description !== undefined) {
    updateData.description = input.description.trim();
  }

  if (input.status !== undefined) {
    updateData.status = input.status as PrismaTaskStatus;
  }

  if (input.dueDate !== undefined) {
    updateData.dueDate = input.dueDate ? new Date(input.dueDate) : null;
  }

  const updatedTask = await update(taskId, updateData);

  return toTask(updatedTask);
}

export async function deleteTask(
  userId: string,
  taskId: string
): Promise<{ message: string }> {
  const existingTask = await findById(taskId);

  if (!existingTask) {
    throw new NotFoundError("Task not found");
  }

  if (existingTask.userId !== userId) {
    throw new ForbiddenError("You do not have permission to delete this task");
  }

  await removeTask(taskId);

  return { message: "Task deleted successfully" };
}

export async function toggleTaskStatus(
  userId: string,
  taskId: string
): Promise<Task> {
  const existingTask = await findById(taskId);

  if (!existingTask) {
    throw new NotFoundError("Task not found");
  }

  if (existingTask.userId !== userId) {
    throw new ForbiddenError("You do not have permission to update this task");
  }

  let newStatus: PrismaTaskStatus;

  switch (existingTask.status) {
    case "DONE":
      newStatus = "TODO" as PrismaTaskStatus;
      break;
    case "TODO":
      newStatus = "IN_PROGRESS" as PrismaTaskStatus;
      break;
    case "IN_PROGRESS":
      newStatus = "DONE" as PrismaTaskStatus;
      break;
    default:
      newStatus = "TODO" as PrismaTaskStatus;
      break;
  }

  const updatedTask = await update(taskId, { status: newStatus });

  return toTask(updatedTask);
}