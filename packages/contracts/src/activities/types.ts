export type ActivityKind = "prova" | "atividade" | "trabalho";
export type ActivityStatus = "draft" | "published" | "closed" | "archived";

export type QuestionType = "dissertativa" | "multipla_escolha";

export interface QuestionOption {
  id: string;
  label: string;
  position: number;
  /** Visivel apenas no contexto de professor / correcao */
  isCorrect?: boolean;
}

export interface QuestionOptionInput {
  label: string;
  position: number;
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

export interface QuestionInput {
  statement: string;
  type: QuestionType;
  weight: number;
  position: number;
  supportImageUrl?: string | null;
  /** Nunca expor ao aluno durante realizacao */
  expectedAnswer?: string | null;
  options?: QuestionOptionInput[];
}

export interface ActivitySummary {
  id: string;
  title: string;
  kind: ActivityKind;
  status: ActivityStatus;
  dueAt: string | null;
  totalScore: number;
  createdBy: string;
}

export interface ActivityDetail extends ActivitySummary {
  description: string;
  questions?: QuestionDetail[];
  validation?: ActivityValidationSummary;
}

export interface UpsertActivityRequest {
  title: string;
  description: string;
  kind: ActivityKind;
  dueAt?: string | null;
  totalScore: number;
  questions?: QuestionInput[];
}

export interface AddQuestionRequest extends QuestionInput {
  activityId?: string;
}

export type ActivityValidationIssueCode =
  | "total_score_must_be_100"
  | "question_limit_exceeded"
  | "question_weights_must_sum_100"
  | "trabalho_requires_description"
  | "multiple_choice_limit_exceeded";

export interface ActivityValidationIssue {
  code: ActivityValidationIssueCode;
  message: string;
}

export interface ActivityValidationSummary {
  canPublish: boolean;
  issues: ActivityValidationIssue[];
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

export interface SubmissionAnswerInput {
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

export interface SubmissionFileInput {
  fileName: string;
  fileUrl: string;
  fileType: string;
}

export interface SubmissionDetail extends SubmissionSummary {
  answers?: SubmissionAnswer[];
  files?: SubmissionFile[];
  feedback?: string | null;
}

export interface UpsertSubmissionRequest {
  answers?: SubmissionAnswerInput[];
  files?: SubmissionFileInput[];
}

export interface SubmissionListItem extends SubmissionSummary {
  studentName: string;
}

export interface ReviewPayload {
  score: number;
  comment: string;
}
