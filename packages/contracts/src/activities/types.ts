import type { DomainLifecycleState } from "../common/states";

export type ActivityKind = "prova" | "atividade" | "trabalho";

export type QuestionType = "dissertativa" | "multipla_escolha";

export interface QuestionOption {
  id: string;
  label: string;
  position: number;
  /** Visivel apenas no contexto de professor / correcao */
  isCorrect?: boolean;
}

export interface QuestionDetail {
  id: string;
  activityId: string;
  statement: string;
  type: QuestionType;
  weight: number;
  position: number;
  supportImageUrl?: string | null;
  /** Nunca expor ao aluno durante realizacao */
  expectedAnswer?: string | null;
  options?: QuestionOption[];
}

export interface ActivitySummary {
  id: string;
  title: string;
  kind: ActivityKind;
  status: DomainLifecycleState;
  dueAt: string | null;
  totalScore: number;
  createdBy: string;
}

export interface ActivityDetail extends ActivitySummary {
  description: string;
  questions?: QuestionDetail[];
}

export type SubmissionStatus = "pending" | "in_progress" | "submitted" | "reviewed";

export interface SubmissionSummary {
  id: string;
  activityId: string;
  studentId: string;
  status: SubmissionStatus;
  submittedAt: string | null;
  score: number | null;
}

export interface SubmissionAnswer {
  questionId: string;
  answerText?: string | null;
  selectedOptionId?: string | null;
}

export interface SubmissionFile {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
}

export interface SubmissionDetail extends SubmissionSummary {
  answers?: SubmissionAnswer[];
  files?: SubmissionFile[];
  feedback?: string | null;
}

export interface ReviewPayload {
  score: number;
  comment: string;
}
