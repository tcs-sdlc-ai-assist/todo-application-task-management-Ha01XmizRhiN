import { TaskStatus } from "./types";

export const TASKS_PER_PAGE = 20;
export const MAX_TITLE_LENGTH = 255;
export const MAX_DESCRIPTION_LENGTH = 2000;
export const MIN_PASSWORD_LENGTH = 8;
export const JWT_COOKIE_NAME = "auth_token";

export const API_ROUTES = {
  AUTH: {
    LOGIN: "/api/auth/login",
    REGISTER: "/api/auth/register",
    LOGOUT: "/api/auth/logout",
    ME: "/api/auth/me",
  },
  TASKS: {
    BASE: "/api/tasks",
    BY_ID: (id: string) => `/api/tasks/${id}`,
  },
} as const;

export const STATUS_OPTIONS: { label: string; value: TaskStatus }[] = [
  { label: "To Do", value: TaskStatus.TODO },
  { label: "In Progress", value: TaskStatus.IN_PROGRESS },
  { label: "Done", value: TaskStatus.DONE },
];