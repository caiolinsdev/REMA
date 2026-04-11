import DateTimePicker from "@react-native-community/datetimepicker";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import type { ActivityDetail, QuestionInput, UpsertActivityRequest } from "@rema/contracts";

import { AppMediaImage } from "../../components/AppMediaImage";
import { BodyText, MutedText } from "../../components/ui/BodyText";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { LoadingCenter } from "../../components/ui/LoadingCenter";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { Screen } from "../../components/ui/Screen";
import { SectionTitle } from "../../components/ui/Title";
import { useAuth } from "../../context/AuthContext";
import { apiActivityDetail, apiCreateActivity, apiUpdateActivity, apiUploadMedia } from "../../lib/api";
import { pickImageForUpload } from "../../lib/mediaPick";
import { activityKindBehaviorLabel } from "../../modules/activities/ui";
import type { ProfTarefasStackParamList } from "../../navigation/tarefasTypes";
import { theme } from "../../theme";

type Nav = NativeStackNavigationProp<ProfTarefasStackParamList>;
type EditorRoute = RouteProp<ProfTarefasStackParamList, "ProfTarefasNova" | "ProfTarefasEditar">;

type FormQuestion = QuestionInput & { options: NonNullable<QuestionInput["options"]> };

function emptyQuestion(position: number): FormQuestion {
  return {
    statement: "",
    type: "dissertativa",
    weight: 0,
    position,
    supportImageUrl: "",
    expectedAnswer: "",
    options: [],
  };
}

function toFormQuestions(activity?: ActivityDetail): FormQuestion[] {
  return (
    activity?.questions?.map((question) => ({
      statement: question.statement,
      type: question.type,
      weight: question.weight,
      position: question.position,
      supportImageUrl: question.supportImageUrl ?? "",
      expectedAnswer: question.expectedAnswer ?? "",
      options:
        question.options?.map((option) => ({
          label: option.label,
          position: option.position,
          isCorrect: option.isCorrect ?? false,
        })) ?? [],
    })) ?? []
  );
}

function formatDueLabel(ms: number | null) {
  if (ms == null) return "Sem prazo — toque para definir";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(ms));
}

const KIND_OPTIONS: { value: "prova" | "atividade" | "trabalho"; label: string }[] = [
  { value: "prova", label: "Prova" },
  { value: "atividade", label: "Atividade" },
  { value: "trabalho", label: "Trabalho" },
];

export function ActivityEditorScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<EditorRoute>();
  const mode = route.name === "ProfTarefasEditar" ? "edit" : "create";
  const activityId =
    route.name === "ProfTarefasEditar" && route.params ? route.params.activityId : undefined;

  const { token } = useAuth();
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState<"prova" | "atividade" | "trabalho">("prova");
  const [dueAtMs, setDueAtMs] = useState<number | null>(null);
  const [showDuePicker, setShowDuePicker] = useState(false);
  const [showKindModal, setShowKindModal] = useState(false);
  const [questions, setQuestions] = useState<FormQuestion[]>([emptyQuestion(1)]);
  const [validationMessages, setValidationMessages] = useState<string[]>([]);
  const [uploadingSupportIndex, setUploadingSupportIndex] = useState<number | null>(null);

  useEffect(() => {
    if (mode !== "edit" || !activityId || !token) return;
    let cancelled = false;
    (async () => {
      try {
        const activity = await apiActivityDetail(token, activityId);
        if (cancelled) return;
        setTitle(activity.title);
        setDescription(activity.description);
        setKind(activity.kind);
        setDueAtMs(activity.dueAt ? new Date(activity.dueAt).getTime() : null);
        setQuestions(
          activity.kind === "trabalho"
            ? []
            : toFormQuestions(activity).length > 0
              ? toFormQuestions(activity)
              : [emptyQuestion(1)],
        );
        setValidationMessages(activity.validation?.issues.map((issue) => issue.message) ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Falha ao carregar tarefa");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activityId, mode, token]);

  const effectiveQuestions = useMemo(
    () =>
      kind === "trabalho" ? [] : questions.map((question, index) => ({ ...question, position: index + 1 })),
    [kind, questions],
  );

  function updateQuestion(index: number, patch: Partial<FormQuestion>) {
    setQuestions((current) =>
      current.map((question, currentIndex) =>
        currentIndex === index ? { ...question, ...patch } : question,
      ),
    );
  }

  function removeQuestion(index: number) {
    setQuestions((current) =>
      current
        .filter((_, currentIndex) => currentIndex !== index)
        .map((question, currentIndex) => ({ ...question, position: currentIndex + 1 })),
    );
  }

  async function handleSupportUpload(index: number) {
    if (!token) return;
    setUploadingSupportIndex(index);
    setError(null);
    try {
      const file = await pickImageForUpload();
      if (!file) return;
      const uploaded = await apiUploadMedia(token, file, "activity_support_image");
      updateQuestion(index, { supportImageUrl: uploaded.url });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao enviar imagem de apoio");
    } finally {
      setUploadingSupportIndex(null);
    }
  }

  async function onSubmit() {
    if (!token) return;

    const body: UpsertActivityRequest = {
      title,
      description,
      kind,
      dueAt: dueAtMs != null ? new Date(dueAtMs).toISOString() : null,
      totalScore: 100,
      questions: effectiveQuestions,
    };

    setSaving(true);
    setError(null);
    try {
      const activity =
        mode === "create"
          ? await apiCreateActivity(token, body)
          : await apiUpdateActivity(token, activityId!, body);
      setValidationMessages(activity.validation?.issues.map((issue) => issue.message) ?? []);
      navigation.navigate("ProfTarefasDetail", { activityId: activity.id });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar tarefa");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Screen scroll={false}>
        <LoadingCenter />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <SectionTitle>{mode === "create" ? "Nova tarefa" : "Editar tarefa"}</SectionTitle>
      <MutedText style={styles.lead}>
        A tarefa nasce em rascunho. A publicação só acontece depois das validações de pontuação.
      </MutedText>

      {error ? <ErrorBanner message={error} /> : null}

      {validationMessages.length > 0 ? (
        <View style={styles.validationBox}>
          <Text style={styles.validationTitle}>Resumo de validação</Text>
          {validationMessages.map((message) => (
            <Text key={message} style={styles.validationItem}>
              • {message}
            </Text>
          ))}
        </View>
      ) : null}

      <View style={styles.panel}>
        <Text style={styles.label}>Título</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Título" />

        <Text style={styles.label}>Formato interno</Text>
        <Pressable style={styles.selectBtn} onPress={() => setShowKindModal(true)}>
          <Text style={styles.selectBtnText}>
            {KIND_OPTIONS.find((k) => k.value === kind)?.label ?? kind}
          </Text>
        </Pressable>
        <Modal visible={showKindModal} transparent animationType="fade">
          <Pressable style={styles.modalBackdrop} onPress={() => setShowKindModal(false)}>
            <View style={styles.modalCard}>
              {KIND_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  style={styles.modalRow}
                  onPress={() => {
                    setKind(opt.value);
                    setShowKindModal(false);
                    if (opt.value === "trabalho") {
                      setQuestions([]);
                    } else if (questions.length === 0) {
                      setQuestions([emptyQuestion(1)]);
                    }
                  }}
                >
                  <Text style={styles.modalRowText}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Modal>

        <BodyText>
          Comportamento: <Text style={styles.bold}>{activityKindBehaviorLabel(kind)}</Text>
        </BodyText>

        <Text style={styles.label}>Prazo</Text>
        <Pressable style={styles.selectBtn} onPress={() => setShowDuePicker(true)}>
          <Text style={styles.selectBtnText}>{formatDueLabel(dueAtMs)}</Text>
        </Pressable>
        {Platform.OS === "android" && showDuePicker ? (
          <DateTimePicker
            value={dueAtMs != null ? new Date(dueAtMs) : new Date()}
            mode="datetime"
            display="default"
            onChange={(event, date) => {
              setShowDuePicker(false);
              if (event.type === "set" && date) {
                setDueAtMs(date.getTime());
              }
            }}
          />
        ) : null}
        <Modal visible={Platform.OS === "ios" && showDuePicker} transparent animationType="slide">
          <View style={styles.dateModalRoot}>
            <Pressable style={styles.dateModalFill} onPress={() => setShowDuePicker(false)} />
            <View style={styles.modalCard}>
              <DateTimePicker
                value={dueAtMs != null ? new Date(dueAtMs) : new Date()}
                mode="datetime"
                display="spinner"
                onChange={(_, date) => {
                  if (date) setDueAtMs(date.getTime());
                }}
              />
              <PrimaryButton onPress={() => setShowDuePicker(false)}>Concluir prazo</PrimaryButton>
            </View>
          </View>
        </Modal>

        <Text style={styles.label}>Descrição</Text>
        <TextInput
          style={styles.textArea}
          value={description}
          onChangeText={setDescription}
          multiline
          placeholder="Descrição da tarefa"
          placeholderTextColor={theme.colors.muted}
        />

        <Text style={styles.label}>Pontuação total</Text>
        <TextInput style={styles.inputDisabled} value="100" editable={false} />
      </View>

      {kind !== "trabalho" ? (
        <View style={styles.panel}>
          <View style={styles.qHead}>
            <View>
              <Text style={styles.panelTitle}>Questões</Text>
              <MutedText>A soma dos pesos deve fechar em 100 para publicar.</MutedText>
            </View>
            <Pressable
              style={styles.smallBtn}
              onPress={() => setQuestions((current) => [...current, emptyQuestion(current.length + 1)])}
            >
              <Text style={styles.smallBtnText}>Adicionar</Text>
            </Pressable>
          </View>

          {questions.map((question, index) => (
            <View key={`q-${index}`} style={styles.questionCard}>
              <View style={styles.qTitleRow}>
                <Text style={styles.bold}>Questão {index + 1}</Text>
                <Pressable onPress={() => removeQuestion(index)}>
                  <Text style={styles.remove}>Remover</Text>
                </Pressable>
              </View>

              <Text style={styles.label}>Enunciado</Text>
              <TextInput
                style={styles.textArea}
                value={question.statement}
                onChangeText={(t) => updateQuestion(index, { statement: t })}
                multiline
                placeholderTextColor={theme.colors.muted}
              />

              <Text style={styles.label}>Tipo</Text>
              <View style={styles.rowGap}>
                {(["dissertativa", "multipla_escolha"] as const).map((t) => (
                  <Pressable
                    key={t}
                    style={[styles.chip, question.type === t && styles.chipOn]}
                    onPress={() =>
                      updateQuestion(index, {
                        type: t,
                        options:
                          t === "multipla_escolha"
                            ? question.options.length > 0
                              ? question.options
                              : [
                                  { label: "", position: 1, isCorrect: false },
                                  { label: "", position: 2, isCorrect: false },
                                ]
                            : [],
                      })
                    }
                  >
                    <Text style={question.type === t ? styles.chipOnText : styles.chipText}>
                      {t === "dissertativa" ? "Dissertativa" : "Múltipla escolha"}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.label}>Peso</Text>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                value={String(question.weight)}
                onChangeText={(t) => updateQuestion(index, { weight: Number(t) || 0 })}
              />

              <Text style={styles.label}>Imagem de apoio</Text>
              {question.supportImageUrl ? (
                <AppMediaImage
                  src={question.supportImageUrl}
                  style={styles.supportPreview}
                  resizeMode="contain"
                />
              ) : null}
              <Pressable
                style={styles.smallBtn}
                disabled={uploadingSupportIndex === index}
                onPress={() => void handleSupportUpload(index)}
              >
                <Text style={styles.smallBtnText}>
                  {uploadingSupportIndex === index ? "Enviando…" : "Escolher imagem (png, jpeg, webp)"}
                </Text>
              </Pressable>
              <Pressable
                style={styles.smallBtn}
                disabled={!question.supportImageUrl || uploadingSupportIndex === index}
                onPress={() => updateQuestion(index, { supportImageUrl: "" })}
              >
                <Text style={styles.smallBtnText}>Remover imagem</Text>
              </Pressable>

              <Text style={styles.label}>Resposta esperada / gabarito</Text>
              <TextInput
                style={styles.textArea}
                value={question.expectedAnswer ?? ""}
                onChangeText={(t) => updateQuestion(index, { expectedAnswer: t })}
                multiline
                placeholderTextColor={theme.colors.muted}
              />

              {question.type === "multipla_escolha" ? (
                <View style={styles.optionsBlock}>
                  <Text style={styles.bold}>Opções</Text>
                  {question.options.map((option, optionIndex) => (
                    <View key={`o-${optionIndex}`} style={styles.optionRow}>
                      <TextInput
                        style={[styles.input, styles.optionInput]}
                        value={option.label}
                        onChangeText={(t) => {
                          const nextOptions = question.options.map((o, i) =>
                            i === optionIndex ? { ...o, label: t } : o,
                          );
                          updateQuestion(index, { options: nextOptions });
                        }}
                        placeholder={`Opção ${optionIndex + 1}`}
                        placeholderTextColor={theme.colors.muted}
                      />
                      <View style={styles.switchRow}>
                        <Text style={styles.switchLabel}>Correta</Text>
                        <Switch
                          value={option.isCorrect ?? false}
                          onValueChange={(v) => {
                            const nextOptions = question.options.map((o, i) =>
                              i === optionIndex ? { ...o, isCorrect: v } : o,
                            );
                            updateQuestion(index, { options: nextOptions });
                          }}
                        />
                      </View>
                      <Pressable
                        onPress={() => {
                          const nextOptions = question.options
                            .filter((_, i) => i !== optionIndex)
                            .map((o, i) => ({ ...o, position: i + 1 }));
                          updateQuestion(index, { options: nextOptions });
                        }}
                      >
                        <Text style={styles.remove}>Remover</Text>
                      </Pressable>
                    </View>
                  ))}
                  <Pressable
                    style={styles.smallBtn}
                    disabled={question.options.length >= 5}
                    onPress={() =>
                      updateQuestion(index, {
                        options: [
                          ...question.options,
                          { label: "", position: question.options.length + 1, isCorrect: false },
                        ],
                      })
                    }
                  >
                    <Text style={styles.smallBtnText}>Adicionar opção</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Trabalho</Text>
          <MutedText>
            Nesta versão, tarefas com anexo usam descrição e prazo, sem editor de questões no app.
          </MutedText>
        </View>
      )}

      <View style={styles.footer}>
        <PrimaryButton loading={saving} onPress={() => void onSubmit()}>
          {saving ? "Salvando…" : mode === "create" ? "Criar rascunho" : "Salvar alterações"}
        </PrimaryButton>
        <Pressable style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancelar</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: { marginBottom: theme.space.md },
  validationBox: {
    backgroundColor: "#fffbeb",
    borderWidth: 1,
    borderColor: "#fde68a",
    borderRadius: theme.radius.lg,
    padding: theme.space.md,
    marginBottom: theme.space.md,
  },
  validationTitle: { fontWeight: "700", marginBottom: theme.space.xs },
  validationItem: { color: theme.colors.textSecondary, marginBottom: 2 },
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
  label: { fontWeight: "600", color: theme.colors.text, marginTop: theme.space.xs },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.dashed,
    borderRadius: theme.radius.sm,
    padding: theme.space.md,
    fontSize: theme.font.body,
    color: theme.colors.text,
  },
  inputDisabled: {
    borderWidth: 1,
    borderColor: theme.colors.dashed,
    borderRadius: theme.radius.sm,
    padding: theme.space.md,
    backgroundColor: theme.colors.bg,
    color: theme.colors.muted,
  },
  textArea: {
    minHeight: 80,
    borderWidth: 1,
    borderColor: theme.colors.dashed,
    borderRadius: theme.radius.sm,
    padding: theme.space.md,
    fontSize: theme.font.body,
    color: theme.colors.text,
    textAlignVertical: "top",
  },
  selectBtn: {
    borderWidth: 1,
    borderColor: theme.colors.dashed,
    borderRadius: theme.radius.sm,
    padding: theme.space.md,
  },
  selectBtnText: { color: theme.colors.text, fontSize: theme.font.body },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: theme.space.xl,
  },
  dateModalRoot: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  dateModalFill: { flex: 1 },
  modalCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.space.sm,
  },
  modalRow: { padding: theme.space.md },
  modalRowText: { fontSize: theme.font.body, color: theme.colors.text },
  bold: { fontWeight: "700" },
  qHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: theme.space.md,
    marginBottom: theme.space.md,
  },
  smallBtn: {
    borderWidth: 1,
    borderColor: theme.colors.dashed,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.radius.sm,
    alignSelf: "flex-start",
  },
  smallBtnText: { fontWeight: "600", color: theme.colors.text },
  questionCard: {
    borderWidth: 1,
    borderColor: theme.colors.borderMuted,
    borderRadius: theme.radius.md,
    padding: theme.space.md,
    marginBottom: theme.space.md,
    gap: theme.space.sm,
  },
  qTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  remove: { color: theme.colors.errorText, fontWeight: "600" },
  rowGap: { flexDirection: "row", gap: theme.space.sm, flexWrap: "wrap" },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.dashed,
  },
  chipOn: { borderColor: theme.colors.primary, backgroundColor: "#eff6ff" },
  chipText: { color: theme.colors.text },
  chipOnText: { color: theme.colors.primary, fontWeight: "700" },
  supportPreview: { width: "100%", height: 160, borderRadius: theme.radius.md },
  optionsBlock: { gap: theme.space.sm, marginTop: theme.space.sm },
  optionRow: { gap: theme.space.sm, marginBottom: theme.space.sm },
  optionInput: { marginBottom: 0 },
  switchRow: { flexDirection: "row", alignItems: "center", gap: theme.space.sm },
  switchLabel: { color: theme.colors.text },
  footer: { gap: theme.space.sm, marginBottom: theme.space.xl },
  cancelBtn: {
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.dashed,
    borderRadius: theme.radius.sm,
  },
  cancelText: { fontWeight: "600", color: theme.colors.text },
});
