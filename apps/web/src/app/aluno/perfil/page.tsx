"use client";

import { useEffect, useState } from "react";

import type { ProfileResponse } from "@rema/contracts";
import { apiProfile, apiUpdateAvatar, apiUpdateProfile, apiUploadMedia } from "@/lib/api";
import { MediaImage } from "@/components/MediaImage";
import { getStoredToken } from "@/lib/cookies";

export default function Page() {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [theme, setTheme] = useState("light");
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    apiProfile(token)
      .then((payload) => {
        setProfile(payload);
        setDisplayName(payload.displayName);
        setAvatarUrl(payload.avatarUrl ?? "");
        setTheme(String(payload.preferences?.theme ?? "light"));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Falha ao carregar perfil"));
  }, []);

  async function saveProfile() {
    const token = getStoredToken();
    if (!token) return;
    setError(null);
    try {
      const updated = await apiUpdateProfile(token, {
        displayName,
        preferences: { theme },
        bio: profile?.bio ?? null,
      });
      setProfile(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar perfil");
    }
  }

  async function saveAvatar() {
    const token = getStoredToken();
    if (!token) return;
    setError(null);
    try {
      const updated = await apiUpdateAvatar(token, { avatarUrl });
      setProfile(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao atualizar avatar");
    }
  }

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    const token = getStoredToken();
    if (!file || !token) return;
    setUploadingAvatar(true);
    setError(null);
    try {
      const uploaded = await apiUploadMedia(token, file, "avatar");
      setAvatarUrl(uploaded.url);
      const updated = await apiUpdateAvatar(token, { avatarUrl: uploaded.url });
      setProfile(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao enviar avatar");
    } finally {
      setUploadingAvatar(false);
      event.target.value = "";
    }
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div>
        <h1 style={{ marginTop: 0 }}>Perfil</h1>
        <p style={{ color: "#64748b", lineHeight: 1.6 }}>
          Ajuste sua identidade basica e preferencias pessoais.
        </p>
      </div>
      {error ? <div style={{ color: "#b91c1c" }}>{error}</div> : null}
      <section style={{ background: "#fff", border: "1px solid #dbe4f0", borderRadius: 16, padding: 20, display: "grid", gap: 14 }}>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Nome de exibicao</span>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} style={{ padding: 10, borderRadius: 10, border: "1px solid #cbd5e1" }} />
        </label>
        <label style={{ display: "grid", gap: 6 }}>
          <span>Tema preferido</span>
          <select value={theme} onChange={(e) => setTheme(e.target.value)} style={{ padding: 10, borderRadius: 10, border: "1px solid #cbd5e1" }}>
            <option value="light">Claro</option>
            <option value="dark">Escuro</option>
          </select>
        </label>
        <button type="button" onClick={() => void saveProfile()} style={{ width: "fit-content", borderRadius: 10, border: "none", padding: "12px 16px", background: "#2563eb", color: "#fff", cursor: "pointer", fontWeight: 600 }}>
          Salvar perfil
        </button>
      </section>
      <section style={{ background: "#fff", border: "1px solid #dbe4f0", borderRadius: 16, padding: 20, display: "grid", gap: 14 }}>
        <span>Avatar</span>
        {avatarUrl ? (
          <MediaImage
            src={avatarUrl}
            alt="Avatar do aluno"
            style={{ width: 96, height: 96, borderRadius: "50%", objectFit: "cover", border: "1px solid #cbd5e1" }}
          />
        ) : (
          <div style={{ width: 96, height: 96, borderRadius: "50%", background: "#e2e8f0" }} />
        )}
        <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void handleAvatarChange(event)} />
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button type="button" onClick={() => void saveAvatar()} disabled={!avatarUrl || uploadingAvatar} style={{ width: "fit-content", borderRadius: 10, border: "1px solid #cbd5e1", padding: "12px 16px", background: "#fff", cursor: "pointer" }}>
            {uploadingAvatar ? "Enviando…" : "Salvar avatar atual"}
          </button>
        </div>
      </section>
    </div>
  );
}
