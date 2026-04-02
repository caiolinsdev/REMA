"use client";

import { useEffect, useState } from "react";

import type { GameDetail, GameSessionSummary, GameSummary } from "@rema/contracts";
import {
  apiGameDetail,
  apiGames,
  apiGameSessions,
  apiRegisterGameSession,
} from "@/lib/api";
import { getStoredToken } from "@/lib/cookies";

function experienceLabel(type: GameSummary["experienceType"]) {
  return {
    quiz: "Quiz",
    memoria: "Memoria",
    sequencia: "Sequencia",
    palavras: "Palavras",
    logica: "Logica",
  }[type];
}

export default function Page() {
  const [games, setGames] = useState<GameSummary[]>([]);
  const [sessions, setSessions] = useState<GameSessionSummary[]>([]);
  const [selectedGame, setSelectedGame] = useState<GameDetail | null>(null);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [score, setScore] = useState("80");
  const [progress, setProgress] = useState("100");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function loadData(nextGameId?: string | null) {
    const token = getStoredToken();
    if (!token) return;
    setError(null);
    try {
      const [gamesPayload, sessionsPayload] = await Promise.all([
        apiGames(token),
        apiGameSessions(token),
      ]);
      setGames(gamesPayload);
      setSessions(sessionsPayload);
      const targetId = nextGameId ?? selectedGameId ?? gamesPayload[0]?.id ?? null;
      setSelectedGameId(targetId);
      if (targetId) {
        const detail = await apiGameDetail(token, targetId);
        setSelectedGame(detail);
      } else {
        setSelectedGame(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar jogos");
    }
  }

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;

    Promise.all([apiGames(token), apiGameSessions(token)])
      .then(async ([gamesPayload, sessionsPayload]) => {
        setGames(gamesPayload);
        setSessions(sessionsPayload);
        const targetId = gamesPayload[0]?.id ?? null;
        setSelectedGameId(targetId);
        if (!targetId) {
          setSelectedGame(null);
          return;
        }
        const detail = await apiGameDetail(token, targetId);
        setSelectedGame(detail);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Falha ao carregar jogos");
      });
  }, []);

  async function handleSelectGame(gameId: string) {
    const token = getStoredToken();
    if (!token) return;
    setSelectedGameId(gameId);
    setError(null);
    try {
      const detail = await apiGameDetail(token, gameId);
      setSelectedGame(detail);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao abrir jogo");
    }
  }

  async function handleRegisterSession() {
    const token = getStoredToken();
    if (!token || !selectedGame) return;
    setError(null);
    setMessage(null);
    try {
      await apiRegisterGameSession(token, selectedGame.id, {
        score: Number(score),
        progress: Number(progress),
      });
      setMessage("Sessao registrada com sucesso.");
      await loadData(selectedGame.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao registrar sessao");
    }
  }

  const selectedSessions = selectedGame
    ? sessions.filter((session) => session.gameId === selectedGame.id)
    : [];

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div>
        <h1 style={{ marginTop: 0 }}>Jogos</h1>
        <p style={{ color: "#64748b", lineHeight: 1.6 }}>
          Catalogo inicial independente do nucleo academico, com progresso salvo por sessao.
        </p>
      </div>

      {error ? <div style={{ color: "#b91c1c" }}>{error}</div> : null}
      {message ? <div style={{ color: "#166534" }}>{message}</div> : null}

      <section style={{ display: "grid", gridTemplateColumns: "minmax(280px, 360px) 1fr", gap: 20, alignItems: "start" }}>
        <div style={{ display: "grid", gap: 12 }}>
          {games.map((game) => (
            <button
              key={game.id}
              type="button"
              onClick={() => void handleSelectGame(game.id)}
              style={{
                textAlign: "left",
                background: game.id === selectedGameId ? "#dbeafe" : "#fff",
                border: "1px solid #cbd5e1",
                borderRadius: 16,
                padding: 16,
                cursor: "pointer",
              }}
            >
              <strong style={{ display: "block", marginBottom: 8 }}>{game.title}</strong>
              <div style={{ color: "#475569", marginBottom: 8 }}>{game.description}</div>
              <div style={{ color: "#64748b", fontSize: 14 }}>
                {experienceLabel(game.experienceType)} · {game.estimatedMinutes} min
              </div>
              <div style={{ color: "#64748b", fontSize: 14, marginTop: 6 }}>
                Melhor score: {game.bestScore ?? "-"} · Ultimo progresso: {game.lastProgress ?? "-"}%
              </div>
            </button>
          ))}
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          {selectedGame ? (
            <>
              <section style={{ background: "#fff", border: "1px solid #dbe4f0", borderRadius: 16, padding: 20, display: "grid", gap: 12 }}>
                <div>
                  <h2 style={{ marginTop: 0 }}>{selectedGame.title}</h2>
                  <p style={{ color: "#475569", lineHeight: 1.6 }}>{selectedGame.description}</p>
                </div>
                <div style={{ color: "#64748b" }}>
                  Tipo: {experienceLabel(selectedGame.experienceType)} · Duracao estimada:{" "}
                  {selectedGame.estimatedMinutes} min
                </div>
                <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                  {selectedGame.instructions}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(160px, 220px))", gap: 12 }}>
                  <label style={{ display: "grid", gap: 6 }}>
                    <span>Score</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={score}
                      onChange={(e) => setScore(e.target.value)}
                      style={{ padding: 10, borderRadius: 10, border: "1px solid #cbd5e1" }}
                    />
                  </label>
                  <label style={{ display: "grid", gap: 6 }}>
                    <span>Progresso (%)</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={progress}
                      onChange={(e) => setProgress(e.target.value)}
                      style={{ padding: 10, borderRadius: 10, border: "1px solid #cbd5e1" }}
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => void handleRegisterSession()}
                  style={{ width: "fit-content", borderRadius: 10, border: "none", padding: "12px 16px", background: "#2563eb", color: "#fff", cursor: "pointer", fontWeight: 600 }}
                >
                  Registrar sessao de jogo
                </button>
              </section>

              <section style={{ background: "#fff", border: "1px solid #dbe4f0", borderRadius: 16, padding: 20, display: "grid", gap: 12 }}>
                <h3 style={{ margin: 0 }}>Historico do jogo</h3>
                <div style={{ color: "#64748b" }}>
                  Total de sessoes: {selectedGame.totalSessions} · Melhor score:{" "}
                  {selectedGame.bestScore ?? "-"}
                </div>
                {selectedSessions.map((session) => (
                  <article key={session.id} style={{ borderTop: "1px solid #e2e8f0", paddingTop: 12 }}>
                    <strong>Score {session.score}</strong>
                    <div style={{ color: "#64748b" }}>Progresso {session.progress}%</div>
                    <div style={{ color: "#64748b" }}>{new Date(session.playedAt).toLocaleString("pt-BR")}</div>
                  </article>
                ))}
                {selectedSessions.length === 0 ? (
                  <div style={{ color: "#64748b" }}>Nenhuma sessao registrada para este jogo.</div>
                ) : null}
              </section>
            </>
          ) : (
            <div style={{ color: "#64748b" }}>Nenhum jogo disponivel.</div>
          )}
        </div>
      </section>
    </div>
  );
}
