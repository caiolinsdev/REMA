import type { AuthSessionResponse, LoginRequest, MeResponse } from "@rema/contracts";
import { Platform } from "react-native";

export function getApiBase(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  return Platform.OS === "android"
    ? "http://10.0.2.2:8000/api"
    : "http://localhost:8000/api";
}

export async function apiLogin(body: LoginRequest): Promise<AuthSessionResponse> {
  const res = await fetch(`${getApiBase()}/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as { message?: string };
  if (!res.ok) {
    throw new Error(data.message ?? "Falha no login");
  }
  return data as AuthSessionResponse;
}

export async function apiMe(token: string): Promise<MeResponse> {
  const res = await fetch(`${getApiBase()}/auth/me/`, {
    headers: { Authorization: `Token ${token}` },
  });
  if (res.status === 401) {
    throw new Error("session_expired");
  }
  const data = (await res.json().catch(() => ({}))) as { message?: string };
  if (!res.ok) {
    throw new Error(data.message ?? "Falha ao carregar sessao");
  }
  return data as MeResponse;
}

export async function apiLogout(token: string): Promise<void> {
  await fetch(`${getApiBase()}/auth/logout/`, {
    method: "POST",
    headers: { Authorization: `Token ${token}` },
  });
}
