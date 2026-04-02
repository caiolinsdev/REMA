"use client";

import { useEffect, useState } from "react";

import { apiProfile, apiUpdateAvatar, apiUpdateProfile } from "@/lib/api";
import { getStoredToken } from "@/lib/cookies";

export default function Page() {
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [communityEmails, setCommunityEmails] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    apiProfile(token)
      .then((payload) => {
        setDisplayName(payload.displayName);
        setBio(payload.bio ?? "");
        setAvatarUrl(payload.avatarUrl ?? "");
        setCommunityEmails(Boolean(payload.preferences?.communityEmails ?? true));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Falha ao carregar perfil"));
  }, []);

  async function saveProfile() {
    const token = getStoredToken();
    if (!token) return;
    setError(null);
    try {
      await apiUpdateProfile(token, {
        displayName,
        bio,
        preferences: { communityEmails },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar perfil");
    }
  }

  async function saveAvatar() {
    const token = getStoredToken();
    if (!token) return;
    setError(null);
    try {
      await apiUpdateAvatar(token, { avatarUrl });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao atualizar avatar");
    }
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div>
        <h1 style={{ marginTop: 0 }}>Perfil</h1>
        <p style={{ color: "#64748b", lineHeight: 1.6 }}>
          Perfil do professor com bio opcional e preferencias basicas.
        </p>
      </div>
      {error ? <div style={{ color: "#b91c1c" }}>{error}</div> : null}
      <section style={{ background: "#fff", border: "1px solid #dbe4f0", borderRadius: 16, padding: 20, display: "grid", gap: 14 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Nome de exibicao</span>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} style={{ padding: 10, borderRadius: 10, border: "1px solid #cbd5e1" }} />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Bio</span>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} style={{ padding: 10, borderRadius: 10, border: "1px solid #cbd5e1", resize: "vertical" }} />
        </label>
        <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input type="checkbox" checked={communityEmails} onChange={(e) => setCommunityEmails(e.target.checked)} />
          <span>Receber alertas da comunidade de professores</span>
        </label>
        <button type="button" onClick={() => void saveProfile()} style={{ width: "fit-content", borderRadius: 10, border: "none", padding: "12px 16px", background: "#2563eb", color: "#fff", cursor: "pointer", fontWeight: 600 }}>
          Salvar perfil
        </button>
      </section>
      <section style={{ background: "#fff", border: "1px solid #dbe4f0", borderRadius: 16, padding: 20, display: "grid", gap: 14 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>URL do avatar</span>
          <input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} style={{ padding: 10, borderRadius: 10, border: "1px solid #cbd5e1" }} />
        </label>
        <button type="button" onClick={() => void saveAvatar()} style={{ width: "fit-content", borderRadius: 10, border: "1px solid #cbd5e1", padding: "12px 16px", background: "#fff", cursor: "pointer" }}>
          Atualizar avatar
        </button>
      </section>
    </div>
  );
}
