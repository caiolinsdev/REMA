"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { ContentDetail, UpsertContentRequest } from "@rema/contracts";
import { apiContentDetail, apiCreateContent, apiUpdateContent } from "@/lib/api";
import { getStoredToken } from "@/lib/cookies";

type Props = {
  mode: "create" | "edit";
  contentId?: number;
};

const panelStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #dbe4f0",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.05)",
};

export function ContentEditor({ mode, contentId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  useEffect(() => {
    if (mode !== "edit" || !contentId) return;
    const token = getStoredToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    apiContentDetail(token, contentId)
      .then((content: ContentDetail) => {
        setTitle(content.title);
        setSubtitle(content.subtitle);
        setDescription(content.description);
        setImageUrl(content.imageUrl ?? "");
        setVideoUrl(content.videoUrl ?? "");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Falha ao carregar conteudo"))
      .finally(() => setLoading(false));
  }, [contentId, mode, router]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const token = getStoredToken();
    if (!token) {
      router.replace("/login");
      return;
    }
    const body: UpsertContentRequest = {
      title,
      subtitle,
      description,
      imageUrl: imageUrl || null,
      videoUrl: videoUrl || null,
    };
    setSaving(true);
    setError(null);
    try {
      const content =
        mode === "create"
          ? await apiCreateContent(token, body)
          : await apiUpdateContent(token, contentId!, body);
      router.push(`/professor/conteudos/${content.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar conteudo");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p style={{ color: "#64748b" }}>Carregando conteudo…</p>;
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div>
        <h1 style={{ marginTop: 0 }}>{mode === "create" ? "Novo conteudo" : "Editar conteudo"}</h1>
        <p style={{ color: "#64748b", lineHeight: 1.6 }}>
          Conteudos nascem em <code>draft</code> e podem ser publicados quando estiverem prontos.
        </p>
      </div>

      {error ? (
        <div style={{ ...panelStyle, borderColor: "#fecaca", color: "#b91c1c" }}>{error}</div>
      ) : null}

      <form onSubmit={onSubmit} style={{ ...panelStyle, display: "grid", gap: 14 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Titulo</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} required style={{ padding: 10, borderRadius: 10, border: "1px solid #cbd5e1" }} />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Subtitulo</span>
          <input value={subtitle} onChange={(event) => setSubtitle(event.target.value)} required style={{ padding: 10, borderRadius: 10, border: "1px solid #cbd5e1" }} />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Descricao</span>
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={6} required style={{ padding: 10, borderRadius: 10, border: "1px solid #cbd5e1", resize: "vertical" }} />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Imagem (URL opcional)</span>
          <input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} style={{ padding: 10, borderRadius: 10, border: "1px solid #cbd5e1" }} />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Video (URL opcional)</span>
          <input value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} style={{ padding: 10, borderRadius: 10, border: "1px solid #cbd5e1" }} />
        </label>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button type="submit" disabled={saving} style={{ borderRadius: 10, border: "none", padding: "12px 16px", background: "#2563eb", color: "#fff", cursor: "pointer", fontWeight: 600 }}>
            {saving ? "Salvando…" : mode === "create" ? "Criar draft" : "Salvar alteracoes"}
          </button>
          <button type="button" onClick={() => router.back()} style={{ borderRadius: 10, border: "1px solid #cbd5e1", padding: "12px 16px", background: "#fff", cursor: "pointer" }}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
