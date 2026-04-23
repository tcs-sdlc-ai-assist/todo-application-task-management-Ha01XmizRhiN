import type { CreateTaskInput, UpdateTaskInput, LoginInput, RegisterInput } from "@/types";
import { TaskStatus } from "@/types";
import { MAX_TITLE_LENGTH, MAX_DESCRIPTION_LENGTH, MIN_PASSWORD_LENGTH } from "@/constants";

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

function createResult(errors: ValidationError[]): ValidationResult {
  return {
    valid: errors.length === 0,
    errors,
  };
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (email === undefined || email === null || email === "") {
    errors.push({ field: "email", message: "Email is required" });
    return createResult(errors);
  }

  if (typeof email !== "string") {
    errors.push({ field: "email", message: "Email must be a string" });
    return createResult(errors);
  }

  const trimmed = email.trim();

  if (trimmed.length === 0) {
    errors.push({ field: "email", message: "Email is required" });
    return createResult(errors);
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    errors.push({ field: "email", message: "Email format is invalid" });
  }

  return createResult(errors);
}

export function validatePassword(password: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (password === undefined || password === null || password === "") {
    errors.push({ field: "password", message: "Password is required" });
    return createResult(errors);
  }

  if (typeof password !== "string") {
    errors.push({ field: "password", message: "Password must be a string" });
    return createResult(errors);
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    errors.push({
      field: "password",
      message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
    });
  }

  return createResult(errors);
}

export function validateTaskTitle(title: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (title === undefined || title === null || title === "") {
    errors.push({ field: "title", message: "Title is required" });
    return createResult(errors);
  }

  if (typeof title !== "string") {
    errors.push({ field: "title", message: "Title must be a string" });
    return createResult(errors);
  }

  const trimmed = title.trim();

  if (trimmed.length === 0) {
    errors.push({ field: "title", message: "Title is required" });
    return createResult(errors);
  }

  if (trimmed.length > MAX_TITLE_LENGTH) {
    errors.push({
      field: "title",
      message: `Title must be at most ${MAX_TITLE_LENGTH} characters`,
    });
  }

  return createResult(errors);
}

export function validateTaskDescription(description: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (description === undefined || description === null || description === "") {
    return createResult(errors);
  }

  if (typeof description !== "string") {
    errors.push({ field: "description", message: "Description must be a string" });
    return createResult(errors);
  }

  if (description.length > MAX_DESCRIPTION_LENGTH) {
    errors.push({
      field: "description",
      message: `Description must be at most ${MAX_DESCRIPTION_LENGTH} characters`,
    });
  }

  return createResult(errors);
}

export function validateTaskStatus(status: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (status === undefined || status === null) {
    return createResult(errors);
  }

  if (typeof status !== "string") {
    errors.push({ field: "status", message: "Status must be a string" });
    return createResult(errors);
  }

  const validStatuses = Object.values(TaskStatus) as string[];
  if (!validStatuses.includes(status)) {
    errors.push({
      field: "status",
      message: `Status must be one of: ${validStatuses.join(", ")}`,
    });
  }

  return createResult(errors);
}

export function validateDueDate(dueDate: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (dueDate === undefined || dueDate === null || dueDate === "") {
    return createResult(errors);
  }

  if (typeof dueDate !== "string") {
    errors.push({ field: "dueDate", message: "Due date must be a string" });
    return createResult(errors);
  }

  const parsed = new Date(dueDate);
  if (isNaN(parsed.getTime())) {
    errors.push({ field: "dueDate", message: "Due date must be a valid date" });
  }

  return createResult(errors);
}

export function validatePaginationParams(params: {
  page?: unknown;
  limit?: unknown;
}): ValidationResult {
  const errors: ValidationError[] = [];

  if (params.page !== undefined && params.page !== null) {
    const page = Number(params.page);
    if (isNaN(page) || !Number.isInteger(page) || page < 1) {
      errors.push({ field: "page", message: "Page must be a positive integer" });
    }
  }

  if (params.limit !== undefined && params.limit !== null) {
    const limit = Number(params.limit);
    if (isNaN(limit) || !Number.isInteger(limit) || limit < 1) {
      errors.push({ field: "limit", message: "Limit must be a positive integer" });
    }
    if (!isNaN(limit) && Number.isInteger(limit) && limit > 100) {
      errors.push({ field: "limit", message: "Limit must be at most 100" });
    }
  }

  return createResult(errors);
}

export function validateLoginInput(input: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (!input || typeof input !== "object") {
    errors.push({ field: "body", message: "Request body is required" });
    return createResult(errors);
  }

  const body = input as Record<string, unknown>;

  const emailResult = validateEmail(body.email);
  errors.push(...emailResult.errors);

  const passwordResult = validatePassword(body.password);
  errors.push(...passwordResult.errors);

  return createResult(errors);
}

export function validateRegisterInput(input: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (!input || typeof input !== "object") {
    errors.push({ field: "body", message: "Request body is required" });
    return createResult(errors);
  }

  const body = input as Record<string, unknown>;

  const emailResult = validateEmail(body.email);
  errors.push(...emailResult.errors);

  const passwordResult = validatePassword(body.password);
  errors.push(...passwordResult.errors);

  return createResult(errors);
}

export function validateCreateTaskInput(input: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (!input || typeof input !== "object") {
    errors.push({ field: "body", message: "Request body is required" });
    return createResult(errors);
  }

  const body = input as Record<string, unknown>;

  const titleResult = validateTaskTitle(body.title);
  errors.push(...titleResult.errors);

  const descriptionResult = validateTaskDescription(body.description);
  errors.push(...descriptionResult.errors);

  const statusResult = validateTaskStatus(body.status);
  errors.push(...statusResult.errors);

  const dueDateResult = validateDueDate(body.dueDate);
  errors.push(...dueDateResult.errors);

  return createResult(errors);
}

export function validateUpdateTaskInput(input: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (!input || typeof input !== "object") {
    errors.push({ field: "body", message: "Request body is required" });
    return createResult(errors);
  }

  const body = input as Record<string, unknown>;

  const hasAnyField =
    body.title !== undefined ||
    body.description !== undefined ||
    body.status !== undefined ||
    body.dueDate !== undefined;

  if (!hasAnyField) {
    errors.push({ field: "body", message: "At least one field must be provided for update" });
    return createResult(errors);
  }

  if (body.title !== undefined) {
    const titleResult = validateTaskTitle(body.title);
    errors.push(...titleResult.errors);
  }

  if (body.description !== undefined) {
    const descriptionResult = validateTaskDescription(body.description);
    errors.push(...descriptionResult.errors);
  }

  if (body.status !== undefined) {
    const statusResult = validateTaskStatus(body.status);
    errors.push(...statusResult.errors);
  }

  if (body.dueDate !== undefined) {
    const dueDateResult = validateDueDate(body.dueDate);
    errors.push(...dueDateResult.errors);
  }

  return createResult(errors);
}