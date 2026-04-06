"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { ActivityDetail, SubmissionListItem } from "@rema/contracts";
import { apiActivityDetail, apiActivitySubmissions, apiPublishActivity } from "@/lib/api";
import { MediaImage } from "@/components/MediaImage";
import { getStoredToken } from "@/lib/cookies";

function formatDate(value: string | null) {
  if (!value) return "Sem prazo";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function Page({
}: Record<string, never>) {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [activity, setActivity] = useState<ActivityDetail | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const activityId = params.id;

  useEffect(() => {
    if (!activityId) return;
    const token = getStoredToken();
    if (!token) {
      router.replace("/");
      return;
    }
    apiActivityDetail(token, activityId)
      .then(setActivity)
      .catch((err) => setError(err instanceof Error ? err.message : "Falha ao carregar atividade"));
    apiActivitySubmissions(token, activityId)
      .then(setSubmissions)
      .catch(() => {});
  }, [activityId, router]);

  async function handlePublish() {
    if (!activityId) return;
    const token = getStoredToken();
    if (!token) {
      router.replace("/");
      return;
    }
    setPublishing(true);
    setError(null);
    try {
      const updated = await apiPublishActivity(token, activityId);
      setActivity(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao publicar atividade");
    } finally {
      setPublishing(false);
    }
  }

  if (!activity) {
    return <p style={{ color: "#64748b" }}>{error ?? "Carregando atividade…"}</p>;
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ marginTop: 0 }}>{activity.title}</h1>
          <p style={{ margin: "8px 0 0", color: "#64748b" }}>
            {activity.kind} · {activity.status} · prazo {formatDate(activity.dueAt)} · total {activity.totalScore}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {activity.status === "draft" ? (
            <Link
              href={`/professor/atividades/${activity.id}/editar`}
              style={{ borderRadius: 10, border: "1px solid #cbd5e1", padding: "12px 16px", textDecoration: "none", color: "#0f172a" }}
            >
              Editar
            </Link>
          ) : null}
          {activity.status === "draft" ? (
            <button
              type="button"
              onClick={handlePublish}
              disabled={publishing}
              style={{ borderRadius: 10, border: "none", padding: "12px 16px", background: "#2563eb", color: "#fff", cursor: "pointer", fontWeight: 600 }}
            >
              {publishing ? "Publicando…" : "Publicar"}
            </button>
          ) : null}
        </div>
      </div>

      {error ? <div style={{ color: "#b91c1c" }}>{error}</div> : null}

      <section style={{ background: "#fff", border: "1px solid #dbe4f0", borderRadius: 16, padding: 20 }}>
        <h2 style={{ marginTop: 0 }}>Descricao</h2>
        <p style={{ marginBottom: 0, color: "#334155", lineHeight: 1.7 }}>
          {activity.description || "Sem descricao."}
        </p>
      </section>

      <section style={{ background: "#fff", border: "1px solid #dbe4f0", borderRadius: 16, padding: 20 }}>
        <h2 style={{ marginTop: 0 }}>Validacao</h2>
        {activity.validation?.issues.length ? (
          <ul style={{ marginBottom: 0 }}>
            {activity.validation.issues.map((issue) => (
              <li key={`${issue.code}-${issue.message}`}>{issue.message}</li>
            ))}
          </ul>
        ) : (
          <p style={{ marginBottom: 0, color: "#166534" }}>Pronto para publicar.</p>
        )}
      </section>

      {activity.kind !== "trabalho" ? (
        <section style={{ display: "grid", gap: 16 }}>
          {activity.questions?.map((question) => (
            <article key={question.id} style={{ background: "#fff", border: "1px solid #dbe4f0", borderRadius: 16, padding: 20 }}>
              <h3 style={{ marginTop: 0 }}>Questao {question.position}</h3>
              <p style={{ color: "#334155", lineHeight: 1.7 }}>{question.statement}</p>
              <p style={{ color: "#64748b" }}>
                {question.type} · peso {question.weight}
              </p>
              {question.supportImageUrl ? (
                <MediaImage
                  src={question.supportImageUrl}
                  alt={`Imagem de apoio da questao ${question.position}`}
                  style={{ width: "100%", maxWidth: 320, borderRadius: 12, border: "1px solid #dbe4f0" }}
                />
              ) : null}
              {question.options?.length ? (
                <ul>
                  {question.options.map((option) => (
                    <li key={option.id}>
                      {option.label} {option.isCorrect ? "(correta)" : ""}
                    </li>
                  ))}
                </ul>
              ) : null}
              <p style={{ marginBottom: 0, color: "#475569" }}>
                <strong>Gabarito esperado:</strong> {question.expectedAnswer || "Nao informado."}
              </p>
            </article>
          ))}
          {activity.questions?.length === 0 ? (
            <div style={{ background: "#fff", border: "1px dashed #cbd5e1", borderRadius: 16, padding: 20, color: "#64748b" }}>
              Nenhuma questao cadastrada ainda.
            </div>
          ) : null}
        </section>
      ) : (
        <section style={{ background: "#fff", border: "1px solid #dbe4f0", borderRadius: 16, padding: 20 }}>
          <h2 style={{ marginTop: 0 }}>Entrega tipo trabalho</h2>
          <p style={{ marginBottom: 0, color: "#64748b" }}>
            Este item usa descricao e prazo, sem estrutura de questoes nesta fase.
          </p>
        </section>
      )}

      {activity.status !== "draft" ? (
        <section style={{ background: "#fff", border: "1px solid #dbe4f0", borderRadius: 16, padding: 20 }}>
          <h2 style={{ marginTop: 0 }}>Envios dos alunos</h2>
          <div style={{ display: "grid", gap: 12 }}>
            {submissions.map((submission) => (
              <article key={submission.id} style={{ border: "1px solid #e2e8f0", borderRadius: 12, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                  <div>
                    <strong>{submission.studentName}</strong>
                    <p style={{ margin: "6px 0 0", color: "#64748b" }}>
                      {submission.status}
                      {submission.submittedAt ? ` · enviado em ${formatDate(submission.submittedAt)}` : ""}
                      {typeof submission.score === "number" ? ` · nota ${submission.score}` : ""}
                    </p>
                  </div>
                  <Link href={`/professor/atividades/${activity.id}/envios/${submission.id}`} style={{ color: "#2563eb", fontWeight: 600 }}>
                    Abrir envio
                  </Link>
                </div>
              </article>
            ))}
            {submissions.length === 0 ? (
              <p style={{ marginBottom: 0, color: "#64748b" }}>
                Nenhum envio recebido ainda.
              </p>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
