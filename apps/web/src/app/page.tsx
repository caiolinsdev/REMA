"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { apiLogin } from "@/lib/api";
import { setAuthCookies } from "@/lib/cookies";

import styles from "./login/login.module.css";

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const session = await apiLogin({ email: email.trim(), password });
      setAuthCookies(session.token, session.user.role);
      router.replace(session.user.role === "professor" ? "/professor" : "/aluno");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <p className={styles.badge}>REMA</p>
        <h1 className={styles.title}>Entrar</h1>
        <p className={styles.hint}>
          Todo o acesso ao sistema começa aqui. Contas demo: <code>aluno@demo.local</code>{" "}
          ou <code>professor@demo.local</code> com senha <code>demo123</code>.
        </p>
        <form className={styles.form} onSubmit={onSubmit}>
          <label className={styles.label}>
            Email
            <input
              className={styles.input}
              type="email"
              autoComplete="username"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              required
            />
          </label>
          <label className={styles.label}>
            Senha
            <input
              className={styles.input}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              required
            />
          </label>
          {error ? (
            <p className={styles.error} role="alert">
              {error}
            </p>
          ) : null}
          <button className={styles.submit} type="submit" disabled={loading}>
            {loading ? "A entrar…" : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
