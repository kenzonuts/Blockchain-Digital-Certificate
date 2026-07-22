const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export type CertificateTemplate = {
  id: string;
  templateName: string;
  backgroundImage: string | null;
  logo: string | null;
  signature: string | null;
  stamp: string | null;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
};

export type Certificate = {
  id: string;
  certificateId: string;
  recipientName: string;
  title: string;
  issueDate: string;
  issuer: string;
  templateId: string;
  pdfPath: string | null;
  certificateHash: string | null;
  transactionHash: string | null;
  blockNumber: number | null;
  blockchainTimestamp: string | null;
  createdAt: string;
  verifyUrl: string;
  template?: {
    id: string;
    templateName: string;
    status: string;
  };
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

export function assetUrl(path?: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  isFormData = false
): Promise<T> {
  const headers = new Headers(options.headers);

  if (!isFormData) {
    headers.set("Content-Type", "application/json");
  }

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
  listTemplates() {
    return request<{ templates: CertificateTemplate[] }>("/api/templates");
  },
  getTemplate(id: string) {
    return request<{ template: CertificateTemplate }>(`/api/templates/${id}`);
  },
  createTemplate(formData: FormData) {
    return request<{ template: CertificateTemplate }>(
      "/api/templates",
      { method: "POST", body: formData },
      true
    );
  },
  updateTemplate(id: string, formData: FormData) {
    return request<{ template: CertificateTemplate }>(
      `/api/templates/${id}`,
      { method: "PUT", body: formData },
      true
    );
  },
  activateTemplate(id: string) {
    return request<{ template: CertificateTemplate }>(
      `/api/templates/${id}/activate`,
      { method: "POST" }
    );
  },
  deleteTemplate(id: string) {
    return request<{ message: string }>(`/api/templates/${id}`, {
      method: "DELETE",
    });
  },
  listCertificates() {
    return request<{ certificates: Certificate[] }>("/api/certificates");
  },
  getCertificate(id: string) {
    return request<{ certificate: Certificate }>(`/api/certificates/${id}`);
  },
  createCertificate(payload: {
    certificateId: string;
    recipientName: string;
    title: string;
    issueDate: string;
    issuer: string;
    templateId: string;
  }) {
    return request<{ certificate: Certificate }>("/api/certificates", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  regenerateCertificate(id: string) {
    return request<{ certificate: Certificate }>(
      `/api/certificates/${id}/regenerate`,
      { method: "POST" }
    );
  },
  publishCertificate(id: string) {
    return request<{
      certificate: Certificate;
      issuerWallet: string;
    }>(`/api/certificates/${id}/publish`, { method: "POST" });
  },
  async downloadCertificate(id: string, filename: string) {
    const token = getToken();
    const res = await fetch(`${API_URL}/api/certificates/${id}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      credentials: "include",
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(
        (data as { message?: string }).message ?? "Download failed"
      );
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename.endsWith(".pdf") ? filename : `${filename}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};
