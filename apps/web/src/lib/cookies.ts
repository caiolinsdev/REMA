const TOKEN = "rema_token";
const ROLE = "rema_role";

const maxAgeSeconds = 60 * 60 * 24 * 14;

export function setAuthCookies(token: string, role: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${TOKEN}=${encodeURIComponent(token)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
  document.cookie = `${ROLE}=${encodeURIComponent(role)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
}

export function clearAuthCookies() {
  if (typeof document === "undefined") return;
  document.cookie = `${TOKEN}=; path=/; max-age=0`;
  document.cookie = `${ROLE}=; path=/; max-age=0`;
}

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

export function getStoredToken(): string | null {
  return getCookie(TOKEN);
}

export function getStoredRole(): string | null {
  return getCookie(ROLE);
}
