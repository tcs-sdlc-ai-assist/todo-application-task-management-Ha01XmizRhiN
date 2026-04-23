import type {
  AuthResponse,
  LoginInput,
  RegisterInput,
  CreateTaskInput,
  UpdateTaskInput,
  Task,
  PaginatedResponse,
} from "@/types";
import { TaskStatus } from "@/types";
import { API_ROUTES } from "@/constants";

const TOKEN_KEY = "auth_token";

function getToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem(TOKEN_KEY);
}

function buildHeaders(includeAuth: boolean = false): HeadersInit {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (includeAuth) {
    const token = getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  return headers;
}

async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("application/json");

  if (!response.ok) {
    if (isJson) {
      const errorData = await response.json();
      const message =
        errorData?.error?.message ||
        errorData?.message ||
        `Request failed with status ${response.status}`;
      throw new Error(message);
    }
    throw new Error(`Request failed with status ${response.status}`);
  }

  if (isJson) {
    return (await response.json()) as T;
  }

  return {} as T;
}

export async function registerUser(input: RegisterInput): Promise<AuthResponse> {
  const response = await fetch(API_ROUTES.AUTH.REGISTER, {
    method: "POST",
    headers: buildHeaders(false),
    body: JSON.stringify(input),
  });

  const data = await handleResponse<AuthResponse>(response);
  setToken(data.token);
  return data;
}

export async function loginUser(input: LoginInput): Promise<AuthResponse> {
  const response = await fetch(API_ROUTES.AUTH.LOGIN, {
    method: "POST",
    headers: buildHeaders(false),
    body: JSON.stringify(input),
  });

  const data = await handleResponse<AuthResponse>(response);
  setToken(data.token);
  return data;
}

export function logoutUser(): void {
  removeToken();
}

interface FetchTasksParams {
  page?: number;
  limit?: number;
  status?: TaskStatus;
}

export async function fetchTasks(
  params?: FetchTasksParams
): Promise<PaginatedResponse<Task>> {
  const searchParams = new URLSearchParams();

  if (params?.page !== undefined) {
    searchParams.set("page", String(params.page));
  }
  if (params?.limit !== undefined) {
    searchParams.set("limit", String(params.limit));
  }
  if (params?.status !== undefined) {
    searchParams.set("status", params.status);
  }

  const queryString = searchParams.toString();
  const url = queryString
    ? `${API_ROUTES.TASKS.BASE}?${queryString}`
    : API_ROUTES.TASKS.BASE;

  const response = await fetch(url, {
    method: "GET",
    headers: buildHeaders(true),
  });

  return handleResponse<PaginatedResponse<Task>>(response);
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const response = await fetch(API_ROUTES.TASKS.BASE, {
    method: "POST",
    headers: buildHeaders(true),
    body: JSON.stringify(input),
  });

  return handleResponse<Task>(response);
}

export async function updateTask(
  id: string,
  input: UpdateTaskInput
): Promise<Task> {
  const response = await fetch(API_ROUTES.TASKS.BY_ID(id), {
    method: "PUT",
    headers: buildHeaders(true),
    body: JSON.stringify(input),
  });

  return handleResponse<Task>(response);
}

export async function deleteTask(id: string): Promise<{ message: string }> {
  const response = await fetch(API_ROUTES.TASKS.BY_ID(id), {
    method: "DELETE",
    headers: buildHeaders(true),
  });

  return handleResponse<{ message: string }>(response);
}

export async function toggleTaskStatus(
  taskId: string,
  status: TaskStatus
): Promise<Task> {
  return updateTask(taskId, { status });
}