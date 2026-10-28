export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

const TOKEN_KEY = "erpCopitoToken";
const USER_KEY = "erpCopitoUser";
const API_BASE = (import.meta as unknown as { env: Record<string, string | undefined> }).env.VITE_API_URL ?? "http://localhost:4000";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): SessionUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as SessionUser; } catch { return null; }
}

export function saveSession(token: string, user: SessionUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && token) clearSession();
    throw new ApiError(res.status, body?.error?.message ?? `Error ${res.status}`);
  }
  return (body.data ?? body) as T;
}

export interface Page<T> {
  items: T[];
  total: number;
}

async function list<T>(path: string): Promise<Page<T>> {
  const res = await fetch(`${API_BASE}${path}`, { headers: { Authorization: `Bearer ${getToken()}` } });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, body?.error?.message ?? `Error ${res.status}`);
  return { items: body.data as T[], total: body.meta?.total ?? (body.data as T[]).length };
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data?: unknown) => request<T>(path, { method: "POST", body: data ? JSON.stringify(data) : undefined }),
  patch: <T>(path: string, data: unknown) => request<T>(path, { method: "PATCH", body: JSON.stringify(data) }),
  put: <T>(path: string, data: unknown) => request<T>(path, { method: "PUT", body: JSON.stringify(data) }),
  remove: async (path: string) => { await request<unknown>(path, { method: "DELETE" }); },
  list,
  login: (email: string, password: string) =>
    request<{ token: string; user: SessionUser }>("/api/v1/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
};
