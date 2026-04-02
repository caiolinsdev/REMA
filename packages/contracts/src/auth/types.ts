export type Role = "aluno" | "professor";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}
