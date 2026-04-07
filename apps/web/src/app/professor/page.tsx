"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { TeacherHomeSummary } from "@rema/contracts";
import { apiTeacherHomeSummary } from "@/lib/api";
import { getStoredToken } from "@/lib/cookies";

function formatDate(value: string | null) {
  if (!value) return "Sem data";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusLabel(value: string) {
  if (value === "published") return "Publicado";
  if (value === "draft") return "Rascunho";
  if (value === "archived") return "Arquivado";
  return value;
}

export default function ProfessorHomePage() {
  const [summary, setSummary] = useState<TeacherHomeSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    apiTeacherHomeSummary(token)
      .then(setSummary)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Falha ao carregar a home"),
      );
  }, []);

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div>
        <h1 style={{ marginTop: 0, color: "#0f172a" }}>Área do professor</h1>
        <p style={{ color: "#475569", lineHeight: 1.6 }}>
          Veja rapidamente os conteúdos mais recentes e o que ainda precisa de correção.
        </p>
      </div>

      {error ? (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 16,
            padding: 16,
            color: "#b91c1c",
          }}
        >
          {error}
        </div>
      ) : null}

      <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
        <section style={{ background: "#fff", border: "1px solid #dbe4f0", borderRadius: 18, padding: 20, display: "grid", gap: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
            <div>
              <h2 style={{ margin: 0 }}>Conteúdos recentes</h2>
              <p style={{ margin: "6px 0 0", color: "#64748b" }}>
                Últimos materiais criados ou publicados por você.
              </p>
            </div>
            <Link href="/professor/conteudos" style={{ color: "#2563eb", fontWeight: 600 }}>
              Ver conteúdos
            </Link>
          </div>

          {summary?.recentContents.length ? (
            summary.recentContents.map((content) => (
              <article
                key={content.id}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 14,
                  padding: 16,
                  display: "grid",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                  <strong style={{ color: "#0f172a" }}>{content.title}</strong>
                  <span style={{ color: "#64748b", fontSize: 14 }}>{statusLabel(content.status)}</span>
                </div>
                <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>{content.subtitle}</p>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ color: "#64748b", fontSize: 14 }}>
                    {formatDate(content.publishedAt || null)}
                  </span>
                  <Link href={`/professor/conteudos/${content.id}`} style={{ color: "#2563eb", fontWeight: 600 }}>
                    Abrir
                  </Link>
                </div>
              </article>
            ))
          ) : (
            <div style={{ border: "1px dashed #cbd5e1", borderRadius: 14, padding: 16, color: "#64748b" }}>
              Nenhum conteúdo recente encontrado.
            </div>
          )}
        </section>

        <section style={{ background: "#fff", border: "1px solid #dbe4f0", borderRadius: 18, padding: 20, display: "grid", gap: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
            <div>
              <h2 style={{ margin: 0 }}>Tarefas para corrigir</h2>
              <p style={{ margin: "6px 0 0", color: "#64748b" }}>
                Envios já submetidos aguardando sua revisão.
              </p>
            </div>
            <Link href="/professor/atividades" style={{ color: "#2563eb", fontWeight: 600 }}>
              Ver tarefas
            </Link>
          </div>

          {summary?.pendingReviews.length ? (
            summary.pendingReviews.map((review) => (
              <article
                key={review.submissionId}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 14,
                  padding: 16,
                  display: "grid",
                  gap: 8,
                }}
              >
                <strong style={{ color: "#0f172a" }}>{review.activityTitle}</strong>
                <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                  Aluno: {review.studentName}
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ color: "#64748b", fontSize: 14 }}>
                    Enviado em {formatDate(review.submittedAt)}
                  </span>
                  <Link
                    href={`/professor/atividades/${review.activityId}/envios/${review.submissionId}`}
                    style={{ color: "#2563eb", fontWeight: 600 }}
                  >
                    Corrigir agora
                  </Link>
                </div>
              </article>
            ))
          ) : (
            <div style={{ border: "1px dashed #cbd5e1", borderRadius: 14, padding: 16, color: "#64748b" }}>
              Nenhuma correção pendente no momento.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
