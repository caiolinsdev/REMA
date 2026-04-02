import type { Role } from "../auth/types";

export interface ProfileResponse {
  userId: string;
  role: Role;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
}
