import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import type { SubmissionDetail } from "@rema/contracts";

import { BodyText, MutedText } from "../../components/ui/BodyText";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { LoadingCenter } from "../../components/ui/LoadingCenter";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { Screen } from "../../components/ui/Screen";
import { SectionTitle } from "../../components/ui/Title";
import { useAuth } from "../../context/AuthContext";
import { apiReviewSubmission, apiSubmissionDetail } from "../../lib/api";
import { submissionStatusLabel } from "../../modules/activities/ui";
import type { ProfTarefasStackParamList } from "../../navigation/tarefasTypes";
import { theme } from "../../theme";

type Nav = NativeStackNavigationProp<ProfTarefasStackParamList, "ProfTarefasEnvio">;
type R = RouteProp<ProfTarefasStackParamList, "ProfTarefasEnvio">;

function formatDate(value: string | null) {
  if (!value) return "Sem data";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function ProfessorSubmissionReviewScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const { activityId, submissionId } = route.params;
  const { token } = useAuth();

  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [score, setScore] = useState("0");
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    if (!token) return;
    setError(null);
    apiSubmissionDetail(token, submissionId)
      .then((payload) => {
        setSubmission(payload);
        setScore(String(payload.score ?? 0));
        setComment(payload.feedback ?? "");
        navigation.setOptions({ title: `Envio #${payload.id}` });
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Falha ao carregar envio"));
  }, [token, submissionId, navigation]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handleReview() {
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      const reviewed = await apiReviewSubmission(token, submissionId, {
        score: Number(score),
        comment,
      });
      setSubmission(reviewed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao registrar correção");
    } finally {
      setSaving(false);
    }
  }

  if (!submission) {
    return (
      <Screen scroll={false}>
        {error ? <ErrorBanner message={error} /> : <LoadingCenter />}
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View style={styles.headerRow}>
        <View style={styles.flex}>
          <SectionTitle>Envio #{submission.id}</SectionTitle>
          <MutedText>
            Status {submissionStatusLabel(submission.status)}
            {submission.submittedAt ? ` · enviado em ${formatDate(submission.submittedAt)}` : ""}
            {typeof submission.score === "number" ? ` · nota ${submission.score}` : ""}
          </MutedText>
        </View>
        <Pressable onPress={() => navigation.navigate("ProfTarefasDetail", { activityId })}>
          <Text style={styles.link}>Voltar à tarefa</Text>
        </Pressable>
      </View>

      {error ? <ErrorBanner message={error} /> : null}

      {submission.answers?.length ? (
        <View style={styles.block}>
          {submission.answers.map((answer) => (
            <View key={answer.questionId} style={styles.panel}>
              <Text style={styles.panelTitle}>Resposta da questão {answer.questionId}</Text>
              <BodyText>
                {answer.answerText ||
                  `Opção selecionada: ${answer.selectedOptionId ?? "não informada"}`}
              </BodyText>
            </View>
          ))}
        </View>
      ) : null}

      {submission.files?.length ? (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Anexo da tarefa</Text>
          {submission.files.map((file) => (
            <MutedText key={file.id}>
              {file.fileName} ({file.fileType})
            </MutedText>
          ))}
        </View>
      ) : null}

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Correção</Text>
        <Text style={styles.label}>Nota</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={score}
          onChangeText={setScore}
        />
        <Text style={styles.label}>Comentário</Text>
        <TextInput
          style={styles.textArea}
          multiline
          numberOfLines={5}
          value={comment}
          onChangeText={setComment}
          placeholderTextColor={theme.colors.muted}
        />
        <PrimaryButton loading={saving} onPress={() => void handleReview()}>
          {saving ? "Salvando…" : "Registrar correção"}
        </PrimaryButton>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", gap: theme.space.md, marginBottom: theme.space.md, flexWrap: "wrap" },
  link: { color: theme.colors.primary, fontWeight: "600" },
  block: { gap: theme.space.md, marginBottom: theme.space.md },
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
  textArea: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: theme.colors.dashed,
    borderRadius: theme.radius.sm,
    padding: theme.space.md,
    fontSize: theme.font.body,
    color: theme.colors.text,
    textAlignVertical: "top",
  },
});
