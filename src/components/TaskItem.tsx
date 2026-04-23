"use client";

import React, { useState, useCallback } from "react";
import type { Task } from "@/types";
import { TaskStatus } from "@/types";

interface TaskItemProps {
  task: Task;
  onToggleComplete: (taskId: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

const statusBadgeClasses: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: "bg-gray-100 text-gray-800",
  [TaskStatus.IN_PROGRESS]: "bg-blue-100 text-blue-800",
  [TaskStatus.DONE]: "bg-green-100 text-green-800",
};

const statusLabels: Record<TaskStatus, string> = {
  [TaskStatus.TODO]: "To Do",
  [TaskStatus.IN_PROGRESS]: "In Progress",
  [TaskStatus.DONE]: "Done",
};

function formatDueDate(dueDate: string): string {
  const date = new Date(dueDate);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isDueDateOverdue(dueDate: string): boolean {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return due < now;
}

function truncateDescription(description: string, maxLength: number = 120): string {
  if (description.length <= maxLength) {
    return description;
  }
  return description.slice(0, maxLength).trimEnd() + "…";
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  const isDone = task.status === TaskStatus.DONE;

  const handleToggleComplete = useCallback(() => {
    const newStatus = isDone ? TaskStatus.TODO : TaskStatus.DONE;
    onToggleComplete(task.id, newStatus);
  }, [isDone, onToggleComplete, task.id]);

  const handleEdit = useCallback(() => {
    onEdit(task);
  }, [onEdit, task]);

  const handleDeleteClick = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    onDelete(task.id);
    setShowDeleteConfirm(false);
  }, [onDelete, task.id]);

  const handleDeleteCancel = useCallback(() => {
    setShowDeleteConfirm(false);
  }, []);

  const handleKeyDownToggle = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleToggleComplete();
      }
    },
    [handleToggleComplete]
  );

  const overdue =
    task.dueDate !== null && !isDone && isDueDateOverdue(task.dueDate);

  return (
    <li
      className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
      aria-label={`Task: ${task.title}`}
    >
      <div
        role="checkbox"
        aria-checked={isDone}
        aria-label={`Mark "${task.title}" as ${isDone ? "incomplete" : "complete"}`}
        tabIndex={0}
        onClick={handleToggleComplete}
        onKeyDown={handleKeyDownToggle}
        className={`mt-1 flex h-5 w-5 flex-shrink-0 cursor-pointer items-center justify-center rounded border-2 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
          isDone
            ? "border-green-500 bg-green-500 text-white"
            : "border-gray-300 bg-white hover:border-gray-400"
        }`}
      >
        {isDone && (
          <svg
            className="h-3 w-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3
            className={`text-sm font-semibold ${
              isDone ? "text-gray-400 line-through" : "text-gray-900"
            }`}
          >
            {task.title}
          </h3>
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeClasses[task.status]}`}
            aria-label={`Status: ${statusLabels[task.status]}`}
          >
            {statusLabels[task.status]}
          </span>
        </div>

        {task.description && (
          <p
            className={`mt-1 text-sm ${
              isDone ? "text-gray-400" : "text-gray-600"
            }`}
          >
            {truncateDescription(task.description)}
          </p>
        )}

        {task.dueDate !== null && (
          <p
            className={`mt-1 text-xs ${
              overdue
                ? "font-medium text-red-600"
                : isDone
                  ? "text-gray-400"
                  : "text-gray-500"
            }`}
            aria-label={`Due date: ${formatDueDate(task.dueDate)}${overdue ? " (overdue)" : ""}`}
          >
            <span aria-hidden="true">📅</span>{" "}
            {formatDueDate(task.dueDate)}
            {overdue && <span className="ml-1">(Overdue)</span>}
          </p>
        )}
      </div>

      <div className="flex flex-shrink-0 items-center gap-1">
        {!showDeleteConfirm ? (
          <>
            <button
              type="button"
              onClick={handleEdit}
              aria-label={`Edit task "${task.title}"`}
              className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
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
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleDeleteClick}
              aria-label={`Delete task "${task.title}"`}
              className="rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </>
        ) : (
          <div
            role="alertdialog"
            aria-label="Confirm deletion"
            className="flex items-center gap-1"
          >
            <span className="mr-1 text-xs text-gray-600">Delete?</span>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              aria-label="Confirm delete"
              className="rounded bg-red-600 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
            >
              Yes
            </button>
            <button
              type="button"
              onClick={handleDeleteCancel}
              aria-label="Cancel delete"
              className="rounded bg-gray-200 px-2 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1"
            >
              No
            </button>
          </div>
        )}
      </div>
    </li>
  );
};

export default TaskItem;