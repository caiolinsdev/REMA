import { useCallback, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import type { ActivityDetail, SubmissionListItem } from "@rema/contracts";

import { BodyText, MutedText } from "../../components/ui/BodyText";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { LoadingCenter } from "../../components/ui/LoadingCenter";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { Screen } from "../../components/ui/Screen";
import { SectionTitle } from "../../components/ui/Title";
import { useAuth } from "../../context/AuthContext";
import { apiActivityDetail, apiActivitySubmissions, apiPublishActivity } from "../../lib/api";
import { resolveMediaUrl } from "../../lib/mediaUrl";
import {
  activityKindBehaviorLabel,
  activityStatusLabel,
  questionTypeLabel,
  submissionStatusLabel,
} from "../../modules/activities/ui";
import type { ProfTarefasStackParamList } from "../../navigation/tarefasTypes";
import { theme } from "../../theme";

type Nav = NativeStackNavigationProp<ProfTarefasStackParamList, "ProfTarefasDetail">;
type R = RouteProp<ProfTarefasStackParamList, "ProfTarefasDetail">;

function formatDate(value: string | null) {
  if (!value) return "Sem prazo";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function ProfessorActivityDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const { activityId } = route.params;
  const { token } = useAuth();

  const [activity, setActivity] = useState<ActivityDetail | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  const load = useCallback(() => {
    if (!token) return;
    setError(null);
    apiActivityDetail(token, activityId)
      .then((a) => {
        setActivity(a);
        navigation.setOptions({ title: a.title });
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Falha ao carregar tarefa"));
    apiActivitySubmissions(token, activityId)
      .then(setSubmissions)
      .catch(() => {});
  }, [token, activityId, navigation]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function handlePublish() {
    if (!token) return;
    setPublishing(true);
    setError(null);
    try {
      const updated = await apiPublishActivity(token, activityId);
      setActivity(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao publicar tarefa");
    } finally {
      setPublishing(false);
    }
  }

  if (!activity) {
    return (
      <Screen scroll={false}>
        {error ? <ErrorBanner message={error} /> : <LoadingCenter />}
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View style={styles.topRow}>
        <View style={styles.flex}>
          <SectionTitle>{activity.title}</SectionTitle>
          <MutedText style={styles.meta}>
            {activityKindBehaviorLabel(activity.kind)} · {activityStatusLabel(activity.status)} · prazo{" "}
            {formatDate(activity.dueAt)} · total {activity.totalScore}
          </MutedText>
        </View>
        <View style={styles.actions}>
          {activity.status === "draft" ? (
            <Pressable
              style={styles.secondaryBtn}
              onPress={() => navigation.navigate("ProfTarefasEditar", { activityId })}
            >
              <Text style={styles.secondaryBtnText}>Editar</Text>
            </Pressable>
          ) : null}
          {activity.status === "draft" ? (
            <PrimaryButton loading={publishing} onPress={() => void handlePublish()}>
              {publishing ? "Publicando…" : "Publicar"}
            </PrimaryButton>
          ) : null}
        </View>
      </View>

      {error ? <ErrorBanner message={error} /> : null}

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Descrição</Text>
        <BodyText>{activity.description || "Sem descrição."}</BodyText>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Validação</Text>
        {activity.validation?.issues.length ? (
          <View>
            {activity.validation.issues.map((issue) => (
              <Text key={`${issue.code}-${issue.message}`} style={styles.issue}>
                • {issue.message}
              </Text>
            ))}
          </View>
        ) : (
          <BodyText style={styles.ok}>Pronto para publicar.</BodyText>
        )}
      </View>

      {activity.kind !== "trabalho" ? (
        <View style={styles.questions}>
          {activity.questions?.map((question) => {
            const img = resolveMediaUrl(question.supportImageUrl);
            return (
              <View key={question.id} style={styles.panel}>
                <Text style={styles.panelTitle}>Questão {question.position}</Text>
                <BodyText>{question.statement}</BodyText>
                <MutedText>
                  {questionTypeLabel(question.type)} · peso {question.weight}
                </MutedText>
                {img ? <Image source={{ uri: img }} style={styles.supportImg} resizeMode="contain" /> : null}
                {question.options?.length ? (
                  <View style={styles.bullet}>
                    {question.options.map((option) => (
                      <Text key={option.id} style={styles.bulletItem}>
                        • {option.label}
                        {option.isCorrect ? " (correta)" : ""}
                      </Text>
                    ))}
                  </View>
                ) : null}
                <BodyText>
                  <Text style={styles.bold}>Gabarito esperado:</Text>{" "}
                  {question.expectedAnswer || "Não informado."}
                </BodyText>
              </View>
            );
          })}
          {activity.questions?.length === 0 ? (
            <View style={styles.empty}>
              <MutedText>Nenhuma questão cadastrada ainda.</MutedText>
            </View>
          ) : null}
        </View>
      ) : (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Entrega com anexo</Text>
          <MutedText>
            Esta tarefa usa descrição e prazo, sem estrutura de questões nesta fase.
          </MutedText>
        </View>
      )}

      {activity.status !== "draft" ? (
        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Envios dos alunos</Text>
          {submissions.map((submission) => (
            <View key={submission.id} style={styles.subCard}>
              <View style={styles.subRow}>
                <View style={styles.flex}>
                  <Text style={styles.bold}>{submission.studentName}</Text>
                  <MutedText>
                    {submissionStatusLabel(submission.status)}
                    {submission.submittedAt ? ` · enviado em ${formatDate(submission.submittedAt)}` : ""}
                    {typeof submission.score === "number" ? ` · nota ${submission.score}` : ""}
                  </MutedText>
                </View>
                <Pressable
                  onPress={() =>
                    navigation.navigate("ProfTarefasEnvio", {
                      activityId,
                      submissionId: submission.id,
                    })
                  }
                >
                  <Text style={styles.link}>Abrir envio</Text>
                </Pressable>
              </View>
            </View>
          ))}
          {submissions.length === 0 ? (
            <MutedText>Nenhum envio recebido ainda.</MutedText>
          ) : null}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topRow: { gap: theme.space.md, marginBottom: theme.space.md },
  meta: { marginTop: theme.space.xs },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: theme.space.sm },
  secondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.dashed,
    justifyContent: "center",
  },
  secondaryBtnText: { color: theme.colors.text, fontWeight: "600" },
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
  issue: { color: theme.colors.textSecondary, marginBottom: 4 },
  ok: { color: "#166534" },
  questions: { marginBottom: theme.space.md },
  supportImg: { width: "100%", height: 160, borderRadius: theme.radius.md },
  bullet: { marginTop: theme.space.xs },
  bulletItem: { color: theme.colors.text, marginBottom: 4 },
  bold: { fontWeight: "700", color: theme.colors.text },
  empty: {
    borderWidth: 1,
    borderColor: theme.colors.dashed,
    borderStyle: "dashed",
    borderRadius: theme.radius.lg,
    padding: theme.space.lg,
  },
  subCard: {
    borderWidth: 1,
    borderColor: theme.colors.borderMuted,
    borderRadius: theme.radius.md,
    padding: theme.space.md,
    marginBottom: theme.space.sm,
  },
  subRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: theme.space.sm },
  link: { color: theme.colors.primary, fontWeight: "600" },
});
