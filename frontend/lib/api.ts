// Frontend API client with JWT handling and fallback
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  phone?: string;
  preferred_language: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
  patient_id?: string;
}

export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("pulseora_token");
};

export const setAuthSession = (authData: AuthResponse) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("pulseora_token", authData.access_token);
  localStorage.setItem("pulseora_user", JSON.stringify(authData.user));
  if (authData.patient_id) {
    localStorage.setItem("pulseora_patient_id", authData.patient_id);
  }
};

export const clearAuthSession = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem("pulseora_token");
  localStorage.removeItem("pulseora_user");
  localStorage.removeItem("pulseora_patient_id");
};

export const getCurrentUser = (): User | null => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("pulseora_user");
  return raw ? JSON.parse(raw) : null;
};

export const getCurrentPatientId = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("pulseora_patient_id");
};

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errDetail = "API request failed";
    try {
      const errJson = await res.json();
      errDetail = errJson.detail || errDetail;
    } catch {
      errDetail = res.statusText || errDetail;
    }
    throw new Error(errDetail);
  }

  return res.json() as Promise<T>;
}
