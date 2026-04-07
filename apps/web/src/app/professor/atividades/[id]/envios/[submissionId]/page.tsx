"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { SubmissionDetail } from "@rema/contracts";
import { apiReviewSubmission, apiSubmissionDetail } from "@/lib/api";
import { getStoredToken } from "@/lib/cookies";
import { submissionStatusLabel } from "@/modules/activities/ui";

function formatDate(value: string | null) {
  if (!value) return "Sem data";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function Page() {
  const params = useParams<{ id: string; submissionId: string }>();
  const router = useRouter();
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [score, setScore] = useState("0");
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.replace("/");
      return;
    }
    apiSubmissionDetail(token, params.submissionId)
      .then((payload) => {
        setSubmission(payload);
        setScore(String(payload.score ?? 0));
        setComment(payload.feedback ?? "");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Falha ao carregar envio"));
  }, [params.submissionId, router]);

  async function handleReview(event: React.FormEvent) {
    event.preventDefault();
    const token = getStoredToken();
    if (!token) {
      router.replace("/");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const reviewed = await apiReviewSubmission(token, params.submissionId, {
        score: Number(score),
        comment,
      });
      setSubmission(reviewed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao registrar correção");
    } finally {
      setSaving(false);
    }
  }

  if (!submission) {
    return <p style={{ color: "#64748b" }}>{error ?? "Carregando envio..."}</p>;
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div>
          <h1 style={{ marginTop: 0 }}>Envio #{submission.id}</h1>
          <p style={{ color: "#64748b", lineHeight: 1.6 }}>
            Status {submissionStatusLabel(submission.status)}
            {submission.submittedAt ? ` · enviado em ${formatDate(submission.submittedAt)}` : ""}
            {typeof submission.score === "number" ? ` · nota ${submission.score}` : ""}
          </p>
        </div>
        <Link href={`/professor/atividades/${params.id}`} style={{ color: "#2563eb", fontWeight: 600 }}>
          Voltar para atividade
        </Link>
      </div>

      {error ? (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 16, padding: 16, color: "#b91c1c" }}>
          {error}
        </div>
      ) : null}

      {submission.answers?.length ? (
        <section style={{ display: "grid", gap: 16 }}>
          {submission.answers.map((answer) => (
            <article key={answer.questionId} style={{ background: "#fff", border: "1px solid #dbe4f0", borderRadius: 16, padding: 20 }}>
              <h2 style={{ marginTop: 0 }}>Resposta da questão {answer.questionId}</h2>
              <p style={{ marginBottom: 0, color: "#334155", lineHeight: 1.7 }}>
                {answer.answerText || `Opção selecionada: ${answer.selectedOptionId ?? "não informada"}`}
              </p>
            </article>
          ))}
        </section>
      ) : null}

      {submission.files?.length ? (
        <section style={{ background: "#fff", border: "1px solid #dbe4f0", borderRadius: 16, padding: 20 }}>
          <h2 style={{ marginTop: 0 }}>Anexo da tarefa</h2>
          {submission.files.map((file) => (
            <p key={file.id} style={{ marginBottom: 0 }}>
              <a href={file.fileUrl} download={file.fileName}>
                {file.fileName}
              </a>{" "}
              ({file.fileType})
            </p>
          ))}
        </section>
      ) : null}

      <form onSubmit={handleReview} style={{ background: "#fff", border: "1px solid #dbe4f0", borderRadius: 16, padding: 20, display: "grid", gap: 16 }}>
        <h2 style={{ margin: 0 }}>Correção</h2>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Nota</span>
          <input
            type="number"
            min={0}
            max={100}
            value={score}
            onChange={(event) => setScore(event.target.value)}
            style={{ padding: 10, borderRadius: 10, border: "1px solid #cbd5e1" }}
          />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Comentário</span>
          <textarea
            rows={5}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            style={{ padding: 10, borderRadius: 10, border: "1px solid #cbd5e1", resize: "vertical" }}
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          style={{ width: "fit-content", borderRadius: 10, border: "none", padding: "12px 16px", background: "#2563eb", color: "#fff", cursor: "pointer", fontWeight: 600 }}
        >
          {saving ? "Salvando..." : "Registrar correção"}
        </button>
      </form>
    </div>
  );
}
