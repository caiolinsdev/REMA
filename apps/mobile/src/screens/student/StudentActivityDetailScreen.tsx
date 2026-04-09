import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import type {
  ActivityDetail,
  SubmissionDetail,
  SubmissionFileInput,
  UpsertSubmissionRequest,
} from "@rema/contracts";

import { BodyText, MutedText } from "../../components/ui/BodyText";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { LoadingCenter } from "../../components/ui/LoadingCenter";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { Screen } from "../../components/ui/Screen";
import { SectionTitle } from "../../components/ui/Title";
import { useAuth } from "../../context/AuthContext";
import {
  apiActivityDetail,
  apiConfirmSubmission,
  apiCurrentSubmission,
  apiSaveSubmission,
} from "../../lib/api";
import { pickWorkSubmissionFile } from "../../lib/mediaPick";
import { resolveMediaUrl } from "../../lib/mediaUrl";
import {
  activityKindBehaviorLabel,
  activityStatusLabel,
  questionTypeLabel,
  submissionStatusLabel,
} from "../../modules/activities/ui";
import type { AlunoTarefasStackParamList } from "../../navigation/tarefasTypes";
import { theme } from "../../theme";

type Nav = NativeStackNavigationProp<AlunoTarefasStackParamList, "AlunoTarefasDetail">;
type R = RouteProp<AlunoTarefasStackParamList, "AlunoTarefasDetail">;

function formatDate(value: string | null) {
  if (!value) return "Sem prazo";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function getErrorStatus(error: unknown): number | undefined {
  return typeof error === "object" && error && "status" in error
    ? Number((error as { status?: number }).status)
    : undefined;
}

export function StudentActivityDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const { activityId } = route.params;
  const { token } = useAuth();

  const [activity, setActivity] = useState<ActivityDetail | null>(null);
  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<
    Record<string, { answerText?: string; selectedOptionId?: string }>
  >({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [workFile, setWorkFile] = useState<SubmissionFileInput | null>(null);
  const [pickingWork, setPickingWork] = useState(false);
  const submissionRef = useRef<SubmissionDetail | null>(null);
  submissionRef.current = submission;

  const load = useCallback(() => {
    if (!token) return;
    setError(null);
    apiActivityDetail(token, activityId)
      .then((a) => {
        setActivity(a);
        navigation.setOptions({ title: a.title });
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Falha ao carregar tarefa"));
    apiCurrentSubmission(token, activityId)
      .then(setSubmission)
      .catch((err) => {
        if (getErrorStatus(err) !== 404) {
          setError(err instanceof Error ? err.message : "Falha ao carregar envio");
        } else {
          setSubmission(null);
        }
      });
  }, [token, activityId, navigation]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!submission) return;
    const nextAnswers: Record<string, { answerText?: string; selectedOptionId?: string }> = {};
    submission.answers?.forEach((answer) => {
      nextAnswers[answer.questionId] = {
        answerText: answer.answerText ?? "",
        selectedOptionId: answer.selectedOptionId ?? undefined,
      };
    });
    setAnswers(nextAnswers);
  }, [submission]);

  useEffect(() => {
    if (!submission?.files?.length) {
      setWorkFile(null);
      return;
    }
    const f = submission.files[0];
    setWorkFile({ fileName: f.fileName, fileUrl: f.fileUrl, fileType: f.fileType });
  }, [submission]);

  const isLocked = submission?.status === "submitted" || submission?.status === "reviewed";
  const currentQuestion = activity?.questions?.[activeQuestionIndex] ?? null;

  const completionSummary = useMemo(() => {
    if (!activity || activity.kind === "trabalho") return null;
    const total = activity.questions?.length ?? 0;
    const answered =
      activity.questions?.filter((question) => {
        const draft = answers[question.id];
        return Boolean(draft?.answerText?.trim() || draft?.selectedOptionId);
      }).length ?? 0;
    return { total, answered };
  }, [activity, answers]);

  function buildSubmissionBody(): UpsertSubmissionRequest {
    if (!activity) return {};
    if (activity.kind === "trabalho") {
      return { files: workFile ? [workFile] : [] };
    }
    return {
      answers:
        activity.questions?.map((question) => ({
          questionId: question.id,
          answerText: answers[question.id]?.answerText ?? "",
          selectedOptionId: answers[question.id]?.selectedOptionId ?? null,
        })) ?? [],
    };
  }

  async function saveDraft(): Promise<SubmissionDetail | null> {
    if (!token || !activity) return null;
    setSaving(true);
    setError(null);
    try {
      const nextSubmission = await apiSaveSubmission(token, activity.id, buildSubmissionBody());
      setSubmission(nextSubmission);
      return nextSubmission;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar envio");
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function confirmSubmission() {
    if (!activity || !token) return;
    Alert.alert(
      "Confirmar envio",
      "Depois de confirmar o envio, não será possível editar ou reenviar. Deseja continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          style: "destructive",
          onPress: async () => {
            setConfirming(true);
            setError(null);
            try {
              let ensured = submissionRef.current;
              if (!ensured) ensured = await saveDraft();
              if (!ensured) return;
              const confirmed = await apiConfirmSubmission(token, ensured.id);
              setSubmission(confirmed);
            } catch (err) {
              setError(err instanceof Error ? err.message : "Falha ao confirmar envio");
            } finally {
              setConfirming(false);
            }
          },
        },
      ],
    );
  }

  if (!activity) {
    return (
      <Screen scroll={false}>
        {error ? <ErrorBanner message={error} /> : <LoadingCenter />}
      </Screen>
    );
  }

  const supportUri = currentQuestion?.supportImageUrl
    ? resolveMediaUrl(currentQuestion.supportImageUrl)
    : null;

  return (
    <Screen scroll>
      <SectionTitle>{activity.title}</SectionTitle>
      <MutedText style={styles.meta}>
        {activityKindBehaviorLabel(activity.kind)} · {activityStatusLabel(activity.status)} · prazo{" "}
        {formatDate(activity.dueAt)} · pontuação total {activity.totalScore}
      </MutedText>

      {submission ? (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Meu envio</Text>
          <BodyText>
            Status: <Text style={styles.bold}>{submissionStatusLabel(submission.status)}</Text>
            {submission.submittedAt ? ` · enviado em ${formatDate(submission.submittedAt)}` : ""}
            {typeof submission.score === "number" ? ` · nota ${submission.score}` : ""}
          </BodyText>
          {submission.feedback ? (
            <BodyText style={styles.feedback}>
              <Text style={styles.bold}>Retorno do professor:</Text> {submission.feedback}
            </BodyText>
          ) : submission.status === "submitted" ? (
            <MutedText>Seu envio foi confirmado e aguarda correção do professor.</MutedText>
          ) : null}
        </View>
      ) : null}

      {error ? <ErrorBanner message={error} /> : null}

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Descrição</Text>
        <BodyText>{activity.description || "Sem descrição."}</BodyText>
      </View>

      {activity.kind !== "trabalho" ? (
        <>
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Resolução</Text>
            <MutedText>
              Navegue entre as questões, salve em andamento e confirme quando tiver certeza.
              {completionSummary
                ? ` Respondidas: ${completionSummary.answered}/${completionSummary.total}.`
                : ""}
            </MutedText>
          </View>

          {currentQuestion ? (
            <View style={styles.panel}>
              <Text style={styles.panelTitle}>Questão {currentQuestion.position}</Text>
              <BodyText>{currentQuestion.statement}</BodyText>
              <MutedText>
                {questionTypeLabel(currentQuestion.type)} · peso {currentQuestion.weight}
              </MutedText>
              {supportUri ? (
                <Image source={{ uri: supportUri }} style={styles.supportImg} resizeMode="contain" />
              ) : null}

              {currentQuestion.type === "multipla_escolha" ? (
                <View style={styles.options}>
                  {currentQuestion.options?.map((option) => (
                    <Pressable
                      key={option.id}
                      style={[
                        styles.optionRow,
                        answers[currentQuestion.id]?.selectedOptionId === option.id && styles.optionSelected,
                      ]}
                      onPress={() => {
                        if (isLocked) return;
                        setAnswers((c) => ({
                          ...c,
                          [currentQuestion.id]: {
                            selectedOptionId: option.id,
                            answerText: "",
                          },
                        }));
                      }}
                      disabled={isLocked}
                    >
                      <Text style={styles.optionText}>{option.label}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <TextInput
                  style={styles.textArea}
                  multiline
                  numberOfLines={6}
                  editable={!isLocked}
                  value={answers[currentQuestion.id]?.answerText ?? ""}
                  onChangeText={(text) =>
                    setAnswers((c) => ({
                      ...c,
                      [currentQuestion.id]: { ...c[currentQuestion.id], answerText: text, selectedOptionId: undefined },
                    }))
                  }
                  placeholder="Sua resposta"
                  placeholderTextColor={theme.colors.muted}
                />
              )}

              <View style={styles.navRow}>
                <Pressable
                  style={[styles.secondaryBtn, activeQuestionIndex === 0 && styles.btnDisabled]}
                  disabled={activeQuestionIndex === 0}
                  onPress={() => setActiveQuestionIndex((i) => Math.max(0, i - 1))}
                >
                  <Text style={styles.secondaryBtnText}>Questão anterior</Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.secondaryBtn,
                    activeQuestionIndex >= (activity.questions?.length ?? 1) - 1 && styles.btnDisabled,
                  ]}
                  disabled={activeQuestionIndex >= (activity.questions?.length ?? 1) - 1}
                  onPress={() =>
                    setActiveQuestionIndex((i) =>
                      Math.min((activity.questions?.length ?? 1) - 1, i + 1),
                    )
                  }
                >
                  <Text style={styles.secondaryBtnText}>Próxima questão</Text>
                </Pressable>
              </View>
            </View>
          ) : null}

          {!isLocked ? (
            <View style={styles.actions}>
              <Pressable
                style={[styles.secondaryBtn, styles.fullWidth, (saving || confirming) && styles.btnDisabled]}
                disabled={saving || confirming}
                onPress={() => void saveDraft()}
              >
                <Text style={styles.secondaryBtnTextCenter}>
                  {saving ? "Salvando…" : "Salvar em andamento"}
                </Text>
              </Pressable>
              <PrimaryButton
                loading={confirming}
                disabled={saving}
                onPress={() => void confirmSubmission()}
              >
                {confirming ? "Confirmando…" : "Confirmar envio único"}
              </PrimaryButton>
            </View>
          ) : null}
        </>
      ) : (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Entrega com anexo</Text>
          <MutedText>Formatos aceitos: pdf, doc, docx ou txt.</MutedText>
          {workFile ? (
            <BodyText>
              <Text style={styles.bold}>Arquivo:</Text> {workFile.fileName}
            </BodyText>
          ) : (
            <MutedText>Nenhum arquivo selecionado.</MutedText>
          )}
          {!isLocked ? (
            <View style={styles.workActions}>
              <Pressable
                style={[styles.secondaryBtn, styles.fullWidth, pickingWork && styles.btnDisabled]}
                disabled={pickingWork}
                onPress={async () => {
                  setPickingWork(true);
                  try {
                    const picked = await pickWorkSubmissionFile();
                    if (picked) {
                      setWorkFile({
                        fileName: picked.fileName,
                        fileUrl: picked.fileUrl,
                        fileType: picked.fileType,
                      });
                    }
                  } finally {
                    setPickingWork(false);
                  }
                }}
              >
                <Text style={styles.secondaryBtnTextCenter}>
                  {pickingWork ? "Abrindo seletor…" : "Escolher arquivo"}
                </Text>
              </Pressable>
              <Pressable
                style={[styles.secondaryBtn, styles.fullWidth, !workFile && styles.btnDisabled]}
                disabled={!workFile}
                onPress={() => setWorkFile(null)}
              >
                <Text style={styles.secondaryBtnTextCenter}>Remover arquivo</Text>
              </Pressable>
            </View>
          ) : null}
          {!isLocked ? (
            <View style={styles.actions}>
              <Pressable
                style={[styles.secondaryBtn, styles.fullWidth, (saving || confirming) && styles.btnDisabled]}
                disabled={saving || confirming}
                onPress={() => void saveDraft()}
              >
                <Text style={styles.secondaryBtnTextCenter}>
                  {saving ? "Salvando…" : "Salvar em andamento"}
                </Text>
              </Pressable>
              <PrimaryButton
                loading={confirming}
                disabled={saving}
                onPress={() => void confirmSubmission()}
              >
                {confirming ? "Confirmando…" : "Confirmar envio único"}
              </PrimaryButton>
            </View>
          ) : null}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  meta: { marginBottom: theme.space.md },
  panel: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.space.lg,
    marginBottom: theme.space.md,
    gap: theme.space.sm,
  },
  panelTitle: { fontSize: theme.font.heading, fontWeight: "700", color: theme.colors.text },
  bold: { fontWeight: "700" },
  feedback: { marginTop: theme.space.xs },
  supportImg: { width: "100%", height: 180, borderRadius: theme.radius.md, marginTop: theme.space.sm },
  options: { gap: theme.space.sm, marginTop: theme.space.sm },
  optionRow: {
    padding: theme.space.md,
    borderWidth: 1,
    borderColor: theme.colors.borderMuted,
    borderRadius: theme.radius.sm,
  },
  optionSelected: { borderColor: theme.colors.primary, backgroundColor: "#eff6ff" },
  optionText: { color: theme.colors.text, fontSize: theme.font.body },
  textArea: {
    marginTop: theme.space.sm,
    minHeight: 120,
    borderWidth: 1,
    borderColor: theme.colors.dashed,
    borderRadius: theme.radius.md,
    padding: theme.space.md,
    fontSize: theme.font.body,
    color: theme.colors.text,
    textAlignVertical: "top",
  },
  navRow: { flexDirection: "row", justifyContent: "space-between", gap: theme.space.sm, marginTop: theme.space.md, flexWrap: "wrap" },
  secondaryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.dashed,
    backgroundColor: theme.colors.surface,
  },
  secondaryBtnText: { color: theme.colors.text, fontWeight: "600" },
  secondaryBtnTextCenter: { color: theme.colors.text, fontWeight: "600", textAlign: "center" },
  fullWidth: { alignSelf: "stretch", alignItems: "center", paddingVertical: 14 },
  btnDisabled: { opacity: 0.4 },
  actions: { gap: theme.space.sm, marginBottom: theme.space.xl },
  workActions: { gap: theme.space.sm, marginTop: theme.space.sm },
});
