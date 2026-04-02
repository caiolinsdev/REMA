"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { ContentDetail } from "@rema/contracts";
import { apiContentDetail } from "@/lib/api";
import { getStoredToken } from "@/lib/cookies";

export default function Page() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [content, setContent] = useState<ContentDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    apiContentDetail(token, params.id)
      .then(setContent)
      .catch((err) => setError(err instanceof Error ? err.message : "Falha ao carregar conteudo"));
  }, [params.id, router]);

  if (!content) {
    return <p style={{ color: "#64748b" }}>{error ?? "Carregando conteudo…"}</p>;
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div>
        <h1 style={{ marginTop: 0 }}>{content.title}</h1>
        <p style={{ color: "#64748b" }}>{content.subtitle}</p>
      </div>
      <section style={{ background: "#fff", border: "1px solid #dbe4f0", borderRadius: 16, padding: 20, display: "grid", gap: 16 }}>
        <p style={{ margin: 0, color: "#334155", lineHeight: 1.7 }}>{content.description}</p>
        {content.imageUrl ? (
          <p style={{ margin: 0 }}>
            Imagem: <a href={content.imageUrl} target="_blank" rel="noreferrer">abrir</a>
          </p>
        ) : null}
        {content.videoUrl ? (
          <p style={{ margin: 0 }}>
            Video: <a href={content.videoUrl} target="_blank" rel="noreferrer">abrir</a>
          </p>
        ) : null}
      </section>
    </div>
  );
}
