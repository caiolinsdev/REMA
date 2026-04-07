"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { ContentDetail, UpsertContentRequest } from "@rema/contracts";
import {
  apiContentDetail,
  apiCreateContent,
  apiUpdateContent,
  apiUploadMedia,
} from "@/lib/api";
import { MediaImage } from "@/components/MediaImage";
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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  useEffect(() => {
    if (mode !== "edit" || !contentId) return;
    const token = getStoredToken();
    if (!token) {
      router.replace("/");
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
      .catch((err) => setError(err instanceof Error ? err.message : "Falha ao carregar conteúdo"))
      .finally(() => setLoading(false));
  }, [contentId, mode, router]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const token = getStoredToken();
    if (!token) {
      router.replace("/");
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
      setError(err instanceof Error ? err.message : "Falha ao salvar conteúdo");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpload(
    event: React.ChangeEvent<HTMLInputElement>,
    kind: "content_image" | "content_video",
  ) {
    const file = event.target.files?.[0];
    const token = getStoredToken();
    if (!file || !token) return;
    if (kind === "content_image") {
      setUploadingImage(true);
    }
    if (kind === "content_video") {
      setUploadingVideo(true);
    }
    setError(null);
    try {
      const uploaded = await apiUploadMedia(token, file, kind);
      if (kind === "content_image") {
        setImageUrl(uploaded.url);
      }
      if (kind === "content_video") {
        setVideoUrl(uploaded.url);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao enviar arquivo");
    } finally {
      if (kind === "content_image") {
        setUploadingImage(false);
      }
      if (kind === "content_video") {
        setUploadingVideo(false);
      }
      event.target.value = "";
    }
  }

  if (loading) {
    return <p style={{ color: "#64748b" }}>Carregando conteúdo...</p>;
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div>
        <h1 style={{ marginTop: 0 }}>{mode === "create" ? "Novo conteúdo" : "Editar conteúdo"}</h1>
        <p style={{ color: "#64748b", lineHeight: 1.6 }}>
          Conteúdos nascem em <code>draft</code> e podem ser publicados quando estiverem prontos.
        </p>
      </div>

      {error ? (
        <div style={{ ...panelStyle, borderColor: "#fecaca", color: "#b91c1c" }}>{error}</div>
      ) : null}

      <form onSubmit={onSubmit} style={{ ...panelStyle, display: "grid", gap: 14 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Título</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} required style={{ padding: 10, borderRadius: 10, border: "1px solid #cbd5e1" }} />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Subtítulo</span>
          <input value={subtitle} onChange={(event) => setSubtitle(event.target.value)} required style={{ padding: 10, borderRadius: 10, border: "1px solid #cbd5e1" }} />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Descrição</span>
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={6} required style={{ padding: 10, borderRadius: 10, border: "1px solid #cbd5e1", resize: "vertical" }} />
        </label>
        <div style={{ display: "grid", gap: 8 }}>
          <span>Imagem do conteúdo</span>
          {imageUrl ? (
            <MediaImage
              src={imageUrl}
              alt="Preview da imagem do conteúdo"
              style={{ width: "100%", maxWidth: 320, borderRadius: 12, border: "1px solid #cbd5e1" }}
            />
          ) : null}
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void handleUpload(event, "content_image")} />
          <button type="button" onClick={() => setImageUrl("")} disabled={!imageUrl || uploadingImage} style={{ width: "fit-content", borderRadius: 10, border: "1px solid #cbd5e1", padding: "10px 14px", background: "#fff", cursor: "pointer" }}>
            {uploadingImage ? "Enviando imagem…" : "Remover imagem"}
          </button>
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          <span>Vídeo do conteúdo</span>
          {videoUrl ? (
            <video src={videoUrl} controls style={{ width: "100%", maxWidth: 420, borderRadius: 12, border: "1px solid #cbd5e1" }} />
          ) : null}
          <input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={(event) => void handleUpload(event, "content_video")} />
          <button type="button" onClick={() => setVideoUrl("")} disabled={!videoUrl || uploadingVideo} style={{ width: "fit-content", borderRadius: 10, border: "1px solid #cbd5e1", padding: "10px 14px", background: "#fff", cursor: "pointer" }}>
            {uploadingVideo ? "Enviando vídeo..." : "Remover vídeo"}
          </button>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button type="submit" disabled={saving} style={{ borderRadius: 10, border: "none", padding: "12px 16px", background: "#2563eb", color: "#fff", cursor: "pointer", fontWeight: 600 }}>
            {saving ? "Salvando..." : mode === "create" ? "Criar draft" : "Salvar alterações"}
          </button>
          <button type="button" onClick={() => router.back()} style={{ borderRadius: 10, border: "1px solid #cbd5e1", padding: "12px 16px", background: "#fff", cursor: "pointer" }}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
