"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import type { Task, CreateTaskInput, UpdateTaskInput } from "@/types";
import { TaskStatus } from "@/types";
import { STATUS_OPTIONS, MAX_TITLE_LENGTH, MAX_DESCRIPTION_LENGTH } from "@/constants";

interface TaskFormProps {
  task?: Task | null;
  onSubmit: (input: CreateTaskInput | UpdateTaskInput) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

interface FormErrors {
  title?: string;
  description?: string;
  status?: string;
  dueDate?: string;
  form?: string;
}

function formatDateForInput(dateString: string | null): string {
  if (!dateString) {
    return "";
  }
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return "";
    }
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return "";
  }
}

export const TaskForm: React.FC<TaskFormProps> = ({
  task = null,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const isEditing = task !== null;

  const [title, setTitle] = useState<string>(task?.title ?? "");
  const [description, setDescription] = useState<string>(task?.description ?? "");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? TaskStatus.TODO);
  const [dueDate, setDueDate] = useState<string>(formatDateForInput(task?.dueDate ?? null));
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const titleInputRef = useRef<HTMLInputElement>(null);
  const errorAnnouncerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    titleInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setStatus(task.status);
      setDueDate(formatDateForInput(task.dueDate));
      setErrors({});
      setTouched({});
    }
  }, [task]);

  const validateTitle = useCallback((value: string): string | undefined => {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return "Title is required";
    }
    if (trimmed.length > MAX_TITLE_LENGTH) {
      return `Title must be at most ${MAX_TITLE_LENGTH} characters`;
    }
    return undefined;
  }, []);

  const validateDescription = useCallback((value: string): string | undefined => {
    if (value.length > MAX_DESCRIPTION_LENGTH) {
      return `Description must be at most ${MAX_DESCRIPTION_LENGTH} characters`;
    }
    return undefined;
  }, []);

  const validateDueDate = useCallback((value: string): string | undefined => {
    if (!value) {
      return undefined;
    }
    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) {
      return "Due date must be a valid date";
    }
    return undefined;
  }, []);

  const validateStatus = useCallback((value: string): string | undefined => {
    const validStatuses = Object.values(TaskStatus) as string[];
    if (!validStatuses.includes(value)) {
      return `Status must be one of: ${validStatuses.join(", ")}`;
    }
    return undefined;
  }, []);

  const validateForm = useCallback((): FormErrors => {
    const newErrors: FormErrors = {};

    const titleError = validateTitle(title);
    if (titleError) {
      newErrors.title = titleError;
    }

    const descriptionError = validateDescription(description);
    if (descriptionError) {
      newErrors.description = descriptionError;
    }

    const statusError = validateStatus(status);
    if (statusError) {
      newErrors.status = statusError;
    }

    const dueDateError = validateDueDate(dueDate);
    if (dueDateError) {
      newErrors.dueDate = dueDateError;
    }

    return newErrors;
  }, [title, description, status, dueDate, validateTitle, validateDescription, validateStatus, validateDueDate]);

  const handleBlur = useCallback((field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));

    setErrors((prev) => {
      const newErrors = { ...prev };
      switch (field) {
        case "title":
          newErrors.title = validateTitle(title);
          break;
        case "description":
          newErrors.description = validateDescription(description);
          break;
        case "status":
          newErrors.status = validateStatus(status);
          break;
        case "dueDate":
          newErrors.dueDate = validateDueDate(dueDate);
          break;
      }
      return newErrors;
    });
  }, [title, description, status, dueDate, validateTitle, validateDescription, validateStatus, validateDueDate]);

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTitle(value);
    if (touched.title) {
      setErrors((prev) => ({ ...prev, title: validateTitle(value) }));
    }
  }, [touched.title, validateTitle]);

  const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setDescription(value);
    if (touched.description) {
      setErrors((prev) => ({ ...prev, description: validateDescription(value) }));
    }
  }, [touched.description, validateDescription]);

  const handleStatusChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as TaskStatus;
    setStatus(value);
    if (touched.status) {
      setErrors((prev) => ({ ...prev, status: validateStatus(value) }));
    }
  }, [touched.status, validateStatus]);

  const handleDueDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDueDate(value);
    if (touched.dueDate) {
      setErrors((prev) => ({ ...prev, dueDate: validateDueDate(value) }));
    }
  }, [touched.dueDate, validateDueDate]);

  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setTouched({ title: true, description: true, status: true, dueDate: true });

    const formErrors = validateForm();
    setErrors(formErrors);

    const hasErrors = Object.values(formErrors).some((error) => error !== undefined);
    if (hasErrors) {
      const firstErrorField = Object.keys(formErrors).find(
        (key) => formErrors[key as keyof FormErrors] !== undefined
      );
      if (firstErrorField) {
        const element = document.getElementById(`task-${firstErrorField}`);
        element?.focus();
      }
      return;
    }

    try {
      const trimmedTitle = title.trim();
      const trimmedDescription = description.trim();
      const dueDateValue = dueDate ? new Date(dueDate).toISOString() : null;

      if (isEditing) {
        const input: UpdateTaskInput = {
          title: trimmedTitle,
          description: trimmedDescription,
          status,
          dueDate: dueDateValue,
        };
        await onSubmit(input);
      } else {
        const input: CreateTaskInput = {
          title: trimmedTitle,
          description: trimmedDescription,
          status,
          dueDate: dueDateValue,
        };
        await onSubmit(input);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unexpected error occurred";
      setErrors((prev) => ({ ...prev, form: message }));
    }
  }, [title, description, status, dueDate, isEditing, onSubmit, validateForm]);

  const errorCount = Object.values(errors).filter((e) => e !== undefined).length;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label={isEditing ? "Edit task" : "Create task"}
      className="space-y-5"
    >
      <div
        ref={errorAnnouncerRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {errorCount > 0
          ? `Form has ${errorCount} ${errorCount === 1 ? "error" : "errors"}. Please correct them before submitting.`
          : ""}
      </div>

      {errors.form && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {errors.form}
        </div>
      )}

      <div>
        <label
          htmlFor="task-title"
          className="block text-sm font-medium text-gray-700"
        >
          Title <span aria-hidden="true">*</span>
          <span className="sr-only">(required)</span>
        </label>
        <input
          ref={titleInputRef}
          id="task-title"
          type="text"
          value={title}
          onChange={handleTitleChange}
          onBlur={() => handleBlur("title")}
          required
          maxLength={MAX_TITLE_LENGTH}
          aria-required="true"
          aria-invalid={touched.title && errors.title ? "true" : undefined}
          aria-describedby={
            touched.title && errors.title ? "task-title-error" : undefined
          }
          placeholder="Enter task title"
          className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
            touched.title && errors.title
              ? "border-red-300 focus:border-red-500 focus:ring-red-500"
              : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          }`}
        />
        {touched.title && errors.title && (
          <p
            id="task-title-error"
            role="alert"
            className="mt-1 text-sm text-red-600"
          >
            {errors.title}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="task-description"
          className="block text-sm font-medium text-gray-700"
        >
          Description
        </label>
        <textarea
          id="task-description"
          value={description}
          onChange={handleDescriptionChange}
          onBlur={() => handleBlur("description")}
          maxLength={MAX_DESCRIPTION_LENGTH}
          rows={4}
          aria-invalid={touched.description && errors.description ? "true" : undefined}
          aria-describedby={
            touched.description && errors.description
              ? "task-description-error"
              : "task-description-hint"
          }
          placeholder="Enter task description (optional)"
          className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-1 ${
            touched.description && errors.description
              ? "border-red-300 focus:border-red-500 focus:ring-red-500"
              : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          }`}
        />
        {touched.description && errors.description ? (
          <p
            id="task-description-error"
            role="alert"
            className="mt-1 text-sm text-red-600"
          >
            {errors.description}
          </p>
        ) : (
          <p
            id="task-description-hint"
            className="mt-1 text-xs text-gray-500"
          >
            {description.length}/{MAX_DESCRIPTION_LENGTH} characters
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="task-status"
          className="block text-sm font-medium text-gray-700"
        >
          Status
        </label>
        <select
          id="task-status"
          value={status}
          onChange={handleStatusChange}
          onBlur={() => handleBlur("status")}
          aria-invalid={touched.status && errors.status ? "true" : undefined}
          aria-describedby={
            touched.status && errors.status ? "task-status-error" : undefined
          }
          className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${
            touched.status && errors.status
              ? "border-red-300 focus:border-red-500 focus:ring-red-500"
              : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          }`}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {touched.status && errors.status && (
          <p
            id="task-status-error"
            role="alert"
            className="mt-1 text-sm text-red-600"
          >
            {errors.status}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="task-dueDate"
          className="block text-sm font-medium text-gray-700"
        >
          Due Date
        </label>
        <input
          id="task-dueDate"
          type="date"
          value={dueDate}
          onChange={handleDueDateChange}
          onBlur={() => handleBlur("dueDate")}
          aria-invalid={touched.dueDate && errors.dueDate ? "true" : undefined}
          aria-describedby={
            touched.dueDate && errors.dueDate ? "task-dueDate-error" : undefined
          }
          className={`mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${
            touched.dueDate && errors.dueDate
              ? "border-red-300 focus:border-red-500 focus:ring-red-500"
              : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
          }`}
        />
        {touched.dueDate && errors.dueDate && (
          <p
            id="task-dueDate-error"
            role="alert"
            className="mt-1 text-sm text-red-600"
          >
            {errors.dueDate}
          </p>
        )}
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting
            ? isEditing
              ? "Saving…"
              : "Creating…"
            : isEditing
              ? "Save Changes"
              : "Create Task"}
        </button>
      </div>
    </form>
  );
};

export default TaskForm;