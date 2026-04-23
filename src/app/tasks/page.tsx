"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTasks } from "@/hooks/useTasks";
import { Header } from "@/components/Header";
import { TaskForm } from "@/components/TaskForm";
import { TaskList } from "@/components/TaskList";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import type { Task, CreateTaskInput, UpdateTaskInput } from "@/types";
import type { TaskStatus } from "@/types";

export default function TasksPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const {
    tasks,
    isLoading: tasksLoading,
    error,
    currentPage,
    totalPages,
    loadTasks,
    addTask,
    editTask,
    removeTask,
    toggleStatus,
    clearError,
  } = useTasks();

  const [showTaskForm, setShowTaskForm] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [deleteTaskTitle, setDeleteTaskTitle] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState<string>("");

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadTasks(1);
    }
  }, [isAuthenticated]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePageChange = useCallback(
    (page: number) => {
      loadTasks(page);
    },
    [loadTasks]
  );

  const handleShowCreateForm = useCallback(() => {
    setEditingTask(null);
    setShowTaskForm(true);
    clearError();
  }, [clearError]);

  const handleCancelForm = useCallback(() => {
    setShowTaskForm(false);
    setEditingTask(null);
  }, []);

  const handleCreateTask = useCallback(
    async (input: CreateTaskInput | UpdateTaskInput) => {
      setIsSubmitting(true);
      try {
        await addTask(input as CreateTaskInput);
        setShowTaskForm(false);
        setStatusMessage("Task created successfully");
        setTimeout(() => setStatusMessage(""), 3000);
      } catch {
        // Error is handled by useTasks hook
      } finally {
        setIsSubmitting(false);
      }
    },
    [addTask]
  );

  const handleEditClick = useCallback(
    (task: Task) => {
      setEditingTask(task);
      setShowTaskForm(true);
      clearError();
    },
    [clearError]
  );

  const handleUpdateTask = useCallback(
    async (input: CreateTaskInput | UpdateTaskInput) => {
      if (!editingTask) return;
      setIsSubmitting(true);
      try {
        await editTask(editingTask.id, input as UpdateTaskInput);
        setShowTaskForm(false);
        setEditingTask(null);
        setStatusMessage("Task updated successfully");
        setTimeout(() => setStatusMessage(""), 3000);
      } catch {
        // Error is handled by useTasks hook
      } finally {
        setIsSubmitting(false);
      }
    },
    [editingTask, editTask]
  );

  const handleDeleteClick = useCallback((taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    setDeleteTaskId(taskId);
    setDeleteTaskTitle(task?.title ?? "this task");
  }, [tasks]);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTaskId) return;
    try {
      await removeTask(deleteTaskId);
      setStatusMessage("Task deleted successfully");
      setTimeout(() => setStatusMessage(""), 3000);
    } catch {
      // Error is handled by useTasks hook
    } finally {
      setDeleteTaskId(null);
      setDeleteTaskTitle("");
    }
  }, [deleteTaskId, removeTask]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteTaskId(null);
    setDeleteTaskTitle("");
  }, []);

  const handleToggleComplete = useCallback(
    (taskId: string, status: TaskStatus) => {
      toggleStatus(taskId, status);
    },
    [toggleStatus]
  );

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold text-gray-900">My Tasks</h1>
          {!showTaskForm && (
            <button
              type="button"
              onClick={handleShowCreateForm}
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Add a new task"
            >
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Task
            </button>
          )}
        </div>

        {statusMessage && (
          <div
            role="status"
            aria-live="polite"
            className="mb-4 rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-700"
          >
            {statusMessage}
          </div>
        )}

        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700"
          >
            <div className="flex items-center justify-between">
              <span>{error}</span>
              <button
                type="button"
                onClick={clearError}
                className="ml-2 text-red-500 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                aria-label="Dismiss error"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {showTaskForm && (
          <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              {editingTask ? "Edit Task" : "Create New Task"}
            </h2>
            <TaskForm
              task={editingTask}
              onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
              onCancel={handleCancelForm}
              isSubmitting={isSubmitting}
            />
          </div>
        )}

        <TaskList
          tasks={tasks}
          isLoading={tasksLoading}
          page={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          onToggleComplete={handleToggleComplete}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
        />
      </div>

      <ConfirmDialog
        isOpen={deleteTaskId !== null}
        title="Delete Task"
        message={`Are you sure you want to delete "${deleteTaskTitle}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
}