import { describe, it, expect, vi, beforeEach } from "vitest";
import type { TaskStatus as PrismaTaskStatus } from "@prisma/client";

const mockFindByUserId = vi.fn();
const mockFindById = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockDeleteTask = vi.fn();
const mockCountByUserId = vi.fn();

vi.mock("@/repositories/task-repository", () => ({
  findByUserId: (...args: unknown[]) => mockFindByUserId(...args),
  findById: (...args: unknown[]) => mockFindById(...args),
  create: (...args: unknown[]) => mockCreate(...args),
  update: (...args: unknown[]) => mockUpdate(...args),
  deleteTask: (...args: unknown[]) => mockDeleteTask(...args),
  countByUserId: (...args: unknown[]) => mockCountByUserId(...args),
}));

vi.mock("@/lib/db", () => ({
  default: {},
  prisma: {},
}));

import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  toggleTaskStatus,
} from "@/services/task-service";
import { ValidationError, NotFoundError, ForbiddenError } from "@/lib/errors";

const USER_ID = "user-123";
const OTHER_USER_ID = "user-456";
const TASK_ID = "task-abc";

function makePrismaTask(overrides: Record<string, unknown> = {}) {
  return {
    id: TASK_ID,
    userId: USER_ID,
    title: "Test Task",
    description: "A test task description",
    status: "TODO" as PrismaTaskStatus,
    createdAt: new Date("2024-01-15T00:00:00.000Z"),
    dueDate: null,
    ...overrides,
  };
}

describe("TaskService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createTask", () => {
    it("creates a task successfully with valid input", async () => {
      const prismaTask = makePrismaTask();
      mockCreate.mockResolvedValueOnce(prismaTask);

      const result = await createTask(USER_ID, {
        title: "Test Task",
        description: "A test task description",
      });

      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(mockCreate).toHaveBeenCalledWith({
        userId: USER_ID,
        title: "Test Task",
        description: "A test task description",
        status: "TODO",
        dueDate: null,
      });

      expect(result).toEqual({
        id: TASK_ID,
        userId: USER_ID,
        title: "Test Task",
        description: "A test task description",
        status: "TODO",
        createdAt: "2024-01-15T00:00:00.000Z",
        dueDate: null,
      });
    });

    it("creates a task with optional status and dueDate", async () => {
      const dueDate = new Date("2024-12-31T00:00:00.000Z");
      const prismaTask = makePrismaTask({
        status: "IN_PROGRESS" as PrismaTaskStatus,
        dueDate,
      });
      mockCreate.mockResolvedValueOnce(prismaTask);

      const result = await createTask(USER_ID, {
        title: "Task with extras",
        description: "Has status and due date",
        status: "IN_PROGRESS" as unknown as import("@/types").TaskStatus,
        dueDate: "2024-12-31T00:00:00.000Z",
      });

      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "IN_PROGRESS",
          dueDate: expect.any(Date),
        })
      );

      expect(result.status).toBe("IN_PROGRESS");
      expect(result.dueDate).toBe("2024-12-31T00:00:00.000Z");
    });

    it("throws ValidationError when title is missing", async () => {
      await expect(
        createTask(USER_ID, {
          title: "",
          description: "No title provided",
        })
      ).rejects.toThrow(ValidationError);

      expect(mockCreate).not.toHaveBeenCalled();
    });

    it("throws ValidationError when title is only whitespace", async () => {
      await expect(
        createTask(USER_ID, {
          title: "   ",
          description: "Whitespace title",
        })
      ).rejects.toThrow(ValidationError);

      expect(mockCreate).not.toHaveBeenCalled();
    });

    it("trims the title and description before saving", async () => {
      const prismaTask = makePrismaTask({
        title: "Trimmed Title",
        description: "Trimmed Description",
      });
      mockCreate.mockResolvedValueOnce(prismaTask);

      await createTask(USER_ID, {
        title: "  Trimmed Title  ",
        description: "  Trimmed Description  ",
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Trimmed Title",
          description: "Trimmed Description",
        })
      );
    });
  });

  describe("getTasks", () => {
    it("returns paginated tasks for a user", async () => {
      const prismaTasks = [
        makePrismaTask({ id: "task-1", title: "Task 1" }),
        makePrismaTask({ id: "task-2", title: "Task 2" }),
      ];
      mockFindByUserId.mockResolvedValueOnce(prismaTasks);
      mockCountByUserId.mockResolvedValueOnce(2);

      const result = await getTasks(USER_ID, 1, 10);

      expect(mockFindByUserId).toHaveBeenCalledTimes(1);
      expect(mockFindByUserId).toHaveBeenCalledWith(USER_ID, 1, 10, undefined, undefined);
      expect(mockCountByUserId).toHaveBeenCalledTimes(1);
      expect(mockCountByUserId).toHaveBeenCalledWith(USER_ID, undefined);

      expect(result).toEqual({
        data: expect.arrayContaining([
          expect.objectContaining({ id: "task-1", title: "Task 1" }),
          expect.objectContaining({ id: "task-2", title: "Task 2" }),
        ]),
        total: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it("returns an empty list when user has no tasks", async () => {
      mockFindByUserId.mockResolvedValueOnce([]);
      mockCountByUserId.mockResolvedValueOnce(0);

      const result = await getTasks(USER_ID, 1, 10);

      expect(result).toEqual({
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it("calculates totalPages correctly", async () => {
      const prismaTasks = [makePrismaTask()];
      mockFindByUserId.mockResolvedValueOnce(prismaTasks);
      mockCountByUserId.mockResolvedValueOnce(25);

      const result = await getTasks(USER_ID, 1, 10);

      expect(result.totalPages).toBe(3);
      expect(result.total).toBe(25);
    });

    it("filters tasks by status when provided", async () => {
      mockFindByUserId.mockResolvedValueOnce([]);
      mockCountByUserId.mockResolvedValueOnce(0);

      await getTasks(USER_ID, 1, 10, "DONE" as unknown as import("@/types").TaskStatus);

      expect(mockFindByUserId).toHaveBeenCalledWith(USER_ID, 1, 10, undefined, "DONE");
      expect(mockCountByUserId).toHaveBeenCalledWith(USER_ID, "DONE");
    });

    it("uses default page and limit when not provided", async () => {
      mockFindByUserId.mockResolvedValueOnce([]);
      mockCountByUserId.mockResolvedValueOnce(0);

      await getTasks(USER_ID);

      expect(mockFindByUserId).toHaveBeenCalledWith(USER_ID, 1, 20, undefined, undefined);
    });
  });

  describe("getTaskById", () => {
    it("returns a task when found and owned by user", async () => {
      const prismaTask = makePrismaTask();
      mockFindById.mockResolvedValueOnce(prismaTask);

      const result = await getTaskById(USER_ID, TASK_ID);

      expect(mockFindById).toHaveBeenCalledWith(TASK_ID);
      expect(result).toEqual({
        id: TASK_ID,
        userId: USER_ID,
        title: "Test Task",
        description: "A test task description",
        status: "TODO",
        createdAt: "2024-01-15T00:00:00.000Z",
        dueDate: null,
      });
    });

    it("throws NotFoundError when task does not exist", async () => {
      mockFindById.mockResolvedValueOnce(null);

      await expect(getTaskById(USER_ID, "nonexistent")).rejects.toThrow(NotFoundError);
    });

    it("throws ForbiddenError when task is owned by another user", async () => {
      const prismaTask = makePrismaTask({ userId: OTHER_USER_ID });
      mockFindById.mockResolvedValueOnce(prismaTask);

      await expect(getTaskById(USER_ID, TASK_ID)).rejects.toThrow(ForbiddenError);
    });
  });

  describe("updateTask", () => {
    it("updates a task successfully with valid input", async () => {
      const existingTask = makePrismaTask();
      const updatedPrismaTask = makePrismaTask({
        title: "Updated Title",
        description: "Updated description",
        status: "IN_PROGRESS" as PrismaTaskStatus,
      });

      mockFindById.mockResolvedValueOnce(existingTask);
      mockUpdate.mockResolvedValueOnce(updatedPrismaTask);

      const result = await updateTask(USER_ID, TASK_ID, {
        title: "Updated Title",
        description: "Updated description",
        status: "IN_PROGRESS" as unknown as import("@/types").TaskStatus,
      });

      expect(mockFindById).toHaveBeenCalledWith(TASK_ID);
      expect(mockUpdate).toHaveBeenCalledTimes(1);
      expect(mockUpdate).toHaveBeenCalledWith(TASK_ID, {
        title: "Updated Title",
        description: "Updated description",
        status: "IN_PROGRESS",
      });

      expect(result.title).toBe("Updated Title");
      expect(result.description).toBe("Updated description");
      expect(result.status).toBe("IN_PROGRESS");
    });

    it("throws NotFoundError when task does not exist", async () => {
      mockFindById.mockResolvedValueOnce(null);

      await expect(
        updateTask(USER_ID, "nonexistent", { title: "New Title" })
      ).rejects.toThrow(NotFoundError);

      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it("throws ForbiddenError when task is owned by another user", async () => {
      const prismaTask = makePrismaTask({ userId: OTHER_USER_ID });
      mockFindById.mockResolvedValueOnce(prismaTask);

      await expect(
        updateTask(USER_ID, TASK_ID, { title: "Hijack" })
      ).rejects.toThrow(ForbiddenError);

      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it("throws ValidationError when no fields are provided", async () => {
      await expect(
        updateTask(USER_ID, TASK_ID, {} as import("@/types").UpdateTaskInput)
      ).rejects.toThrow(ValidationError);

      expect(mockFindById).not.toHaveBeenCalled();
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it("updates only the provided fields", async () => {
      const existingTask = makePrismaTask();
      const updatedPrismaTask = makePrismaTask({ title: "Only Title Changed" });

      mockFindById.mockResolvedValueOnce(existingTask);
      mockUpdate.mockResolvedValueOnce(updatedPrismaTask);

      await updateTask(USER_ID, TASK_ID, { title: "Only Title Changed" });

      expect(mockUpdate).toHaveBeenCalledWith(TASK_ID, {
        title: "Only Title Changed",
      });
    });

    it("allows setting dueDate to null", async () => {
      const existingTask = makePrismaTask({
        dueDate: new Date("2024-12-31T00:00:00.000Z"),
      });
      const updatedPrismaTask = makePrismaTask({ dueDate: null });

      mockFindById.mockResolvedValueOnce(existingTask);
      mockUpdate.mockResolvedValueOnce(updatedPrismaTask);

      const result = await updateTask(USER_ID, TASK_ID, { dueDate: null });

      expect(mockUpdate).toHaveBeenCalledWith(TASK_ID, { dueDate: null });
      expect(result.dueDate).toBeNull();
    });
  });

  describe("deleteTask", () => {
    it("deletes a task successfully", async () => {
      const prismaTask = makePrismaTask();
      mockFindById.mockResolvedValueOnce(prismaTask);
      mockDeleteTask.mockResolvedValueOnce(prismaTask);

      const result = await deleteTask(USER_ID, TASK_ID);

      expect(mockFindById).toHaveBeenCalledWith(TASK_ID);
      expect(mockDeleteTask).toHaveBeenCalledWith(TASK_ID);
      expect(result).toEqual({ message: "Task deleted successfully" });
    });

    it("throws NotFoundError when task does not exist", async () => {
      mockFindById.mockResolvedValueOnce(null);

      await expect(deleteTask(USER_ID, "nonexistent")).rejects.toThrow(NotFoundError);

      expect(mockDeleteTask).not.toHaveBeenCalled();
    });

    it("throws ForbiddenError when task is owned by another user", async () => {
      const prismaTask = makePrismaTask({ userId: OTHER_USER_ID });
      mockFindById.mockResolvedValueOnce(prismaTask);

      await expect(deleteTask(USER_ID, TASK_ID)).rejects.toThrow(ForbiddenError);

      expect(mockDeleteTask).not.toHaveBeenCalled();
    });
  });

  describe("toggleTaskStatus", () => {
    it("toggles TODO to IN_PROGRESS", async () => {
      const prismaTask = makePrismaTask({ status: "TODO" as PrismaTaskStatus });
      const updatedPrismaTask = makePrismaTask({ status: "IN_PROGRESS" as PrismaTaskStatus });

      mockFindById.mockResolvedValueOnce(prismaTask);
      mockUpdate.mockResolvedValueOnce(updatedPrismaTask);

      const result = await toggleTaskStatus(USER_ID, TASK_ID);

      expect(mockUpdate).toHaveBeenCalledWith(TASK_ID, { status: "IN_PROGRESS" });
      expect(result.status).toBe("IN_PROGRESS");
    });

    it("toggles IN_PROGRESS to DONE", async () => {
      const prismaTask = makePrismaTask({ status: "IN_PROGRESS" as PrismaTaskStatus });
      const updatedPrismaTask = makePrismaTask({ status: "DONE" as PrismaTaskStatus });

      mockFindById.mockResolvedValueOnce(prismaTask);
      mockUpdate.mockResolvedValueOnce(updatedPrismaTask);

      const result = await toggleTaskStatus(USER_ID, TASK_ID);

      expect(mockUpdate).toHaveBeenCalledWith(TASK_ID, { status: "DONE" });
      expect(result.status).toBe("DONE");
    });

    it("toggles DONE to TODO", async () => {
      const prismaTask = makePrismaTask({ status: "DONE" as PrismaTaskStatus });
      const updatedPrismaTask = makePrismaTask({ status: "TODO" as PrismaTaskStatus });

      mockFindById.mockResolvedValueOnce(prismaTask);
      mockUpdate.mockResolvedValueOnce(updatedPrismaTask);

      const result = await toggleTaskStatus(USER_ID, TASK_ID);

      expect(mockUpdate).toHaveBeenCalledWith(TASK_ID, { status: "TODO" });
      expect(result.status).toBe("TODO");
    });

    it("throws NotFoundError when task does not exist", async () => {
      mockFindById.mockResolvedValueOnce(null);

      await expect(toggleTaskStatus(USER_ID, "nonexistent")).rejects.toThrow(NotFoundError);

      expect(mockUpdate).not.toHaveBeenCalled();
    });

    it("throws ForbiddenError when task is owned by another user", async () => {
      const prismaTask = makePrismaTask({ userId: OTHER_USER_ID });
      mockFindById.mockResolvedValueOnce(prismaTask);

      await expect(toggleTaskStatus(USER_ID, TASK_ID)).rejects.toThrow(ForbiddenError);

      expect(mockUpdate).not.toHaveBeenCalled();
    });
  });
});