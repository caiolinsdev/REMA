import type { DomainLifecycleState } from "../common/states";

export type GameExperienceType =
  | "quiz"
  | "memoria"
  | "sequencia"
  | "palavras"
  | "logica";

export type GameSourceStrategy = "remote_api" | "local_engine" | "hybrid";

export type GameKey =
  | "hangman"
  | "sudoku"
  | "quiz_portuguese"
  | "quiz_math"
  | "maze";

export interface GameSummary {
  id: string;
  slug: string;
  title: string;
  description: string;
  gameKey: GameKey;
  sourceStrategy: GameSourceStrategy;
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

export interface GameQuizOption {
  id: string;
  label: string;
}

export interface GameQuizQuestion {
  id: string;
  prompt: string;
  options: GameQuizOption[];
  correctOptionId: string;
}

export interface HangmanRuntimePayload {
  solutionWord: string;
  maxAttempts: number;
  alphabet: string[];
}

export interface SudokuRuntimePayload {
  puzzle: number[][];
  solution: number[][];
  difficulty: string;
}

export interface QuizRuntimePayload {
  questions: GameQuizQuestion[];
}

export interface MazeCell {
  up: boolean;
  right: boolean;
  down: boolean;
  left: boolean;
}

export interface MazeRuntimePayload {
  rows: number;
  cols: number;
  cells: MazeCell[][];
  start: { row: number; col: number };
  goal: { row: number; col: number };
}

export type GameRuntimeResponse =
  | {
      gameId: string;
      slug: string;
      kind: "hangman";
      sourceStrategy: GameSourceStrategy;
      contentSource: "remote_api" | "local_fallback" | "local_engine";
      payload: HangmanRuntimePayload;
    }
  | {
      gameId: string;
      slug: string;
      kind: "sudoku";
      sourceStrategy: GameSourceStrategy;
      contentSource: "remote_api" | "local_fallback" | "local_engine";
      payload: SudokuRuntimePayload;
    }
  | {
      gameId: string;
      slug: string;
      kind: "quiz_portuguese" | "quiz_math";
      sourceStrategy: GameSourceStrategy;
      contentSource: "remote_api" | "local_fallback" | "local_engine";
      payload: QuizRuntimePayload;
    }
  | {
      gameId: string;
      slug: string;
      kind: "maze";
      sourceStrategy: GameSourceStrategy;
      contentSource: "remote_api" | "local_fallback" | "local_engine";
      payload: MazeRuntimePayload;
    };
