"use client";

import { useCallback, useEffect, useState } from "react";

import type { CommunityPostSummary } from "@rema/contracts";
import {
  apiApproveCommunityPost,
  apiCommunityPosts,
  apiCreateCommunityPost,
  apiRejectCommunityPost,
} from "@/lib/api";
import { getStoredToken } from "@/lib/cookies";

export default function Page() {
  const [teacherPosts, setTeacherPosts] = useState<CommunityPostSummary[]>([]);
  const [moderationQueue, setModerationQueue] = useState<CommunityPostSummary[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(() => {
    const token = getStoredToken();
    if (!token) return;
    Promise.all([
      apiCommunityPosts(token),
      apiCommunityPosts(token, "queue=moderation"),
    ])
      .then(([teacherFeed, queue]) => {
        setTeacherPosts(teacherFeed);
        setModerationQueue(queue);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Falha ao carregar comunidade"));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function submitTeacherPost() {
    const token = getStoredToken();
    if (!token) return;
    setError(null);
    try {
      await apiCreateCommunityPost(token, {
        audience: "professores",
        title,
        body,
      });
      setTitle("");
      setBody("");
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao publicar");
    }
  }

  async function moderate(postId: string, decision: "approve" | "reject") {
    const token = getStoredToken();
    if (!token) return;
    setError(null);
    try {
      if (decision === "approve") {
        await apiApproveCommunityPost(token, postId, { comment: "Aprovado pelo professor." });
      } else {
        await apiRejectCommunityPost(token, postId, { comment: "Revisar antes de publicar." });
      }
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao moderar");
    }
  }

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div>
        <h1 style={{ marginTop: 0 }}>Comunidade</h1>
        <p style={{ color: "#64748b", lineHeight: 1.6 }}>
          Feed privado entre professores e fila de moderacao dos posts de alunos.
        </p>
      </div>
      {error ? <div style={{ color: "#b91c1c" }}>{error}</div> : null}
      <section style={{ background: "#fff", border: "1px solid #dbe4f0", borderRadius: 16, padding: 20, display: "grid", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Novo post para professores</h2>
        <input placeholder="Titulo do aviso" value={title} onChange={(e) => setTitle(e.target.value)} style={{ padding: 10, borderRadius: 10, border: "1px solid #cbd5e1" }} />
        <textarea placeholder="Compartilhe combinados e trocas internas" value={body} onChange={(e) => setBody(e.target.value)} rows={5} style={{ padding: 10, borderRadius: 10, border: "1px solid #cbd5e1", resize: "vertical" }} />
        <button type="button" onClick={() => void submitTeacherPost()} style={{ width: "fit-content", borderRadius: 10, border: "none", padding: "12px 16px", background: "#2563eb", color: "#fff", cursor: "pointer", fontWeight: 600 }}>
          Publicar no feed privado
        </button>
      </section>
      <section style={{ display: "grid", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Fila de moderacao</h2>
        {moderationQueue.map((post) => (
          <article key={post.id} style={{ background: "#fff", border: "1px solid #dbe4f0", borderRadius: 16, padding: 20, display: "grid", gap: 12 }}>
            <div>
              <strong>{post.title}</strong>
              <p style={{ marginBottom: 0, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{post.body}</p>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={() => void moderate(post.id, "approve")} style={{ borderRadius: 10, border: "none", padding: "10px 14px", background: "#166534", color: "#fff", cursor: "pointer" }}>
                Aprovar
              </button>
              <button type="button" onClick={() => void moderate(post.id, "reject")} style={{ borderRadius: 10, border: "1px solid #dc2626", padding: "10px 14px", background: "#fff", color: "#dc2626", cursor: "pointer" }}>
                Rejeitar
              </button>
            </div>
          </article>
        ))}
        {moderationQueue.length === 0 ? (
          <div style={{ color: "#64748b" }}>Nenhuma pendencia no momento.</div>
        ) : null}
      </section>
      <section style={{ display: "grid", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Feed privado de professores</h2>
        {teacherPosts.map((post) => (
          <article key={post.id} style={{ background: "#fff", border: "1px solid #dbe4f0", borderRadius: 16, padding: 20 }}>
            <h3 style={{ marginTop: 0 }}>{post.title}</h3>
            <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{post.body}</p>
          </article>
        ))}
        {teacherPosts.length === 0 ? (
          <div style={{ color: "#64748b" }}>Nenhum post privado ainda.</div>
        ) : null}
      </section>
    </div>
  );
}
