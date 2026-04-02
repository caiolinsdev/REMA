import type { Role } from "../auth/types";

export interface ProfileResponse {
  userId: string;
  role: Role;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  preferences?: Record<string, string | boolean | number | null>;
}

export interface UpdateProfileRequest {
  displayName: string;
  bio?: string | null;
  preferences?: Record<string, string | boolean | number | null>;
}

export interface UpdateAvatarRequest {
  avatarUrl: string;
}
