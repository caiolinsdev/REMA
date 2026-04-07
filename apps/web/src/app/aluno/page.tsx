"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { StudentHomeSummary, StudentHomeUpcomingItem } from "@rema/contracts";
import { apiStudentHomeSummary } from "@/lib/api";
import { getStoredToken } from "@/lib/cookies";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function truncateText(value: string, max = 120) {
  if (value.length <= max) return value;
  return `${value.slice(0, max).trimEnd()}...`;
}

function upcomingTypeLabel(item: StudentHomeUpcomingItem) {
  if (item.source === "personal_note") return "Nota";
  if (item.eventType === "other") return "Evento";
  return "Prazo";
}

export default function AlunoHomePage() {
  const [summary, setSummary] = useState<StudentHomeSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    apiStudentHomeSummary(token)
      .then(setSummary)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Falha ao carregar a home"),
      );
  }, []);

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div>
        <h1 style={{ marginTop: 0, color: "#0f172a" }}>Área do aluno</h1>
        <p style={{ color: "#475569", lineHeight: 1.6 }}>
          Acompanhe o que apareceu de novo na comunidade e os próximos compromissos da sua rotina.
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

      <div style={{ display: "grid", gap: 20, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        <section style={{ background: "#fff", border: "1px solid #dbe4f0", borderRadius: 18, padding: 20, display: "grid", gap: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
            <div>
              <h2 style={{ margin: 0 }}>Posts recentes</h2>
              <p style={{ margin: "6px 0 0", color: "#64748b" }}>
                Últimas publicações aprovadas para alunos.
              </p>
            </div>
            <Link href="/aluno/comunidade" style={{ color: "#2563eb", fontWeight: 600 }}>
              Ver comunidade
            </Link>
          </div>

          {summary?.recentPosts.length ? (
            summary.recentPosts.map((post) => (
              <article
                key={post.id}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 14,
                  padding: 16,
                  display: "grid",
                  gap: 8,
                }}
              >
                <h3 style={{ margin: 0, color: "#0f172a" }}>{post.title}</h3>
                <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                  {truncateText(post.body)}
                </p>
                <span style={{ color: "#64748b", fontSize: 14 }}>
                  Publicado em {formatDate(post.createdAt)}
                </span>
              </article>
            ))
          ) : (
            <div style={{ border: "1px dashed #cbd5e1", borderRadius: 14, padding: 16, color: "#64748b" }}>
              Nenhum post recente disponível.
            </div>
          )}
        </section>

        <section style={{ background: "#fff", border: "1px solid #dbe4f0", borderRadius: 18, padding: 20, display: "grid", gap: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
            <div>
              <h2 style={{ margin: 0 }}>Próximos compromissos</h2>
              <p style={{ margin: "6px 0 0", color: "#64748b" }}>
                Próximas entregas, eventos e anotações do seu calendário.
              </p>
            </div>
            <Link href="/aluno/calendario" style={{ color: "#2563eb", fontWeight: 600 }}>
              Abrir calendário
            </Link>
          </div>

          {summary?.upcomingItems.length ? (
            summary.upcomingItems.map((item) => (
              <article
                key={item.id}
                style={{
                  border: "1px solid #e2e8f0",
                  borderRadius: 14,
                  padding: 16,
                  display: "grid",
                  gap: 8,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                  <strong style={{ color: "#0f172a" }}>{item.title}</strong>
                  <span style={{ color: "#2563eb", fontWeight: 600 }}>{upcomingTypeLabel(item)}</span>
                </div>
                {item.description ? (
                  <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
                    {truncateText(item.description, 140)}
                  </p>
                ) : null}
                <span style={{ color: "#64748b", fontSize: 14 }}>
                  {formatDate(item.startAt)}
                </span>
              </article>
            ))
          ) : (
            <div style={{ border: "1px dashed #cbd5e1", borderRadius: 14, padding: 16, color: "#64748b" }}>
              Nenhum compromisso futuro encontrado.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
