"use client";

import { useCallback, useEffect, useState } from "react";

import type { CommunityPostSummary } from "@rema/contracts";
import {
  apiCommunityPosts,
  apiCreateCommunityPost,
  apiUploadMedia,
} from "@/lib/api";
import { MediaImage } from "@/components/MediaImage";
import { getStoredToken } from "@/lib/cookies";

export default function Page() {
  const [posts, setPosts] = useState<CommunityPostSummary[]>([]);
  const [myPosts, setMyPosts] = useState<CommunityPostSummary[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [gifUrl, setGifUrl] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadingKind, setUploadingKind] = useState<string | null>(null);

  const loadFeed = useCallback(() => {
    const token = getStoredToken();
    if (!token) return;
    Promise.all([apiCommunityPosts(token), apiCommunityPosts(token, "scope=mine")])
      .then(([approvedPosts, ownPosts]) => {
        setPosts(approvedPosts);
        setMyPosts(ownPosts);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Falha ao carregar comunidade"));
  }, []);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  async function submitPost() {
    const token = getStoredToken();
    if (!token) return;
    setError(null);
    setStatusMessage(null);
    try {
      const created = await apiCreateCommunityPost(token, {
        audience: "alunos",
        title,
        body,
        imageUrl: imageUrl || null,
        videoUrl: videoUrl || null,
        gifUrl: gifUrl || null,
      });
      setTitle("");
      setBody("");
      setImageUrl("");
      setVideoUrl("");
      setGifUrl("");
      setStatusMessage(
        created.status === "pending_review"
          ? "Seu post foi enviado para moderação."
          : "Post publicado.",
      );
      loadFeed();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao publicar");
    }
  }

  async function uploadMedia(
    event: React.ChangeEvent<HTMLInputElement>,
    kind: "community_image" | "community_video" | "community_gif",
  ) {
    const file = event.target.files?.[0];
    const token = getStoredToken();
    if (!file || !token) return;
    setUploadingKind(kind);
    setError(null);
    try {
      const uploaded = await apiUploadMedia(token, file, kind);
      if (kind === "community_image") setImageUrl(uploaded.url);
      if (kind === "community_video") setVideoUrl(uploaded.url);
      if (kind === "community_gif") setGifUrl(uploaded.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao enviar arquivo");
    } finally {
      setUploadingKind(null);
      event.target.value = "";
    }
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div>
        <h1 style={{ marginTop: 0 }}>Comunidade</h1>
        <p style={{ color: "#64748b", lineHeight: 1.6 }}>
          Espaço dos alunos com publicação sujeita a aprovação.
        </p>
      </div>
      <section style={{ background: "#fff", border: "1px solid #dbe4f0", borderRadius: 16, padding: 20, display: "grid", gap: 12 }}>
        <input placeholder="Título do post" value={title} onChange={(e) => setTitle(e.target.value)} style={{ padding: 10, borderRadius: 10, border: "1px solid #cbd5e1" }} />
        <textarea placeholder="Compartilhe sua dúvida, ideia ou dica" value={body} onChange={(e) => setBody(e.target.value)} rows={5} style={{ padding: 10, borderRadius: 10, border: "1px solid #cbd5e1", resize: "vertical" }} />
        <label style={{ display: "grid", gap: 6 }}>
          <span>Imagem opcional</span>
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void uploadMedia(event, "community_image")} />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Vídeo opcional</span>
          <input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={(event) => void uploadMedia(event, "community_video")} />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span>GIF opcional</span>
          <input type="file" accept="image/gif" onChange={(event) => void uploadMedia(event, "community_gif")} />
        </label>
        {imageUrl ? <MediaImage src={imageUrl} alt="Preview da imagem do post" style={{ width: 180, borderRadius: 12, border: "1px solid #cbd5e1" }} /> : null}
        {videoUrl ? <video src={videoUrl} controls style={{ width: "100%", maxWidth: 320, borderRadius: 12, border: "1px solid #cbd5e1" }} /> : null}
        {gifUrl ? <MediaImage src={gifUrl} alt="Preview do gif do post" style={{ width: 180, borderRadius: 12, border: "1px solid #cbd5e1" }} /> : null}
        <button type="button" onClick={() => void submitPost()} style={{ width: "fit-content", borderRadius: 10, border: "none", padding: "12px 16px", background: "#2563eb", color: "#fff", cursor: "pointer", fontWeight: 600 }}>
          {uploadingKind ? "Enviando arquivo..." : "Enviar para moderação"}
        </button>
        {statusMessage ? <div style={{ color: "#166534" }}>{statusMessage}</div> : null}
        {error ? <div style={{ color: "#b91c1c" }}>{error}</div> : null}
      </section>
      <section style={{ display: "grid", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Meus posts</h2>
        {myPosts.map((post) => (
          <article key={post.id} style={{ background: "#fff", border: "1px solid #dbe4f0", borderRadius: 16, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <h3 style={{ margin: 0 }}>{post.title}</h3>
              <span style={{ color: post.status === "approved" ? "#166534" : post.status === "rejected" ? "#b91c1c" : "#92400e", fontWeight: 600 }}>
                {post.status}
              </span>
            </div>
            <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{post.body}</p>
            {post.imageUrl ? <MediaImage src={post.imageUrl} alt={post.title} style={{ width: 180, borderRadius: 12, border: "1px solid #dbe4f0" }} /> : null}
            {post.videoUrl ? <video src={post.videoUrl} controls style={{ width: "100%", maxWidth: 320, borderRadius: 12, border: "1px solid #dbe4f0" }} /> : null}
            {post.gifUrl ? <MediaImage src={post.gifUrl} alt={post.title} style={{ width: 180, borderRadius: 12, border: "1px solid #dbe4f0" }} /> : null}
          </article>
        ))}
        {myPosts.length === 0 ? (
          <div style={{ color: "#64748b" }}>Você ainda não criou posts.</div>
        ) : null}
      </section>
      <section style={{ display: "grid", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Feed aprovado</h2>
        {posts.map((post) => (
          <article key={post.id} style={{ background: "#fff", border: "1px solid #dbe4f0", borderRadius: 16, padding: 20 }}>
            <h3 style={{ marginTop: 0 }}>{post.title}</h3>
            <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{post.body}</p>
            {post.imageUrl ? <MediaImage src={post.imageUrl} alt={post.title} style={{ width: 180, borderRadius: 12, border: "1px solid #dbe4f0" }} /> : null}
            {post.videoUrl ? <video src={post.videoUrl} controls style={{ width: "100%", maxWidth: 320, borderRadius: 12, border: "1px solid #dbe4f0" }} /> : null}
            {post.gifUrl ? <MediaImage src={post.gifUrl} alt={post.title} style={{ width: 180, borderRadius: 12, border: "1px solid #dbe4f0" }} /> : null}
          </article>
        ))}
        {posts.length === 0 ? (
          <div style={{ color: "#64748b" }}>Nenhum post aprovado ainda.</div>
        ) : null}
      </section>
    </div>
  );
}
