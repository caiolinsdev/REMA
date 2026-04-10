import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { GameDetail, GameRuntimeResponse, GameSessionSummary, GameSummary } from "@rema/contracts";

import { BodyText, MutedText } from "../../components/ui/BodyText";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { Screen } from "../../components/ui/Screen";
import { SectionTitle } from "../../components/ui/Title";
import { useAuth } from "../../context/AuthContext";
import {
  apiGameDetail,
  apiGameRuntime,
  apiGames,
  apiGameSessions,
  apiRegisterGameSession,
} from "../../lib/api";
import { contentSourceLabel, experienceLabel, sourceStrategyLabel } from "../../modules/games/gameLabels";
import {
  HangmanPlay,
  MazePlay,
  QuizPlay,
  SudokuPlay,
  type GameResultPayload,
} from "../../modules/games/GamePlayViews";
import { theme } from "../../theme";

function CatalogSkeletonCard() {
  return (
    <View style={styles.skeletonCard}>
      <View style={[styles.skelLine, styles.skelTitle]} />
      <View style={styles.skelLine} />
      <View style={[styles.skelLine, { width: "70%" }]} />
    </View>
  );
}

function GameLoadingPanel({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={styles.loadingPanel} accessibilityRole="progressbar" accessibilityLabel={title}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={styles.loadingTitle}>{title}</Text>
      <MutedText>{subtitle}</MutedText>
      <View style={styles.skeletonStack}>
        <CatalogSkeletonCard />
        <CatalogSkeletonCard />
      </View>
    </View>
  );
}

export function StudentGamesScreen() {
  const { token } = useAuth();
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

  async function loadSelectedGame(gameId: string) {
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
    if (!token) {
      setGamesLoading(false);
      return;
    }

    let cancelled = false;
    let requestId: number | null = null;

    (async () => {
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
  }, [token]);

  async function handleSelectGame(gameId: string) {
    setSelectedGameId(gameId);
    await loadSelectedGame(gameId);
  }

  async function handleRegisterSession(result: GameResultPayload) {
    if (!token || !selectedGame) return;
    setError(null);
    setMessage(null);
    try {
      await apiRegisterGameSession(token, selectedGame.id, {
        score: result.score,
        progress: result.progress,
      });
      setMessage(result.message);
      const [gamesPayload, sessionsPayload] = await Promise.all([
        apiGames(token),
        apiGameSessions(token),
      ]);
      setGames(gamesPayload);
      setSessions(sessionsPayload);
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

  const panelStyle = {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.space.lg,
    gap: theme.space.md,
  } as const;

  return (
    <Screen scroll={false}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <SectionTitle>Jogos</SectionTitle>
        <MutedText style={styles.lead}>
          A partida aparece abaixo das informações do jogo. Use a lista no final da tela para trocar
          de jogo.
        </MutedText>
        {error ? <ErrorBanner message={error} /> : null}
        {message ? <Text style={styles.okMsg}>{message}</Text> : null}

        {/* Jogo ativo primeiro: detalhe → partida → histórico (sem rolar o catálogo inteiro) */}
        {gamesLoading && games.length === 0 ? (
          <GameLoadingPanel
            title="Carregando catálogo de jogos"
            subtitle="Buscando o catálogo curado e preparando a primeira partida."
          />
        ) : null}

        {!gamesLoading && showGameLoading ? (
          <GameLoadingPanel
            title={
              selectedGameSummary ? `Preparando ${selectedGameSummary.title}` : "Preparando jogo"
            }
            subtitle="Carregando detalhe e runtime da nova partida."
          />
        ) : null}

        {showEmptyState ? (
          <View style={[panelStyle, styles.emptyBox]}>
            <MutedText>Nenhum jogo disponível.</MutedText>
          </View>
        ) : null}

        {!gamesLoading && !showGameLoading && !selectedGame && !showEmptyState ? (
          <View style={[panelStyle, styles.emptyBox]}>
            <MutedText>
              {error
                ? "Não foi possível carregar o jogo selecionado. Tente novamente pela lista."
                : "Selecione um jogo no catálogo abaixo para começar."}
            </MutedText>
          </View>
        ) : null}

        {!gamesLoading && !showGameLoading && selectedGame && runtime ? (
          <>
            <View style={panelStyle}>
              <Text style={styles.detailTitle}>{selectedGame.title}</Text>
              <BodyText>{selectedGame.description}</BodyText>
              <MutedText>
                Tipo: {experienceLabel(selectedGame.experienceType)} · Duração estimada:{" "}
                {selectedGame.estimatedMinutes} min · Estratégia:{" "}
                {sourceStrategyLabel(selectedGame.sourceStrategy)}
              </MutedText>
              <BodyText style={styles.instructions}>{selectedGame.instructions}</BodyText>
              <MutedText>Origem do conteúdo: {contentSourceLabel(runtime.contentSource)}</MutedText>
              <Pressable
                style={styles.outlineBtn}
                disabled={Boolean(loadingGameId)}
                onPress={() => void handleRefreshRuntime()}
              >
                <Text style={styles.outlineBtnText}>
                  {loadingGameId === selectedGame.id ? "Preparando…" : "Gerar nova partida"}
                </Text>
              </Pressable>
            </View>

            {runtime.kind === "hangman" ? (
              <HangmanPlay
                key={JSON.stringify(runtime.payload)}
                runtime={runtime}
                onComplete={(r) => void handleRegisterSession(r)}
              />
            ) : null}
            {runtime.kind === "sudoku" ? (
              <SudokuPlay
                key={JSON.stringify(runtime.payload)}
                runtime={runtime}
                onComplete={(r) => void handleRegisterSession(r)}
              />
            ) : null}
            {runtime.kind === "quiz_portuguese" ? (
              <QuizPlay
                key={JSON.stringify(runtime.payload)}
                runtime={runtime}
                title="Quiz de Português"
                onComplete={(r) => void handleRegisterSession(r)}
              />
            ) : null}
            {runtime.kind === "quiz_math" ? (
              <QuizPlay
                key={JSON.stringify(runtime.payload)}
                runtime={runtime}
                title="Quiz de Matemática"
                onComplete={(r) => void handleRegisterSession(r)}
              />
            ) : null}
            {runtime.kind === "maze" ? (
              <MazePlay
                key={JSON.stringify(runtime.payload)}
                runtime={runtime}
                onComplete={(r) => void handleRegisterSession(r)}
              />
            ) : null}

            <View style={panelStyle}>
              <Text style={styles.detailTitle}>Histórico do jogo</Text>
              <MutedText>
                Total de sessões: {selectedGame.totalSessions} · Melhor score:{" "}
                {selectedGame.bestScore ?? "—"}
              </MutedText>
              {selectedSessions.map((session) => (
                <View key={session.id} style={styles.sessionRow}>
                  <Text style={styles.sessionScore}>Score {session.score}</Text>
                  <MutedText>Progresso {session.progress}%</MutedText>
                  <MutedText>
                    {new Date(session.playedAt).toLocaleString("pt-BR")}
                  </MutedText>
                </View>
              ))}
              {selectedSessions.length === 0 ? (
                <MutedText>Nenhuma sessão registrada para este jogo.</MutedText>
              ) : null}
            </View>
          </>
        ) : null}

        {!gamesLoading && games.length > 0 ? (
          <>
            <Text style={styles.catalogHeading}>Trocar de jogo</Text>
            <MutedText style={styles.catalogHint}>
              Toque em outro jogo para carregar a partida.
            </MutedText>
            {games.map((game) => {
              const isSelected = game.id === selectedGameId;
              const isLoadingThisGame = game.id === loadingGameId;
              const disableSelection = Boolean(loadingGameId);
              return (
                <Pressable
                  key={game.id}
                  style={[
                    styles.gameCard,
                    isSelected && styles.gameCardSelected,
                    disableSelection && !isLoadingThisGame && styles.gameCardDim,
                  ]}
                  disabled={disableSelection}
                  onPress={() => void handleSelectGame(game.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected, busy: isLoadingThisGame }}
                >
                  <Text style={styles.gameCardTitle}>{game.title}</Text>
                  <MutedText>{game.description}</MutedText>
                  <MutedText>
                    {experienceLabel(game.experienceType)} · {game.estimatedMinutes} min ·{" "}
                    {sourceStrategyLabel(game.sourceStrategy)}
                  </MutedText>
                  <MutedText>
                    Melhor score: {game.bestScore ?? "—"} · Último progresso:{" "}
                    {game.lastProgress ?? "—"}%
                  </MutedText>
                  {isLoadingThisGame ? (
                    <Text style={styles.loadingHint}>Carregando jogo…</Text>
                  ) : null}
                </Pressable>
              );
            })}
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: theme.space.xl, gap: theme.space.md },
  lead: { marginBottom: theme.space.sm },
  okMsg: { color: "#166534", fontWeight: "600" },
  skeletonCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.space.lg,
    gap: theme.space.sm,
  },
  skelLine: {
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.borderMuted,
  },
  skelTitle: { width: "55%", height: 16 },
  loadingPanel: {
    alignItems: "center",
    padding: theme.space.xl,
    gap: theme.space.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  loadingTitle: { fontSize: theme.font.heading, fontWeight: "700", color: theme.colors.text },
  skeletonStack: { width: "100%", gap: theme.space.sm, marginTop: theme.space.md },
  gameCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.space.lg,
    gap: theme.space.sm,
  },
  gameCardSelected: { backgroundColor: "#dbeafe", borderColor: theme.colors.primary },
  gameCardDim: { opacity: 0.72 },
  gameCardTitle: { fontSize: theme.font.body, fontWeight: "700", color: theme.colors.text },
  loadingHint: { color: theme.colors.primary, fontWeight: "600" },
  emptyBox: { alignItems: "flex-start" },
  detailTitle: { fontSize: theme.font.heading, fontWeight: "700", color: theme.colors.text },
  instructions: { lineHeight: 22 },
  outlineBtn: {
    alignSelf: "flex-start",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.dashed,
  },
  outlineBtnText: { fontWeight: "600", color: theme.colors.text },
  sessionRow: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderMuted,
    paddingTop: theme.space.md,
    gap: 4,
  },
  sessionScore: { fontWeight: "700", color: theme.colors.text },
  catalogHeading: {
    fontSize: theme.font.heading,
    fontWeight: "700",
    color: theme.colors.text,
    marginTop: theme.space.md,
  },
  catalogHint: { marginBottom: theme.space.xs },
});
