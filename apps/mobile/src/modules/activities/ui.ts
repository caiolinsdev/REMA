export type ActivityKind = "prova" | "atividade" | "trabalho";
export type ActivityStatus = "draft" | "published" | "closed" | "archived";
export type QuestionType = "dissertativa" | "multipla_escolha";
export type SubmissionStatus = "pending" | "in_progress" | "submitted" | "reviewed";

export function activityKindBehaviorLabel(kind: ActivityKind) {
  const labels: Record<ActivityKind, string> = {
    prova: "Prova",
    atividade: "Atividade",
    trabalho: "Trabalho",
  };
  return labels[kind];
}

export function activityStatusLabel(status: string) {
  const labels: Record<ActivityStatus, string> = {
    draft: "Rascunho",
    published: "Publicada",
    closed: "Encerrada",
    archived: "Arquivada",
  };
  return labels[status as ActivityStatus] ?? status;
}

export function questionTypeLabel(type: string) {
  const labels: Record<QuestionType, string> = {
    dissertativa: "Dissertativa",
    multipla_escolha: "Múltipla escolha",
  };
  return labels[type as QuestionType] ?? type;
}

export function submissionStatusLabel(status: string) {
  const labels: Record<SubmissionStatus, string> = {
    pending: "Pendente",
    in_progress: "Em andamento",
    submitted: "Enviado",
    reviewed: "Corrigido",
  };
  return labels[status as SubmissionStatus] ?? status;
}
