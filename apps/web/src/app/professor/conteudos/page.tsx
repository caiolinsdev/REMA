"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { ContentSummary } from "@rema/contracts";
import { apiContents } from "@/lib/api";
import { getStoredToken } from "@/lib/cookies";

function formatPublished(value: string) {
  if (!value) return "Não publicado";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function Page() {
  const [contents, setContents] = useState<ContentSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    apiContents(token)
      .then(setContents)
      .catch((err) => setError(err instanceof Error ? err.message : "Falha ao carregar conteúdos"));
  }, []);

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ marginTop: 0 }}>Conteúdos</h1>
          <p style={{ color: "#64748b", lineHeight: 1.6 }}>
            Professores criam, editam e publicam materiais de apoio.
          </p>
        </div>
        <Link href="/professor/conteudos/novo" style={{ borderRadius: 10, background: "#2563eb", color: "#fff", textDecoration: "none", padding: "12px 16px", fontWeight: 600 }}>
          Novo conteúdo
        </Link>
      </div>

      {error ? <div style={{ color: "#b91c1c" }}>{error}</div> : null}

      <div style={{ display: "grid", gap: 16 }}>
        {contents.map((content) => (
          <article key={content.id} style={{ background: "#fff", border: "1px solid #dbe4f0", borderRadius: 16, padding: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div>
                <h2 style={{ margin: "0 0 8px" }}>{content.title}</h2>
                <p style={{ margin: 0, color: "#64748b" }}>
                  {content.subtitle} · {content.status} · {formatPublished(content.publishedAt)}
                </p>
              </div>
              <Link href={`/professor/conteudos/${content.id}`} style={{ color: "#2563eb", fontWeight: 600 }}>
                Abrir
              </Link>
            </div>
          </article>
        ))}
        {contents.length === 0 && !error ? (
          <div style={{ border: "1px dashed #cbd5e1", borderRadius: 16, padding: 18, color: "#64748b" }}>
            Nenhum conteúdo criado ainda.
          </div>
        ) : null}
      </div>
    </div>
  );
}
