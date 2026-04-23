"use client";

import { useState, useCallback } from "react";
import type { Task, CreateTaskInput, UpdateTaskInput } from "@/types";
import type { TaskStatus } from "@/types";
import { fetchTasks, createTask, updateTask, deleteTask, toggleTaskStatus } from "@/lib/api-client";
import { TASKS_PER_PAGE } from "@/constants";

interface UseTasksState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalCount: number;
}

interface UseTasksReturn extends UseTasksState {
  loadTasks: (page?: number, status?: TaskStatus) => Promise<void>;
  addTask: (input: CreateTaskInput) => Promise<Task>;
  editTask: (id: string, input: UpdateTaskInput) => Promise<Task>;
  removeTask: (id: string) => Promise<void>;
  toggleStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  setCurrentPage: (page: number) => void;
  clearError: () => void;
}

export function useTasks(): UseTasksReturn {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const loadTasks = useCallback(async (page?: number, status?: TaskStatus): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const targetPage = page ?? currentPage;
      const response = await fetchTasks({
        page: targetPage,
        limit: TASKS_PER_PAGE,
        status,
      });

      setTasks(response.data);
      setCurrentPage(response.page);
      setTotalPages(response.totalPages);
      setTotalCount(response.total);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load tasks";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage]);

  const addTask = useCallback(async (input: CreateTaskInput): Promise<Task> => {
    setError(null);

    try {
      const newTask = await createTask(input);

      setTasks((prev) => [newTask, ...prev]);
      setTotalCount((prev) => prev + 1);

      const newTotalPages = Math.ceil((totalCount + 1) / TASKS_PER_PAGE);
      setTotalPages(newTotalPages);

      return newTask;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create task";
      setError(message);
      throw err;
    }
  }, [totalCount]);

  const editTask = useCallback(async (id: string, input: UpdateTaskInput): Promise<Task> => {
    setError(null);

    try {
      const updatedTask = await updateTask(id, input);

      setTasks((prev) =>
        prev.map((task) => (task.id === id ? updatedTask : task))
      );

      return updatedTask;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update task";
      setError(message);
      throw err;
    }
  }, []);

  const removeTask = useCallback(async (id: string): Promise<void> => {
    setError(null);

    try {
      await deleteTask(id);

      setTasks((prev) => prev.filter((task) => task.id !== id));
      setTotalCount((prev) => {
        const newTotal = Math.max(0, prev - 1);
        const newTotalPages = Math.max(1, Math.ceil(newTotal / TASKS_PER_PAGE));
        setTotalPages(newTotalPages);

        if (currentPage > newTotalPages) {
          setCurrentPage(newTotalPages);
        }

        return newTotal;
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to delete task";
      setError(message);
      throw err;
    }
  }, [currentPage]);

  const toggleStatus = useCallback(async (taskId: string, status: TaskStatus): Promise<void> => {
    setError(null);

    try {
      const updatedTask = await toggleTaskStatus(taskId, status);

      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? updatedTask : task))
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update task status";
      setError(message);
      throw err;
    }
  }, []);

  return {
    tasks,
    isLoading,
    error,
    currentPage,
    totalPages,
    totalCount,
    loadTasks,
    addTask,
    editTask,
    removeTask,
    toggleStatus,
    setCurrentPage,
    clearError,
  };
}

export default useTasks;