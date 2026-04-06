"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import type { ActivityDetail, SubmissionDetail, UpsertSubmissionRequest } from "@rema/contracts";
import {
  apiActivityDetail,
  apiConfirmSubmission,
  apiCurrentSubmission,
  apiSaveSubmission,
} from "@/lib/api";
import { MediaImage } from "@/components/MediaImage";
import { getStoredToken } from "@/lib/cookies";

function formatDate(value: string | null) {
  if (!value) return "Sem prazo";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

const ALLOWED_WORK_FILE_TYPES = ["pdf", "doc", "docx", "txt"];

function getErrorStatus(error: unknown): number | undefined {
  return typeof error === "object" && error && "status" in error
    ? Number((error as { status?: number }).status)
    : undefined;
}

export default function Page() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [activity, setActivity] = useState<ActivityDetail | null>(null);
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, { answerText?: string; selectedOptionId?: string }>>({});
  const [workFile, setWorkFile] = useState<{ fileName: string; fileUrl: string; fileType: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.replace("/");
      return;
    }
    apiActivityDetail(token, params.id)
      .then(setActivity)
      .catch((err) => setError(err instanceof Error ? err.message : "Falha ao carregar atividade"));
    apiCurrentSubmission(token, params.id)
      .then(setSubmission)
      .catch((err) => {
        if (getErrorStatus(err) !== 404) {
          setError(err instanceof Error ? err.message : "Falha ao carregar envio");
        }
      });
  }, [params.id, router]);

  useEffect(() => {
    if (!submission) return;
    const nextAnswers: Record<string, { answerText?: string; selectedOptionId?: string }> = {};
    submission.answers?.forEach((answer) => {
      nextAnswers[answer.questionId] = {
        answerText: answer.answerText ?? "",
        selectedOptionId: answer.selectedOptionId ?? undefined,
      };
    });
    setAnswers(nextAnswers);
    setWorkFile(
      submission.files?.[0]
        ? {
            fileName: submission.files[0].fileName,
            fileUrl: submission.files[0].fileUrl,
            fileType: submission.files[0].fileType,
          }
        : null,
    );
  }, [submission]);

  const isLocked = submission?.status === "submitted" || submission?.status === "reviewed";
  const currentQuestion = activity?.questions?.[activeQuestionIndex] ?? null;

  const completionSummary = useMemo(() => {
    if (!activity || activity.kind === "trabalho") return null;
    const total = activity.questions?.length ?? 0;
    const answered = activity.questions?.filter((question) => {
      const draft = answers[question.id];
      return Boolean(draft?.answerText?.trim() || draft?.selectedOptionId);
    }).length ?? 0;
    return { total, answered };
  }, [activity, answers]);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      setWorkFile(null);
      return;
    }
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED_WORK_FILE_TYPES.includes(extension)) {
      setError("Use apenas pdf, doc, docx ou txt.");
      event.target.value = "";
      return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Falha ao ler arquivo"));
      reader.readAsDataURL(file);
    });
    setError(null);
    setWorkFile({
      fileName: file.name,
      fileUrl: dataUrl,
      fileType: extension,
    });
  }

  function buildSubmissionBody(): UpsertSubmissionRequest {
    if (!activity) return {};
    if (activity.kind === "trabalho") {
      return {
        files: workFile ? [workFile] : [],
      };
    }
    return {
      answers:
        activity.questions?.map((question) => ({
          questionId: question.id,
          answerText: answers[question.id]?.answerText ?? "",
          selectedOptionId: answers[question.id]?.selectedOptionId ?? null,
        })) ?? [],
    };
  }

  async function saveDraft() {
    const token = getStoredToken();
    if (!token || !activity) {
      router.replace("/");
      return null;
    }
    setSaving(true);
    setError(null);
    try {
      const nextSubmission = await apiSaveSubmission(token, activity.id, buildSubmissionBody());
      setSubmission(nextSubmission);
      return nextSubmission;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar envio");
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function confirmSubmission() {
    if (!activity) return;
    const token = getStoredToken();
    if (!token) {
      router.replace("/");
      return;
    }
    const accepted = window.confirm(
      "Depois de confirmar o envio, nao sera possivel editar ou reenviar. Deseja continuar?",
    );
    if (!accepted) return;

    setConfirming(true);
    setError(null);
    try {
      const ensuredSubmission = submission ?? (await saveDraft());
      if (!ensuredSubmission) return;
      const confirmed = await apiConfirmSubmission(token, ensuredSubmission.id);
      setSubmission(confirmed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao confirmar envio");
    } finally {
      setConfirming(false);
    }
  }

  if (!activity) {
    return <p style={{ color: "#64748b" }}>{error ?? "Carregando atividade…"}</p>;
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div>
        <h1 style={{ marginTop: 0 }}>{activity.title}</h1>
        <p style={{ color: "#64748b", lineHeight: 1.6 }}>
          {activity.kind} · {activity.status} · prazo {formatDate(activity.dueAt)} · pontuacao total {activity.totalScore}
        </p>
      </div>

      {submission ? (
        <section style={{ background: "#fff", border: "1px solid #dbe4f0", borderRadius: 16, padding: 20 }}>
          <h2 style={{ marginTop: 0 }}>Meu envio</h2>
          <p style={{ color: "#475569" }}>
            Status: <strong>{submission.status}</strong>
            {submission.submittedAt ? <> · enviado em {formatDate(submission.submittedAt)}</> : null}
            {typeof submission.score === "number" ? <> · nota {submission.score}</> : null}
          </p>
          {submission.feedback ? (
            <p style={{ marginBottom: 0, color: "#334155", lineHeight: 1.7 }}>
              <strong>Retorno do professor:</strong> {submission.feedback}
            </p>
          ) : submission.status === "submitted" ? (
            <p style={{ marginBottom: 0, color: "#64748b" }}>
              Seu envio foi confirmado e aguarda correcao do professor.
            </p>
          ) : null}
        </section>
      ) : null}

      {error ? (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 16, padding: 16, color: "#b91c1c" }}>
          {error}
        </div>
      ) : null}

      <section style={{ background: "#fff", border: "1px solid #dbe4f0", borderRadius: 16, padding: 20 }}>
        <h2 style={{ marginTop: 0 }}>Descricao</h2>
        <p style={{ marginBottom: 0, color: "#334155", lineHeight: 1.7 }}>
          {activity.description || "Sem descricao."}
        </p>
      </section>

      {activity.kind !== "trabalho" ? (
        <section style={{ display: "grid", gap: 16 }}>
          <div style={{ background: "#fff", border: "1px solid #dbe4f0", borderRadius: 16, padding: 20 }}>
            <h2 style={{ marginTop: 0 }}>Resolucao</h2>
            <p style={{ color: "#64748b", marginBottom: 0 }}>
              Navegue entre as questoes, salve em andamento e confirme quando tiver certeza.
              {completionSummary ? ` Respondidas: ${completionSummary.answered}/${completionSummary.total}.` : ""}
            </p>
          </div>

          {currentQuestion ? (
            <article style={{ background: "#fff", border: "1px solid #dbe4f0", borderRadius: 16, padding: 20 }}>
              <h3 style={{ marginTop: 0 }}>Questao {currentQuestion.position}</h3>
              <p style={{ color: "#334155", lineHeight: 1.7 }}>{currentQuestion.statement}</p>
              <p style={{ color: "#64748b" }}>
                {currentQuestion.type} · peso {currentQuestion.weight}
              </p>
              {currentQuestion.supportImageUrl ? (
                <MediaImage
                  src={currentQuestion.supportImageUrl}
                  alt={`Imagem de apoio da questao ${currentQuestion.position}`}
                  style={{ width: "100%", maxWidth: 320, borderRadius: 12, border: "1px solid #dbe4f0" }}
                />
              ) : null}

              {currentQuestion.type === "multipla_escolha" ? (
                <div style={{ display: "grid", gap: 10 }}>
                  {currentQuestion.options?.map((option) => (
                    <label key={option.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: 10, border: "1px solid #e2e8f0", borderRadius: 10 }}>
                      <input
                        type="radio"
                        name={`question-${currentQuestion.id}`}
                        value={option.id}
                        disabled={isLocked}
                        checked={answers[currentQuestion.id]?.selectedOptionId === option.id}
                        onChange={() =>
                          setAnswers((current) => ({
                            ...current,
                            [currentQuestion.id]: {
                              ...current[currentQuestion.id],
                              selectedOptionId: option.id,
                              answerText: "",
                            },
                          }))
                        }
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <textarea
                  rows={6}
                  disabled={isLocked}
                  value={answers[currentQuestion.id]?.answerText ?? ""}
                  onChange={(event) =>
                    setAnswers((current) => ({
                      ...current,
                      [currentQuestion.id]: {
                        ...current[currentQuestion.id],
                        answerText: event.target.value,
                        selectedOptionId: undefined,
                      },
                    }))
                  }
                  style={{ width: "100%", padding: 12, borderRadius: 12, border: "1px solid #cbd5e1", resize: "vertical" }}
                />
              )}

              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
                <button
                  type="button"
                  disabled={activeQuestionIndex === 0}
                  onClick={() => setActiveQuestionIndex((current) => Math.max(0, current - 1))}
                  style={{ borderRadius: 10, border: "1px solid #cbd5e1", padding: "10px 14px", background: "#fff", cursor: "pointer" }}
                >
                  Questao anterior
                </button>
                <button
                  type="button"
                  disabled={activeQuestionIndex >= (activity.questions?.length ?? 1) - 1}
                  onClick={() =>
                    setActiveQuestionIndex((current) =>
                      Math.min((activity.questions?.length ?? 1) - 1, current + 1),
                    )
                  }
                  style={{ borderRadius: 10, border: "1px solid #cbd5e1", padding: "10px 14px", background: "#fff", cursor: "pointer" }}
                >
                  Proxima questao
                </button>
              </div>
            </article>
          ) : null}

          {!isLocked ? (
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => void saveDraft()}
                disabled={saving || confirming}
                style={{ borderRadius: 10, border: "1px solid #cbd5e1", padding: "12px 16px", background: "#fff", cursor: "pointer" }}
              >
                {saving ? "Salvando…" : "Salvar em andamento"}
              </button>
              <button
                type="button"
                onClick={() => void confirmSubmission()}
                disabled={saving || confirming}
                style={{ borderRadius: 10, border: "none", padding: "12px 16px", background: "#2563eb", color: "#fff", cursor: "pointer", fontWeight: 600 }}
              >
                {confirming ? "Confirmando…" : "Confirmar envio unico"}
              </button>
            </div>
          ) : null}
        </section>
      ) : (
        <section style={{ background: "#fff", border: "1px solid #dbe4f0", borderRadius: 16, padding: 20, display: "grid", gap: 16 }}>
          <h2 style={{ marginTop: 0 }}>Entrega tipo trabalho</h2>
          <p style={{ marginBottom: 0, color: "#64748b" }}>
            Anexe um unico arquivo em `pdf`, `doc`, `docx` ou `txt`, salve e confirme o envio final.
          </p>

          {workFile ? (
            <div style={{ padding: 12, borderRadius: 12, background: "#f8fafc", border: "1px solid #e2e8f0" }}>
              <strong>Arquivo atual:</strong> {workFile.fileName} ({workFile.fileType})
            </div>
          ) : null}

          {!isLocked ? (
            <>
              <input type="file" accept=".pdf,.doc,.docx,.txt" onChange={(event) => void handleFileChange(event)} />
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => void saveDraft()}
                  disabled={saving || confirming}
                  style={{ borderRadius: 10, border: "1px solid #cbd5e1", padding: "12px 16px", background: "#fff", cursor: "pointer" }}
                >
                  {saving ? "Salvando…" : "Salvar anexo"}
                </button>
                <button
                  type="button"
                  onClick={() => void confirmSubmission()}
                  disabled={saving || confirming}
                  style={{ borderRadius: 10, border: "none", padding: "12px 16px", background: "#2563eb", color: "#fff", cursor: "pointer", fontWeight: 600 }}
                >
                  {confirming ? "Confirmando…" : "Confirmar envio unico"}
                </button>
              </div>
            </>
          ) : workFile ? (
            <a href={workFile.fileUrl} download={workFile.fileName} style={{ color: "#2563eb", fontWeight: 600 }}>
              Abrir anexo enviado
            </a>
          ) : null}
        </section>
      )}
    </div>
  );
}
