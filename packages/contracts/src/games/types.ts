import type { DomainLifecycleState } from "../common/states";

export type GameExperienceType =
  | "quiz"
  | "memoria"
  | "sequencia"
  | "palavras"
  | "logica";

export interface GameSummary {
  id: string;
  slug: string;
  title: string;
  description: string;
  experienceType: GameExperienceType;
  estimatedMinutes: number;
  status: Extract<DomainLifecycleState, "draft" | "published" | "archived">;
  bestScore?: number | null;
  lastProgress?: number | null;
}

export interface GameDetail extends GameSummary {
  instructions: string;
  totalSessions: number;
}

export interface GameSessionSummary {
  id: string;
  gameId: string;
  gameTitle: string;
  score: number;
  progress: number;
  playedAt: string;
}

export interface RegisterGameSessionRequest {
  score: number;
  progress: number;
}
