import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import type { GameRuntimeResponse } from "@rema/contracts";

import { MutedText } from "../../components/ui/BodyText";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { theme } from "../../theme";

export type GameResultPayload = {
  score: number;
  progress: number;
  message: string;
};

type OnComplete = (result: GameResultPayload) => void;

const panel = {
  backgroundColor: theme.colors.surface,
  borderWidth: 1,
  borderColor: theme.colors.border,
  borderRadius: theme.radius.lg,
  padding: theme.space.lg,
  gap: theme.space.md,
} as const;

export function HangmanPlay({
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
    <View style={panel}>
      <View>
        <Text style={styles.gameTitle}>Forca</Text>
        <MutedText>
          Erros: {wrongGuesses.length}/{runtime.payload.maxAttempts}
        </MutedText>
      </View>
      <Text style={styles.maskedWord}>{maskedWord}</Text>
      <View style={styles.letterGrid}>
        {runtime.payload.alphabet.map((letter) => {
          const guessed = guessedLetters.includes(letter);
          return (
            <Pressable
              key={letter}
              style={[styles.letterBtn, guessed && styles.letterBtnUsed]}
              disabled={guessed || isFinished}
              onPress={() => setGuessedLetters((c) => [...c, letter])}
            >
              <Text style={styles.letterBtnText}>{letter.toUpperCase()}</Text>
            </Pressable>
          );
        })}
      </View>
      {isFinished ? (
        <View style={styles.finishBlock}>
          <Text style={[styles.finishText, { color: isWon ? "#166534" : "#b91c1c" }]}>
            {isWon
              ? `Você venceu. Palavra: ${word.toUpperCase()}.`
              : `Fim de jogo. A palavra era ${word.toUpperCase()}.`}
          </Text>
          <PrimaryButton disabled={submitted} onPress={registerResult}>
            {submitted ? "Resultado registrado" : "Registrar resultado"}
          </PrimaryButton>
        </View>
      ) : null}
    </View>
  );
}

export function SudokuPlay({
  runtime,
  onComplete,
}: {
  runtime: Extract<GameRuntimeResponse, { kind: "sudoku" }>;
  onComplete: OnComplete;
}) {
  const [board, setBoard] = useState(runtime.payload.puzzle.map((row) => [...row]));
  const [checked, setChecked] = useState<null | { correct: number; editable: number; solved: boolean }>(
    null,
  );
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
    <View style={panel}>
      <View>
        <Text style={styles.gameTitle}>Sudoku</Text>
        <MutedText>Dificuldade: {runtime.payload.difficulty}</MutedText>
      </View>
      <View style={styles.sudokuWrap}>
        {board.map((row, rowIndex) => (
          <View key={`r-${rowIndex}`} style={styles.sudokuRow}>
            {row.map((cell, colIndex) => {
              const isFixed = runtime.payload.puzzle[rowIndex][colIndex] !== 0;
              return (
                <TextInput
                  key={`c-${rowIndex}-${colIndex}`}
                  style={[styles.sudokuCell, isFixed && styles.sudokuFixed]}
                  value={cell === 0 ? "" : String(cell)}
                  editable={!isFixed}
                  onChangeText={(t) => updateCell(rowIndex, colIndex, t)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                />
              );
            })}
          </View>
        ))}
      </View>
      <View style={styles.rowBtns}>
        <PrimaryButton onPress={validateBoard}>Validar solução</PrimaryButton>
        {checked ? (
          <Pressable
            style={styles.outlineBtn}
            disabled={submitted}
            onPress={registerResult}
          >
            <Text style={styles.outlineBtnText}>
              {submitted ? "Resultado registrado" : "Registrar resultado"}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {checked ? (
        <Text style={{ color: checked.solved ? "#166534" : "#92400e" }}>
          {checked.solved
            ? "Sudoku resolvido corretamente."
            : `Você acertou ${checked.correct} de ${checked.editable} casas editáveis.`}
        </Text>
      ) : null}
    </View>
  );
}

export function QuizPlay({
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
    <View style={panel}>
      <View>
        <Text style={styles.gameTitle}>{title}</Text>
        <MutedText>Responda e envie o quiz para calcular o score.</MutedText>
      </View>
      {runtime.payload.questions.map((question, questionIndex) => (
        <View key={question.id} style={styles.quizCard}>
          <Text style={styles.quizPrompt}>
            {questionIndex + 1}. {question.prompt}
          </Text>
          {question.options.map((option) => {
            const isCorrect = submitted && option.id === question.correctOptionId;
            const isWrong =
              submitted &&
              answers[question.id] === option.id &&
              option.id !== question.correctOptionId;
            return (
              <Pressable
                key={option.id}
                style={[
                  styles.optionRow,
                  isCorrect && styles.optionCorrect,
                  isWrong && styles.optionWrong,
                ]}
                disabled={submitted}
                onPress={() => setAnswers((c) => ({ ...c, [question.id]: option.id }))}
              >
                <View style={[styles.radioOuter, answers[question.id] === option.id && styles.radioOn]} />
                <Text style={styles.optionLabel}>{option.label}</Text>
              </Pressable>
            );
          })}
        </View>
      ))}
      <View style={styles.rowBtns}>
        {!submitted ? (
          <PrimaryButton onPress={() => setSubmitted(true)}>Enviar quiz</PrimaryButton>
        ) : null}
        {submitted ? (
          <Pressable style={styles.outlineBtn} disabled={registered} onPress={registerResult}>
            <Text style={styles.outlineBtnText}>
              {registered ? "Resultado registrado" : "Registrar resultado"}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {result ? (
        <Text style={{ color: "#166534" }}>
          Você acertou {result.correct} de {result.total} perguntas. Score {result.score}.
        </Text>
      ) : null}
    </View>
  );
}

export function MazePlay({
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
    setMoves((c) => c + 1);
    setVisited((c) => ({ ...c, [`${next.row}-${next.col}`]: true }));
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

  const cellSize = 28;

  return (
    <View style={panel}>
      <View>
        <Text style={styles.gameTitle}>Labirinto</Text>
        <MutedText>Saia do início e alcance o objetivo verde.</MutedText>
      </View>
      <View style={[styles.mazeGrid, { width: runtime.payload.cols * cellSize }]}>
        {runtime.payload.cells.map((row, rowIndex) => (
          <View key={`mr-${rowIndex}`} style={styles.mazeRow}>
            {row.map((cell, colIndex) => {
              const isCurrent = position.row === rowIndex && position.col === colIndex;
              const isGoal =
                runtime.payload.goal.row === rowIndex && runtime.payload.goal.col === colIndex;
              const isVisited = visited[`${rowIndex}-${colIndex}`];
              return (
                <View
                  key={`mc-${rowIndex}-${colIndex}`}
                  style={[
                    styles.mazeCell,
                    {
                      width: cellSize,
                      height: cellSize,
                      borderTopWidth: cell.up ? 0 : 2,
                      borderRightWidth: cell.right ? 0 : 2,
                      borderBottomWidth: cell.down ? 0 : 2,
                      borderLeftWidth: cell.left ? 0 : 2,
                      backgroundColor: isCurrent ? "#2563eb" : isGoal ? "#22c55e" : isVisited ? "#e2e8f0" : "#fff",
                    },
                  ]}
                />
              );
            })}
          </View>
        ))}
      </View>
      <View style={styles.dirRow}>
        <Pressable style={styles.dirBtn} onPress={() => move("up")}>
          <Text>Cima</Text>
        </Pressable>
        <Pressable style={styles.dirBtn} onPress={() => move("left")}>
          <Text>Esquerda</Text>
        </Pressable>
        <Pressable style={styles.dirBtn} onPress={() => move("down")}>
          <Text>Baixo</Text>
        </Pressable>
        <Pressable style={styles.dirBtn} onPress={() => move("right")}>
          <Text>Direita</Text>
        </Pressable>
      </View>
      <MutedText>Movimentos: {moves}</MutedText>
      {reachedGoal ? (
        <View style={styles.finishBlock}>
          <Text style={[styles.finishText, { color: "#166534" }]}>
            Você encontrou a saída do labirinto.
          </Text>
          <PrimaryButton disabled={submitted} onPress={registerResult}>
            {submitted ? "Resultado registrado" : "Registrar resultado"}
          </PrimaryButton>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  gameTitle: { fontSize: theme.font.heading, fontWeight: "700", color: theme.colors.text },
  maskedWord: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 4,
    textAlign: "center",
    padding: theme.space.md,
    backgroundColor: theme.colors.bg,
    borderRadius: theme.radius.md,
    color: theme.colors.text,
  },
  letterGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center" },
  letterBtn: {
    minWidth: 40,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.dashed,
    alignItems: "center",
  },
  letterBtnUsed: { backgroundColor: "#dbeafe" },
  letterBtnText: { fontWeight: "700", color: theme.colors.text },
  finishBlock: { gap: theme.space.md },
  finishText: { fontWeight: "600" },
  sudokuWrap: { alignSelf: "center" },
  sudokuRow: { flexDirection: "row" },
  sudokuCell: {
    width: 34,
    height: 34,
    margin: 2,
    textAlign: "center",
    borderWidth: 1,
    borderColor: theme.colors.dashed,
    borderRadius: 6,
    fontWeight: "700",
    padding: 0,
    color: theme.colors.text,
  },
  sudokuFixed: { backgroundColor: "#eff6ff" },
  rowBtns: { gap: theme.space.sm },
  outlineBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.dashed,
    alignItems: "center",
  },
  outlineBtnText: { fontWeight: "600", color: theme.colors.text },
  quizCard: {
    borderWidth: 1,
    borderColor: theme.colors.borderMuted,
    borderRadius: theme.radius.md,
    padding: theme.space.md,
    gap: theme.space.sm,
  },
  quizPrompt: { fontWeight: "700", color: theme.colors.text },
  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space.sm,
    padding: theme.space.md,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.dashed,
  },
  optionCorrect: { backgroundColor: "#dcfce7", borderColor: "#86efac" },
  optionWrong: { backgroundColor: "#fee2e2", borderColor: "#fecaca" },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: theme.colors.dashed,
  },
  radioOn: { borderColor: theme.colors.primary, backgroundColor: "#dbeafe" },
  optionLabel: { flex: 1, color: theme.colors.text },
  mazeGrid: { alignSelf: "center" },
  mazeRow: { flexDirection: "row" },
  mazeCell: {
    borderColor: "#0f172a",
  },
  dirRow: { flexDirection: "row", flexWrap: "wrap", gap: theme.space.sm, justifyContent: "center" },
  dirBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.dashed,
    backgroundColor: theme.colors.surface,
  },
});
