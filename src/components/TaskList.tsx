"use client";

import React from "react";
import type { Task } from "@/types";
import type { TaskStatus } from "@/types";
import { TaskItem } from "@/components/TaskItem";
import { Pagination } from "@/components/Pagination";
import { LoadingSpinner } from "@/components/LoadingSpinner";

interface TaskListProps {
  tasks: Task[];
  isLoading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onToggleComplete: (taskId: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

function TaskListSkeleton() {
  return (
    <div role="status" aria-label="Loading tasks" className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="mt-1 h-5 w-5 flex-shrink-0 animate-pulse rounded border-2 border-gray-200 bg-gray-100" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <div className="h-4 w-40 animate-pulse rounded bg-gray-200" />
              <div className="h-5 w-16 animate-pulse rounded-full bg-gray-100" />
            </div>
            <div className="h-3 w-64 animate-pulse rounded bg-gray-100" />
            <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
          </div>
          <div className="flex flex-shrink-0 items-center gap-1">
            <div className="h-7 w-7 animate-pulse rounded bg-gray-100" />
            <div className="h-7 w-7 animate-pulse rounded bg-gray-100" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading tasks...</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center"
    >
      <svg
        className="mx-auto h-12 w-12 text-gray-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
      <h3 className="mt-4 text-lg font-medium text-gray-900">No tasks yet</h3>
      <p className="mt-1 text-sm text-gray-500">
        Get started by creating your first task.
      </p>
    </div>
  );
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  isLoading,
  page,
  totalPages,
  onPageChange,
  onToggleComplete,
  onEdit,
  onDelete,
}) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <TaskListSkeleton />
      </div>
    );
  }

  if (tasks.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-4">
      <ul
        role="list"
        aria-label="Task list"
        className="space-y-3"
      >
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onToggleComplete={onToggleComplete}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </ul>

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
};

export default TaskList;