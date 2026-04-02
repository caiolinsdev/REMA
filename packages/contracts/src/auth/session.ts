import type { AuthUser } from "./types";
import type { ProfileResponse } from "../profile/types";

export interface LoginRequest {
  email: string;
  password: string;
}

/** Corpo de `POST /api/auth/login/` */
export interface AuthSessionResponse {
  token: string;
  user: AuthUser & { profile: ProfileResponse };
}

/** Corpo de `GET /api/auth/me/` */
export type MeResponse = AuthSessionResponse["user"];

export type AuthErrorCode =
  | "invalid_body"
  | "invalid_credentials"
  | "no_profile"
  | "session_expired"
  | "forbidden_role";

export interface AuthErrorBody {
  code: AuthErrorCode;
  message: string;
}
