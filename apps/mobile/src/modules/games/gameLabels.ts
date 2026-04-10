import type { GameRuntimeResponse, GameSummary } from "@rema/contracts";

export function experienceLabel(type: GameSummary["experienceType"]): string {
  return {
    quiz: "Quiz",
    memoria: "Memória",
    sequencia: "Sequência",
    palavras: "Palavras",
    logica: "Lógica",
  }[type];
}

export function sourceStrategyLabel(value: GameSummary["sourceStrategy"]): string {
  return {
    remote_api: "API externa",
    local_engine: "Local no REMA",
    hybrid: "Híbrido",
  }[value];
}

export function contentSourceLabel(value: GameRuntimeResponse["contentSource"]): string {
  return {
    remote_api: "Conteúdo remoto",
    local_fallback: "Fallback local",
    local_engine: "Engine local",
  }[value];
}
