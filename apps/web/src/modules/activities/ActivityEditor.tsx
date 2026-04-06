"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import type { ActivityDetail, QuestionInput, UpsertActivityRequest } from "@rema/contracts";
import {
  apiActivityDetail,
  apiCreateActivity,
  apiUpdateActivity,
  apiUploadMedia,
} from "@/lib/api";
import { MediaImage } from "@/components/MediaImage";
import { getStoredToken } from "@/lib/cookies";

type Props = {
  mode: "create" | "edit";
  activityId?: number;
};

type FormQuestion = QuestionInput & { options: NonNullable<QuestionInput["options"]> };

const panelStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #dbe4f0",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
};

function emptyQuestion(position: number): FormQuestion {
  return {
    statement: "",
    type: "dissertativa",
    weight: 0,
    position,
    supportImageUrl: "",
    expectedAnswer: "",
    options: [],
  };
}

function isoToInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function inputToIso(value: string) {
  if (!value) return null;
  return new Date(value).toISOString();
}

function toFormQuestions(activity?: ActivityDetail): FormQuestion[] {
  return (
    activity?.questions?.map((question) => ({
      statement: question.statement,
      type: question.type,
      weight: question.weight,
      position: question.position,
      supportImageUrl: question.supportImageUrl ?? "",
      expectedAnswer: question.expectedAnswer ?? "",
      options:
        question.options?.map((option) => ({
          label: option.label,
          position: option.position,
          isCorrect: option.isCorrect ?? false,
        })) ?? [],
    })) ?? []
  );
}

export function ActivityEditor({ mode, activityId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState<"prova" | "atividade" | "trabalho">("prova");
  const [dueAt, setDueAt] = useState("");
  const [questions, setQuestions] = useState<FormQuestion[]>([emptyQuestion(1)]);
  const [validationMessages, setValidationMessages] = useState<string[]>([]);

  useEffect(() => {
    if (mode !== "edit" || !activityId) return;
    const token = getStoredToken();
    if (!token) {
      router.replace("/");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const activity = await apiActivityDetail(token, activityId);
        if (cancelled) return;
        setTitle(activity.title);
        setDescription(activity.description);
        setKind(activity.kind);
        setDueAt(isoToInput(activity.dueAt));
        setQuestions(
          activity.kind === "trabalho"
            ? []
            : toFormQuestions(activity).length > 0
              ? toFormQuestions(activity)
              : [emptyQuestion(1)],
        );
        setValidationMessages(activity.validation?.issues.map((issue) => issue.message) ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Falha ao carregar atividade");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activityId, mode, router]);

  const effectiveQuestions = useMemo(
    () => (kind === "trabalho" ? [] : questions.map((question, index) => ({ ...question, position: index + 1 }))),
    [kind, questions],
  );

  function updateQuestion(index: number, patch: Partial<FormQuestion>) {
    setQuestions((current) => current.map((question, currentIndex) => (currentIndex === index ? { ...question, ...patch } : question)));
  }

  function removeQuestion(index: number) {
    setQuestions((current) => current.filter((_, currentIndex) => currentIndex !== index).map((question, currentIndex) => ({ ...question, position: currentIndex + 1 })));
  }

  async function uploadSupportImage(
    event: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) {
    const file = event.target.files?.[0];
    const token = getStoredToken();
    if (!file || !token) return;
    setError(null);
    try {
      const uploaded = await apiUploadMedia(token, file, "activity_support_image");
      updateQuestion(index, { supportImageUrl: uploaded.url });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao enviar imagem de apoio");
    } finally {
      event.target.value = "";
    }
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const token = getStoredToken();
    if (!token) {
      router.replace("/");
      return;
    }

    const body: UpsertActivityRequest = {
      title,
      description,
      kind,
      dueAt: inputToIso(dueAt),
      totalScore: 100,
      questions: effectiveQuestions,
    };

    setSaving(true);
    setError(null);
    try {
      const activity =
        mode === "create"
          ? await apiCreateActivity(token, body)
          : await apiUpdateActivity(token, activityId!, body);
      setValidationMessages(activity.validation?.issues.map((issue) => issue.message) ?? []);
      router.push(`/professor/atividades/${activity.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar atividade");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p style={{ color: "#64748b" }}>Carregando atividade…</p>;
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div>
        <h1 style={{ marginTop: 0 }}>Professor: {mode === "create" ? "nova atividade" : "editar atividade"}</h1>
        <p style={{ color: "#64748b", lineHeight: 1.6 }}>
          O item nasce em <code>draft</code>. A publicacao so acontece depois das validacoes de pontuacao.
        </p>
      </div>

      {error ? (
        <div style={{ ...panelStyle, borderColor: "#fecaca", color: "#b91c1c" }}>{error}</div>
      ) : null}

      {validationMessages.length > 0 ? (
        <div style={{ ...panelStyle, borderColor: "#fde68a", background: "#fffbeb" }}>
          <strong>Resumo de validacao</strong>
          <ul style={{ marginBottom: 0 }}>
            {validationMessages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 20 }}>
        <section style={panelStyle}>
          <div style={{ display: "grid", gap: 14 }}>
            <label style={{ display: "grid", gap: 6 }}>
              <span>Titulo</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} required style={{ padding: 10, borderRadius: 10, border: "1px solid #cbd5e1" }} />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span>Tipo</span>
              <select
                value={kind}
                onChange={(event) => {
                  const nextKind = event.target.value as "prova" | "atividade" | "trabalho";
                  setKind(nextKind);
                  if (nextKind === "trabalho") {
                    setQuestions([]);
                  } else if (questions.length === 0) {
                    setQuestions([emptyQuestion(1)]);
                  }
                }}
                style={{ padding: 10, borderRadius: 10, border: "1px solid #cbd5e1" }}
              >
                <option value="prova">Prova</option>
                <option value="atividade">Atividade</option>
                <option value="trabalho">Trabalho</option>
              </select>
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span>Prazo</span>
              <input
                type="datetime-local"
                value={dueAt}
                onChange={(event) => setDueAt(event.target.value)}
                style={{ padding: 10, borderRadius: 10, border: "1px solid #cbd5e1" }}
              />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span>Descricao</span>
              <textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={5}
                style={{ padding: 10, borderRadius: 10, border: "1px solid #cbd5e1", resize: "vertical" }}
              />
            </label>
            <label style={{ display: "grid", gap: 6 }}>
              <span>Pontuacao total</span>
              <input value="100" disabled style={{ padding: 10, borderRadius: 10, border: "1px solid #cbd5e1", background: "#f8fafc" }} />
            </label>
          </div>
        </section>

        {kind !== "trabalho" ? (
          <section style={panelStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 16 }}>
              <div>
                <h2 style={{ margin: 0 }}>Questoes</h2>
                <p style={{ margin: "6px 0 0", color: "#64748b" }}>A soma dos pesos deve fechar em 100 para publicar.</p>
              </div>
              <button
                type="button"
                onClick={() => setQuestions((current) => [...current, emptyQuestion(current.length + 1)])}
                style={{ borderRadius: 10, border: "1px solid #cbd5e1", padding: "10px 14px", background: "#fff", cursor: "pointer" }}
              >
                Adicionar questao
              </button>
            </div>

            <div style={{ display: "grid", gap: 16 }}>
              {questions.map((question, index) => (
                <article key={`${question.position}-${index}`} style={{ border: "1px solid #e2e8f0", borderRadius: 14, padding: 16, display: "grid", gap: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong>Questao {index + 1}</strong>
                    <button type="button" onClick={() => removeQuestion(index)} style={{ border: "none", background: "transparent", color: "#b91c1c", cursor: "pointer" }}>
                      Remover
                    </button>
                  </div>

                  <label style={{ display: "grid", gap: 6 }}>
                    <span>Enunciado</span>
                    <textarea
                      value={question.statement}
                      onChange={(event) => updateQuestion(index, { statement: event.target.value })}
                      rows={3}
                      style={{ padding: 10, borderRadius: 10, border: "1px solid #cbd5e1", resize: "vertical" }}
                    />
                  </label>

                  <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                    <label style={{ display: "grid", gap: 6 }}>
                      <span>Tipo</span>
                      <select
                        value={question.type}
                        onChange={(event) =>
                          updateQuestion(index, {
                            type: event.target.value as FormQuestion["type"],
                            options:
                              event.target.value === "multipla_escolha"
                                ? question.options.length > 0
                                  ? question.options
                                  : [
                                      { label: "", position: 1, isCorrect: false },
                                      { label: "", position: 2, isCorrect: false },
                                    ]
                                : [],
                          })
                        }
                        style={{ padding: 10, borderRadius: 10, border: "1px solid #cbd5e1" }}
                      >
                        <option value="dissertativa">Dissertativa</option>
                        <option value="multipla_escolha">Multipla escolha</option>
                      </select>
                    </label>
                    <label style={{ display: "grid", gap: 6 }}>
                      <span>Peso</span>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={question.weight}
                        onChange={(event) => updateQuestion(index, { weight: Number(event.target.value) })}
                        style={{ padding: 10, borderRadius: 10, border: "1px solid #cbd5e1" }}
                      />
                    </label>
                    <div style={{ display: "grid", gap: 6 }}>
                      <span>Imagem de apoio</span>
                      {question.supportImageUrl ? (
                        <MediaImage
                          src={question.supportImageUrl}
                          alt={`Imagem de apoio da questao ${index + 1}`}
                          style={{ width: "100%", maxWidth: 180, borderRadius: 12, border: "1px solid #cbd5e1" }}
                        />
                      ) : null}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={(event) => void uploadSupportImage(event, index)}
                      />
                      <button
                        type="button"
                        onClick={() => updateQuestion(index, { supportImageUrl: "" })}
                        style={{ width: "fit-content", borderRadius: 10, border: "1px solid #cbd5e1", padding: "10px 14px", background: "#fff", cursor: "pointer" }}
                      >
                        Remover imagem
                      </button>
                    </div>
                  </div>

                  <label style={{ display: "grid", gap: 6 }}>
                    <span>Resposta esperada / gabarito</span>
                    <textarea
                      value={question.expectedAnswer ?? ""}
                      onChange={(event) => updateQuestion(index, { expectedAnswer: event.target.value })}
                      rows={2}
                      style={{ padding: 10, borderRadius: 10, border: "1px solid #cbd5e1", resize: "vertical" }}
                    />
                  </label>

                  {question.type === "multipla_escolha" ? (
                    <div style={{ display: "grid", gap: 10 }}>
                      <strong>Opcoes</strong>
                      {question.options.map((option, optionIndex) => (
                        <div key={`${option.position}-${optionIndex}`} style={{ display: "grid", gap: 10, gridTemplateColumns: "1fr auto auto" }}>
                          <input
                            value={option.label}
                            onChange={(event) => {
                              const nextOptions = question.options.map((currentOption, currentIndex) =>
                                currentIndex === optionIndex
                                  ? { ...currentOption, label: event.target.value }
                                  : currentOption,
                              );
                              updateQuestion(index, { options: nextOptions });
                            }}
                            placeholder={`Opcao ${optionIndex + 1}`}
                            style={{ padding: 10, borderRadius: 10, border: "1px solid #cbd5e1" }}
                          />
                          <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <input
                              type="checkbox"
                              checked={option.isCorrect ?? false}
                              onChange={(event) => {
                                const nextOptions = question.options.map((currentOption, currentIndex) =>
                                  currentIndex === optionIndex
                                    ? { ...currentOption, isCorrect: event.target.checked }
                                    : currentOption,
                                );
                                updateQuestion(index, { options: nextOptions });
                              }}
                            />
                            Correta
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const nextOptions = question.options
                                .filter((_, currentIndex) => currentIndex !== optionIndex)
                                .map((currentOption, currentIndex) => ({ ...currentOption, position: currentIndex + 1 }));
                              updateQuestion(index, { options: nextOptions });
                            }}
                            style={{ border: "none", background: "transparent", color: "#b91c1c", cursor: "pointer" }}
                          >
                            Remover
                          </button>
                        </div>
                      ))}

                      <button
                        type="button"
                        disabled={question.options.length >= 5}
                        onClick={() =>
                          updateQuestion(index, {
                            options: [
                              ...question.options,
                              { label: "", position: question.options.length + 1, isCorrect: false },
                            ],
                          })
                        }
                        style={{ width: "fit-content", borderRadius: 10, border: "1px solid #cbd5e1", padding: "10px 14px", background: "#fff", cursor: "pointer" }}
                      >
                        Adicionar opcao
                      </button>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        ) : (
          <section style={panelStyle}>
            <h2 style={{ marginTop: 0 }}>Trabalho sem questoes</h2>
            <p style={{ color: "#64748b", lineHeight: 1.6, marginBottom: 0 }}>
              Nesta primeira versao, trabalhos usam descricao e prazo, sem editor de questoes.
            </p>
          </section>
        )}

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button
            type="submit"
            disabled={saving}
            style={{ borderRadius: 10, border: "none", padding: "12px 16px", background: "#2563eb", color: "#fff", cursor: "pointer", fontWeight: 600 }}
          >
            {saving ? "Salvando…" : mode === "create" ? "Criar draft" : "Salvar alteracoes"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            style={{ borderRadius: 10, border: "1px solid #cbd5e1", padding: "12px 16px", background: "#fff", cursor: "pointer" }}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
