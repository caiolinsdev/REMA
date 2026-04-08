"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import type {
  GameDetail,
  GameRuntimeResponse,
  GameSessionSummary,
  GameSummary,
} from "@rema/contracts";
import {
  apiGameDetail,
  apiGames,
  apiGameRuntime,
  apiGameSessions,
  apiRegisterGameSession,
} from "@/lib/api";
import { getStoredToken } from "@/lib/cookies";
import styles from "./page.module.css";

const panelStyle: CSSProperties = {
  background: "#fff",
  border: "1px solid #dbe4f0",
  borderRadius: 20,
  padding: 20,
  boxShadow: "0 8px 24px rgba(15, 23, 42, 0.04)",
};

function experienceLabel(type: GameSummary["experienceType"]) {
  return {
    quiz: "Quiz",
    memoria: "Memória",
    sequencia: "Sequência",
    palavras: "Palavras",
    logica: "Lógica",
  }[type];
}

function sourceStrategyLabel(value: GameSummary["sourceStrategy"]) {
  return {
    remote_api: "API externa",
    local_engine: "Local no REMA",
    hybrid: "Híbrido",
  }[value];
}

function contentSourceLabel(value: GameRuntimeResponse["contentSource"]) {
  return {
    remote_api: "Conteúdo remoto",
    local_fallback: "Fallback local",
    local_engine: "Engine local",
  }[value];
}

type ResultProps = {
  score: number;
  progress: number;
  message: string;
};

type OnComplete = (result: ResultProps) => void;

function HangmanPlay({
  runtime,
  onComplete,
}: {
  runtime: Extract<GameRuntimeResponse, { kind: "hangman" }>;
  onComplete: OnComplete;
}) {
  const [guessedLetters, setGuessedLetters] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const word = runtime.payload.solutionWord;
  const uniqueLetters = useMemo(() => Array.from(new Set(word.split(""))), [word]);
  const wrongGuesses = guessedLetters.filter((letter) => !word.includes(letter));
  const isWon = uniqueLetters.every((letter) => guessedLetters.includes(letter));
  const isLost = wrongGuesses.length >= runtime.payload.maxAttempts;
  const isFinished = isWon || isLost;
  const maskedWord = word
    .split("")
    .map((letter) => (guessedLetters.includes(letter) || isFinished ? letter.toUpperCase() : "_"))
    .join(" ");

  function registerResult() {
    if (submitted) return;
    const revealed = uniqueLetters.filter((letter) => guessedLetters.includes(letter)).length;
    const progress = isWon
      ? 100
      : Math.round((revealed / Math.max(1, uniqueLetters.length)) * 100);
    const score = isWon
      ? Math.max(
          50,
          Math.round(
            ((runtime.payload.maxAttempts - wrongGuesses.length) / runtime.payload.maxAttempts) *
              100,
          ),
        )
      : Math.max(10, Math.round(progress * 0.4));
    onComplete({
      score,
      progress,
      message: isWon ? "Partida de forca concluída com sucesso." : "Tentativas esgotadas na forca.",
    });
    setSubmitted(true);
  }

  return (
    <section style={{ ...panelStyle, display: "grid", gap: 16 }}>
      <div>
        <h3 style={{ marginTop: 0 }}>Forca</h3>
        <p style={{ color: "#64748b", margin: "6px 0 0" }}>
          Tente descobrir a palavra. Erros: {wrongGuesses.length}/{runtime.payload.maxAttempts}
        </p>
      </div>
      <div
        style={{
          fontSize: 30,
          fontWeight: 700,
          letterSpacing: "0.3rem",
          textAlign: "center",
          color: "#0f172a",
          padding: "18px 12px",
          borderRadius: 16,
          background: "#f8fafc",
        }}
      >
        {maskedWord}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(42px, 1fr))", gap: 8 }}>
        {runtime.payload.alphabet.map((letter) => {
          const guessed = guessedLetters.includes(letter);
          return (
            <button
              key={letter}
              type="button"
              disabled={guessed || isFinished}
              onClick={() => setGuessedLetters((current) => [...current, letter])}
              style={{
                borderRadius: 10,
                border: "1px solid #cbd5e1",
                padding: "10px 0",
                background: guessed ? "#dbeafe" : "#fff",
                cursor: guessed || isFinished ? "not-allowed" : "pointer",
                fontWeight: 700,
              }}
            >
              {letter.toUpperCase()}
            </button>
          );
        })}
      </div>
      {isFinished ? (
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ color: isWon ? "#166534" : "#b91c1c" }}>
            {isWon
              ? `Você venceu. Palavra: ${word.toUpperCase()}.`
              : `Fim de jogo. A palavra era ${word.toUpperCase()}.`}
          </div>
          <button
            type="button"
            disabled={submitted}
            onClick={registerResult}
            style={{
              width: "fit-content",
              borderRadius: 10,
              border: "none",
              padding: "12px 16px",
              background: "#2563eb",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {submitted ? "Resultado registrado" : "Registrar resultado"}
          </button>
        </div>
      ) : null}
    </section>
  );
}

function SudokuPlay({
  runtime,
  onComplete,
}: {
  runtime: Extract<GameRuntimeResponse, { kind: "sudoku" }>;
  onComplete: OnComplete;
}) {
  const [board, setBoard] = useState(runtime.payload.puzzle.map((row) => [...row]));
  const [checked, setChecked] = useState<null | { correct: number; editable: number; solved: boolean }>(null);
  const [submitted, setSubmitted] = useState(false);

  function updateCell(rowIndex: number, colIndex: number, value: string) {
    const nextValue = value === "" ? 0 : Math.max(0, Math.min(9, Number(value)));
    setBoard((current) =>
      current.map((row, currentRow) =>
        row.map((cell, currentCol) =>
          currentRow === rowIndex && currentCol === colIndex ? nextValue : cell,
        ),
      ),
    );
  }

  function validateBoard() {
    const editableCoordinates: Array<[number, number]> = [];
    runtime.payload.puzzle.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (cell === 0) editableCoordinates.push([rowIndex, colIndex]);
      });
    });

    const correct = editableCoordinates.filter(
      ([row, col]) => board[row][col] === runtime.payload.solution[row][col],
    ).length;
    const editable = editableCoordinates.length;
    setChecked({ correct, editable, solved: correct === editable && editable > 0 });
  }

  function registerResult() {
    if (!checked || submitted) return;
    const score =
      checked.editable === 0 ? 100 : Math.round((checked.correct / checked.editable) * 100);
    onComplete({
      score,
      progress: score,
      message: checked.solved
        ? "Sudoku concluído com sucesso."
        : "Sudoku verificado e progresso registrado.",
    });
    setSubmitted(true);
  }

  return (
    <section style={{ ...panelStyle, display: "grid", gap: 16 }}>
      <div>
        <h3 style={{ marginTop: 0 }}>Sudoku</h3>
        <p style={{ color: "#64748b", margin: "6px 0 0" }}>
          Dificuldade: {runtime.payload.difficulty}. Preencha a grade e valide quando terminar.
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(9, 42px)", gap: 4, justifyContent: "center" }}>
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const isFixed = runtime.payload.puzzle[rowIndex][colIndex] !== 0;
            return (
              <input
                key={`${rowIndex}-${colIndex}`}
                value={cell === 0 ? "" : String(cell)}
                disabled={isFixed}
                onChange={(event) => updateCell(rowIndex, colIndex, event.target.value)}
                inputMode="numeric"
                maxLength={1}
                style={{
                  width: 42,
                  height: 42,
                  textAlign: "center",
                  borderRadius: 8,
                  border: "1px solid #cbd5e1",
                  background: isFixed ? "#eff6ff" : "#fff",
                  fontWeight: 700,
                }}
              />
            );
          }),
        )}
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={validateBoard}
          style={{
            borderRadius: 10,
            border: "none",
            padding: "12px 16px",
            background: "#2563eb",
            color: "#fff",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Validar solução
        </button>
        {checked ? (
          <button
            type="button"
            disabled={submitted}
            onClick={registerResult}
            style={{
              borderRadius: 10,
              border: "1px solid #cbd5e1",
              padding: "12px 16px",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            {submitted ? "Resultado registrado" : "Registrar resultado"}
          </button>
        ) : null}
      </div>
      {checked ? (
        <div style={{ color: checked.solved ? "#166534" : "#92400e" }}>
          {checked.solved
            ? "Sudoku resolvido corretamente."
            : `Você acertou ${checked.correct} de ${checked.editable} casas editáveis.`}
        </div>
      ) : null}
    </section>
  );
}

function QuizPlay({
  runtime,
  title,
  onComplete,
}: {
  runtime: Extract<GameRuntimeResponse, { kind: "quiz_portuguese" | "quiz_math" }>;
  title: string;
  onComplete: OnComplete;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [registered, setRegistered] = useState(false);

  const result = useMemo(() => {
    if (!submitted) return null;
    const questions = runtime.payload.questions;
    const correct = questions.filter(
      (question) => answers[question.id] === question.correctOptionId,
    ).length;
    const total = questions.length;
    return {
      correct,
      total,
      score: Math.round((correct / Math.max(1, total)) * 100),
    };
  }, [answers, runtime.payload.questions, submitted]);

  function registerResult() {
    if (!result || registered) return;
    onComplete({
      score: result.score,
      progress: 100,
      message: `${title} concluído com ${result.correct} acertos.`,
    });
    setRegistered(true);
  }

  return (
    <section style={{ ...panelStyle, display: "grid", gap: 16 }}>
      <div>
        <h3 style={{ marginTop: 0 }}>{title}</h3>
        <p style={{ color: "#64748b", margin: "6px 0 0" }}>
          Responda as perguntas e envie o quiz para calcular o score.
        </p>
      </div>
      {runtime.payload.questions.map((question, questionIndex) => (
        <article key={question.id} style={{ border: "1px solid #e2e8f0", borderRadius: 16, padding: 16, display: "grid", gap: 10 }}>
          <strong>
            {questionIndex + 1}. {question.prompt}
          </strong>
          <div style={{ display: "grid", gap: 8 }}>
            {question.options.map((option) => {
              const isCorrect = submitted && option.id === question.correctOptionId;
              const isWrong =
                submitted &&
                answers[question.id] === option.id &&
                option.id !== question.correctOptionId;
              return (
                <label
                  key={option.id}
                  style={{
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid #cbd5e1",
                    background: isCorrect ? "#dcfce7" : isWrong ? "#fee2e2" : "#fff",
                  }}
                >
                  <input
                    type="radio"
                    name={question.id}
                    checked={answers[question.id] === option.id}
                    disabled={submitted}
                    onChange={() =>
                      setAnswers((current) => ({ ...current, [question.id]: option.id }))
                    }
                  />
                  <span>{option.label}</span>
                </label>
              );
            })}
          </div>
        </article>
      ))}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {!submitted ? (
          <button
            type="button"
            onClick={() => setSubmitted(true)}
            style={{
              borderRadius: 10,
              border: "none",
              padding: "12px 16px",
              background: "#2563eb",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Enviar quiz
          </button>
        ) : null}
        {submitted ? (
          <button
            type="button"
            disabled={registered}
            onClick={registerResult}
            style={{
              borderRadius: 10,
              border: "1px solid #cbd5e1",
              padding: "12px 16px",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            {registered ? "Resultado registrado" : "Registrar resultado"}
          </button>
        ) : null}
      </div>
      {result ? (
        <div style={{ color: "#166534" }}>
          Você acertou {result.correct} de {result.total} perguntas. Score {result.score}.
        </div>
      ) : null}
    </section>
  );
}

function MazePlay({
  runtime,
  onComplete,
}: {
  runtime: Extract<GameRuntimeResponse, { kind: "maze" }>;
  onComplete: OnComplete;
}) {
  const [position, setPosition] = useState(runtime.payload.start);
  const [moves, setMoves] = useState(0);
  const [visited, setVisited] = useState<Record<string, true>>({
    [`${runtime.payload.start.row}-${runtime.payload.start.col}`]: true,
  });
  const [submitted, setSubmitted] = useState(false);

  const reachedGoal =
    position.row === runtime.payload.goal.row && position.col === runtime.payload.goal.col;

  function move(direction: "up" | "right" | "down" | "left") {
    if (reachedGoal) return;
    const cell = runtime.payload.cells[position.row][position.col];
    if (!cell[direction]) return;
    const delta = {
      up: { row: -1, col: 0 },
      right: { row: 0, col: 1 },
      down: { row: 1, col: 0 },
      left: { row: 0, col: -1 },
    }[direction];
    const next = { row: position.row + delta.row, col: position.col + delta.col };
    setPosition(next);
    setMoves((current) => current + 1);
    setVisited((current) => ({ ...current, [`${next.row}-${next.col}`]: true }));
  }

  function registerResult() {
    if (!reachedGoal || submitted) return;
    const visitedCount = Object.keys(visited).length;
    const score = Math.max(40, Math.round(100 - Math.max(0, moves - visitedCount + 1) * 4));
    onComplete({
      score,
      progress: 100,
      message: "Labirinto concluído até a saída.",
    });
    setSubmitted(true);
  }

  return (
    <section style={{ ...panelStyle, display: "grid", gap: 16 }}>
      <div>
        <h3 style={{ marginTop: 0 }}>Labirinto</h3>
        <p style={{ color: "#64748b", margin: "6px 0 0" }}>
          Saia do ponto inicial e alcance o objetivo verde.
        </p>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${runtime.payload.cols}, 36px)`,
          gap: 0,
          justifyContent: "center",
        }}
      >
        {runtime.payload.cells.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const isCurrent = position.row === rowIndex && position.col === colIndex;
            const isGoal =
              runtime.payload.goal.row === rowIndex &&
              runtime.payload.goal.col === colIndex;
            const isVisited = visited[`${rowIndex}-${colIndex}`];
            return (
              <div
                key={`${rowIndex}-${colIndex}`}
                style={{
                  width: 36,
                  height: 36,
                  boxSizing: "border-box",
                  borderTop: cell.up ? "1px solid transparent" : "2px solid #0f172a",
                  borderRight: cell.right ? "1px solid transparent" : "2px solid #0f172a",
                  borderBottom: cell.down ? "1px solid transparent" : "2px solid #0f172a",
                  borderLeft: cell.left ? "1px solid transparent" : "2px solid #0f172a",
                  background: isCurrent ? "#2563eb" : isGoal ? "#22c55e" : isVisited ? "#e2e8f0" : "#fff",
                }}
              />
            );
          }),
        )}
      </div>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        <button type="button" onClick={() => move("up")} style={{ borderRadius: 10, border: "1px solid #cbd5e1", padding: "10px 14px", background: "#fff", cursor: "pointer" }}>Cima</button>
        <button type="button" onClick={() => move("left")} style={{ borderRadius: 10, border: "1px solid #cbd5e1", padding: "10px 14px", background: "#fff", cursor: "pointer" }}>Esquerda</button>
        <button type="button" onClick={() => move("down")} style={{ borderRadius: 10, border: "1px solid #cbd5e1", padding: "10px 14px", background: "#fff", cursor: "pointer" }}>Baixo</button>
        <button type="button" onClick={() => move("right")} style={{ borderRadius: 10, border: "1px solid #cbd5e1", padding: "10px 14px", background: "#fff", cursor: "pointer" }}>Direita</button>
      </div>
      <div style={{ color: "#64748b" }}>Movimentos: {moves}</div>
      {reachedGoal ? (
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ color: "#166534" }}>Você encontrou a saída do labirinto.</div>
          <button
            type="button"
            disabled={submitted}
            onClick={registerResult}
            style={{
              width: "fit-content",
              borderRadius: 10,
              border: "none",
              padding: "12px 16px",
              background: "#2563eb",
              color: "#fff",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            {submitted ? "Resultado registrado" : "Registrar resultado"}
          </button>
        </div>
      ) : null}
    </section>
  );
}

function CatalogSkeletonCard() {
  return (
    <div className={styles.catalogSkeleton} aria-hidden="true">
      <div className={`${styles.skeletonLine} ${styles.skeletonTitle}`} />
      <div className={`${styles.skeletonLine} ${styles.skeletonText}`} />
      <div className={`${styles.skeletonLine} ${styles.skeletonTextShort}`} />
      <div className={`${styles.skeletonLine} ${styles.skeletonTextShort}`} />
    </div>
  );
}

function GameLoadingPanel({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <section className={styles.loadingPanel} aria-live="polite">
      <div className={styles.loadingHeader}>
        <div className={styles.loadingOrb} />
        <div>
          <div className={styles.loadingBadge}>Loading</div>
          <h2 className={styles.loadingTitle}>{title}</h2>
          <p className={styles.loadingText}>{subtitle}</p>
        </div>
      </div>

      <div className={styles.loadingGrid} aria-hidden="true">
        <div className={styles.loadingBlock}>
          <div className={`${styles.skeletonLine} ${styles.skeletonTitle}`} />
          <div className={`${styles.skeletonLine} ${styles.skeletonText}`} />
          <div className={`${styles.skeletonLine} ${styles.skeletonTextShort}`} />
        </div>
        <div className={styles.loadingBlock}>
          <div className={`${styles.skeletonLine} ${styles.skeletonTitle}`} />
          <div className={`${styles.skeletonLine} ${styles.skeletonText}`} />
          <div className={`${styles.skeletonLine} ${styles.skeletonTextShort}`} />
        </div>
        <div className={styles.loadingBlock}>
          <div className={`${styles.skeletonLine} ${styles.skeletonTitle}`} />
          <div className={`${styles.skeletonLine} ${styles.skeletonText}`} />
          <div className={`${styles.skeletonLine} ${styles.skeletonTextShort}`} />
        </div>
      </div>

      <div className={styles.loadingFooter}>
        <div className={styles.progressTrack}>
          <div className={styles.progressFill} />
        </div>
        <span className={styles.loadingHint}>Preparando a próxima experiência de jogo...</span>
      </div>
    </section>
  );
}

export default function Page() {
  const [games, setGames] = useState<GameSummary[]>([]);
  const [sessions, setSessions] = useState<GameSessionSummary[]>([]);
  const [selectedGame, setSelectedGame] = useState<GameDetail | null>(null);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [runtime, setRuntime] = useState<GameRuntimeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [gamesLoading, setGamesLoading] = useState(true);
  const [loadingGameId, setLoadingGameId] = useState<string | null>(null);
  const gameRequestRef = useRef(0);

  async function loadCatalog(
    nextGameId?: string | null,
    options?: { showLoadingState?: boolean },
  ) {
    const token = getStoredToken();
    if (!token) return { token: null, targetId: null };
    if (options?.showLoadingState) {
      setGamesLoading(true);
    }
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
      return { token, targetId };
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao carregar jogos");
      return { token, targetId: null };
    } finally {
      if (options?.showLoadingState) {
        setGamesLoading(false);
      }
    }
  }

  async function loadSelectedGame(gameId: string) {
    const token = getStoredToken();
    if (!token) return;
    const requestId = gameRequestRef.current + 1;
    gameRequestRef.current = requestId;
    setLoadingGameId(gameId);
    setError(null);
    setSelectedGameId(gameId);
    setSelectedGame(null);
    setRuntime(null);
    try {
      const [detail, runtimePayload] = await Promise.all([
        apiGameDetail(token, gameId),
        apiGameRuntime(token, gameId),
      ]);
      if (gameRequestRef.current !== requestId) return;
      setSelectedGame(detail);
      setRuntime(runtimePayload);
    } catch (err) {
      if (gameRequestRef.current !== requestId) return;
      setError(err instanceof Error ? err.message : "Falha ao abrir jogo");
    } finally {
      if (gameRequestRef.current === requestId) {
        setLoadingGameId(null);
      }
    }
  }

  useEffect(() => {
    const token = getStoredToken();
    if (!token) {
      setGamesLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      let requestId: number | null = null;
      setGamesLoading(true);
      setError(null);
      try {
        const [gamesPayload, sessionsPayload] = await Promise.all([
          apiGames(token),
          apiGameSessions(token),
        ]);
        if (cancelled) return;
        setGames(gamesPayload);
        setSessions(sessionsPayload);
        const targetId = gamesPayload[0]?.id ?? null;
        setSelectedGameId(targetId);
        if (!targetId) {
          setSelectedGame(null);
          setRuntime(null);
          return;
        }

        requestId = gameRequestRef.current + 1;
        gameRequestRef.current = requestId;
        setLoadingGameId(targetId);
        setSelectedGame(null);
        setRuntime(null);

        const [detail, runtimePayload] = await Promise.all([
          apiGameDetail(token, targetId),
          apiGameRuntime(token, targetId),
        ]);
        if (cancelled || gameRequestRef.current !== requestId) return;
        setSelectedGame(detail);
        setRuntime(runtimePayload);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Falha ao carregar jogos");
        setSelectedGame(null);
        setRuntime(null);
      } finally {
        if (!cancelled) {
          setGamesLoading(false);
          if (requestId === null || gameRequestRef.current === requestId) {
            setLoadingGameId(null);
          }
        }
      }
    })();

    return () => {
      cancelled = true;
      gameRequestRef.current += 1;
    };
  }, []);

  async function handleSelectGame(gameId: string) {
    setSelectedGameId(gameId);
    await loadSelectedGame(gameId);
  }

  async function handleRegisterSession(result: ResultProps) {
    const token = getStoredToken();
    if (!token || !selectedGame) return;
    setError(null);
    setMessage(null);
    try {
      await apiRegisterGameSession(token, selectedGame.id, {
        score: result.score,
        progress: result.progress,
      });
      setMessage(result.message);
      await loadCatalog(selectedGame.id);
      await loadSelectedGame(selectedGame.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao registrar sessão");
    }
  }

  async function handleRefreshRuntime() {
    if (!selectedGameId) return;
    await loadSelectedGame(selectedGameId);
  }

  const selectedSessions = selectedGame
    ? sessions.filter((session) => session.gameId === selectedGame.id)
    : [];
  const selectedGameSummary = useMemo(
    () => games.find((game) => game.id === selectedGameId) ?? null,
    [games, selectedGameId],
  );
  const showEmptyState = !gamesLoading && games.length === 0;
  const showGameLoading = Boolean(loadingGameId) || (gamesLoading && games.length > 0);

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div>
        <h1 style={{ marginTop: 0 }}>Jogos</h1>
        <p style={{ color: "#64748b", lineHeight: 1.6 }}>
          Catálogo curado com 5 jogos e runtime resolvido pelo backend do REMA.
        </p>
      </div>

      {error ? <div style={{ color: "#b91c1c" }}>{error}</div> : null}
      {message ? <div style={{ color: "#166534" }}>{message}</div> : null}

      <section style={{ display: "grid", gridTemplateColumns: "minmax(280px, 360px) 1fr", gap: 20, alignItems: "start" }}>
        <div style={{ display: "grid", gap: 12 }}>
          {gamesLoading && games.length === 0
            ? Array.from({ length: 4 }, (_, index) => <CatalogSkeletonCard key={index} />)
            : null}

          {!gamesLoading
            ? games.map((game) => {
                const isSelected = game.id === selectedGameId;
                const isLoadingThisGame = game.id === loadingGameId;
                const disableSelection = Boolean(loadingGameId);
                return (
                  <button
                    key={game.id}
                    type="button"
                    disabled={disableSelection}
                    onClick={() => void handleSelectGame(game.id)}
                    style={{
                      textAlign: "left",
                      background: isSelected ? "#dbeafe" : "#fff",
                      border: "1px solid #cbd5e1",
                      borderRadius: 16,
                      padding: 16,
                      cursor: disableSelection ? "wait" : "pointer",
                      opacity: disableSelection && !isLoadingThisGame ? 0.72 : 1,
                      display: "grid",
                      gap: 8,
                    }}
                  >
                    <strong style={{ display: "block", marginBottom: 8 }}>{game.title}</strong>
                    <div style={{ color: "#475569", marginBottom: 8 }}>{game.description}</div>
                    <div style={{ color: "#64748b", fontSize: 14 }}>
                      {experienceLabel(game.experienceType)} · {game.estimatedMinutes} min
                    </div>
                    <div style={{ color: "#64748b", fontSize: 14 }}>
                      Estratégia: {sourceStrategyLabel(game.sourceStrategy)}
                    </div>
                    <div style={{ color: "#64748b", fontSize: 14, marginTop: 6 }}>
                      Melhor score: {game.bestScore ?? "-"} · Último progresso: {game.lastProgress ?? "-"}%
                    </div>
                    {isLoadingThisGame ? (
                      <span className={styles.buttonStatus}>Carregando jogo...</span>
                    ) : null}
                  </button>
                );
              })
            : null}

          {showEmptyState ? (
            <div style={{ ...panelStyle, color: "#64748b" }}>
              Nenhum jogo disponível.
            </div>
          ) : null}
        </div>

        <div style={{ display: "grid", gap: 16 }}>
          {gamesLoading && games.length === 0 ? (
            <GameLoadingPanel
              title="Carregando catálogo de jogos"
              subtitle="Buscando o catálogo curado e preparando a primeira partida."
            />
          ) : null}

          {!gamesLoading && showGameLoading ? (
            <GameLoadingPanel
              title={
                selectedGameSummary
                  ? `Preparando ${selectedGameSummary.title}`
                  : "Preparando jogo"
              }
              subtitle="Estamos carregando o detalhe e o runtime da nova partida para você."
            />
          ) : null}

          {!gamesLoading && !showGameLoading && selectedGame && runtime ? (
            <>
              <section style={{ ...panelStyle, display: "grid", gap: 12 }}>
                <div>
                  <h2 style={{ marginTop: 0 }}>{selectedGame.title}</h2>
                  <p style={{ color: "#475569", lineHeight: 1.6 }}>{selectedGame.description}</p>
                </div>
                <div style={{ color: "#64748b" }}>
                  Tipo: {experienceLabel(selectedGame.experienceType)} · Duração estimada:{" "}
                  {selectedGame.estimatedMinutes} min · Estratégia:{" "}
                  {sourceStrategyLabel(selectedGame.sourceStrategy)}
                </div>
                <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                  {selectedGame.instructions}
                </div>
                {runtime ? (
                  <div style={{ color: "#64748b", fontSize: 14 }}>
                    Origem do conteúdo atual: {contentSourceLabel(runtime.contentSource)}
                  </div>
                ) : null}
                <button
                  type="button"
                  onClick={() => void handleRefreshRuntime()}
                  disabled={Boolean(loadingGameId)}
                  style={{ width: "fit-content", borderRadius: 10, border: "1px solid #cbd5e1", padding: "12px 16px", background: "#fff", cursor: "pointer" }}
                >
                  {loadingGameId === selectedGame.id ? "Preparando..." : "Gerar nova partida"}
                </button>
              </section>

              {runtime?.kind === "hangman" ? (
                <HangmanPlay
                  key={JSON.stringify(runtime.payload)}
                  runtime={runtime}
                  onComplete={(result) => void handleRegisterSession(result)}
                />
              ) : null}

              {runtime?.kind === "sudoku" ? (
                <SudokuPlay
                  key={JSON.stringify(runtime.payload)}
                  runtime={runtime}
                  onComplete={(result) => void handleRegisterSession(result)}
                />
              ) : null}

              {runtime?.kind === "quiz_portuguese" ? (
                <QuizPlay
                  key={JSON.stringify(runtime.payload)}
                  runtime={runtime}
                  title="Quiz de Português"
                  onComplete={(result) => void handleRegisterSession(result)}
                />
              ) : null}

              {runtime?.kind === "quiz_math" ? (
                <QuizPlay
                  key={JSON.stringify(runtime.payload)}
                  runtime={runtime}
                  title="Quiz de Matemática"
                  onComplete={(result) => void handleRegisterSession(result)}
                />
              ) : null}

              {runtime?.kind === "maze" ? (
                <MazePlay
                  key={JSON.stringify(runtime.payload)}
                  runtime={runtime}
                  onComplete={(result) => void handleRegisterSession(result)}
                />
              ) : null}

              <section style={{ ...panelStyle, display: "grid", gap: 12 }}>
                <h3 style={{ margin: 0 }}>Histórico do jogo</h3>
                <div style={{ color: "#64748b" }}>
                  Total de sessões: {selectedGame.totalSessions} · Melhor score:{" "}
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
                  <div style={{ color: "#64748b" }}>Nenhuma sessão registrada para este jogo.</div>
                ) : null}
              </section>
            </>
          ) : null}

          {!gamesLoading && !showGameLoading && !selectedGame && !showEmptyState ? (
            <div style={{ ...panelStyle, color: error ? "#b91c1c" : "#64748b" }}>
              {error
                ? "Não foi possível carregar o jogo selecionado. Tente novamente pela lista."
                : "Selecione um jogo do catálogo para começar."}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
