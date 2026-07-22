const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type LoginResponse = {
  token: string;
  user: AuthUser;
};

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function setToken(token: string) {
  localStorage.setItem("token", token);
}

export function clearToken() {
  localStorage.removeItem("token");
}

export function isAuthenticated(): boolean {
  return Boolean(getToken());
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  const token = getToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      (data as { message?: string }).message ?? "Request failed"
    );
  }

  return data as T;
}

export const api = {
  login(email: string, password: string) {
    return request<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },
  logout() {
    return request<{ message: string }>("/api/auth/logout", {
      method: "POST",
    });
  },
  me() {
    return request<{ user: AuthUser }>("/api/auth/me");
  },
  dashboardStats() {
    return request<{
      totalCertificates: number;
      totalTemplates: number;
      blockchainTransactions: number;
      certificatesVerified: number;
    }>("/api/dashboard/stats");
  },
};
