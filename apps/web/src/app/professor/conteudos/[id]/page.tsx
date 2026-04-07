"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { ContentDetail } from "@rema/contracts";
import { apiContentDetail, apiDeleteContent, apiUpdateContent } from "@/lib/api";
import { MediaImage } from "@/components/MediaImage";
import { getStoredToken } from "@/lib/cookies";

function formatPublished(value: string) {
  if (!value) return "Não publicado";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function Page() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [content, setContent] = useState<ContentDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      router.replace("/");
      return;
    }
    apiContentDetail(token, params.id)
      .then(setContent)
      .catch((err) => setError(err instanceof Error ? err.message : "Falha ao carregar conteúdo"));
  }, [params.id, router]);

  async function updateStatus(status: "published" | "draft" | "archived") {
    const token = getStoredToken();
    if (!token || !content) return;
    setLoadingAction(true);
    setError(null);
    try {
      setContent(await apiUpdateContent(token, content.id, { status }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao atualizar conteúdo");
    } finally {
      setLoadingAction(false);
    }
  }

  async function handleDelete() {
    const token = getStoredToken();
    if (!token || !content) return;
    if (!window.confirm("Deseja excluir este conteúdo?")) return;
    setLoadingAction(true);
    try {
      await apiDeleteContent(token, content.id);
      router.push("/professor/conteudos");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao excluir conteúdo");
      setLoadingAction(false);
    }
  }

  if (!content) {
    return <p style={{ color: "#64748b" }}>{error ?? "Carregando conteúdo..."}</p>;
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ marginTop: 0 }}>{content.title}</h1>
          <p style={{ color: "#64748b" }}>
            {content.subtitle} · {content.status} · {formatPublished(content.publishedAt)}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href={`/professor/conteudos/${content.id}/editar`} style={{ borderRadius: 10, border: "1px solid #cbd5e1", padding: "12px 16px", textDecoration: "none", color: "#0f172a" }}>
            Editar
          </Link>
          {content.status !== "published" ? (
            <button type="button" disabled={loadingAction} onClick={() => void updateStatus("published")} style={{ borderRadius: 10, border: "none", padding: "12px 16px", background: "#2563eb", color: "#fff", cursor: "pointer", fontWeight: 600 }}>
              Publicar
            </button>
          ) : null}
          {content.status === "published" ? (
            <button type="button" disabled={loadingAction} onClick={() => void updateStatus("archived")} style={{ borderRadius: 10, border: "1px solid #cbd5e1", padding: "12px 16px", background: "#fff", cursor: "pointer" }}>
              Arquivar
            </button>
          ) : null}
          <button type="button" disabled={loadingAction} onClick={() => void handleDelete()} style={{ borderRadius: 10, border: "1px solid #fecaca", padding: "12px 16px", background: "#fff", color: "#b91c1c", cursor: "pointer" }}>
            Excluir
          </button>
        </div>
      </div>

      {error ? <div style={{ color: "#b91c1c" }}>{error}</div> : null}

      <section style={{ background: "#fff", border: "1px solid #dbe4f0", borderRadius: 16, padding: 20, display: "grid", gap: 16 }}>
        <h2 style={{ margin: 0 }}>Preview</h2>
        <p style={{ color: "#334155", lineHeight: 1.7, margin: 0 }}>{content.description}</p>
        {content.imageUrl ? (
          <MediaImage
            src={content.imageUrl}
            alt={content.title}
            style={{ width: "100%", maxWidth: 640, borderRadius: 12, border: "1px solid #dbe4f0" }}
          />
        ) : null}
        {content.videoUrl ? (
          <video
            src={content.videoUrl}
            controls
            style={{ width: "100%", maxWidth: 720, borderRadius: 12, border: "1px solid #dbe4f0" }}
          />
        ) : null}
      </section>
    </div>
  );
}
