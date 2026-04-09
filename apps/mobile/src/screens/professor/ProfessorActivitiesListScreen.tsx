import { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import type { ActivitySummary } from "@rema/contracts";

import { BodyText, MutedText } from "../../components/ui/BodyText";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { LoadingCenter } from "../../components/ui/LoadingCenter";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { Screen } from "../../components/ui/Screen";
import { SectionTitle } from "../../components/ui/Title";
import { useAuth } from "../../context/AuthContext";
import { apiActivities } from "../../lib/api";
import { activityKindBehaviorLabel, activityStatusLabel } from "../../modules/activities/ui";
import type { ProfTarefasStackParamList } from "../../navigation/tarefasTypes";
import { theme } from "../../theme";

type Nav = NativeStackNavigationProp<ProfTarefasStackParamList, "ProfTarefasList">;

function formatDate(value: string | null) {
  if (!value) return "Sem prazo";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function ProfessorActivitiesListScreen() {
  const navigation = useNavigation<Nav>();
  const { token } = useAuth();
  const [activities, setActivities] = useState<ActivitySummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    apiActivities(token)
      .then(setActivities)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Falha ao carregar tarefas"),
      )
      .finally(() => setLoading(false));
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading && activities.length === 0) {
    return (
      <Screen scroll={false}>
        <LoadingCenter />
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <View style={styles.head}>
        <View style={styles.headText}>
          <SectionTitle>Tarefas</SectionTitle>
          <BodyText>Área do professor para criar, editar rascunhos e publicar tarefas.</BodyText>
        </View>
      </View>
      <PrimaryButton onPress={() => navigation.navigate("ProfTarefasNova")}>Nova tarefa</PrimaryButton>
      {error ? <ErrorBanner message={error} /> : null}

      <FlatList
        style={styles.flexList}
        data={activities}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !error ? (
            <View style={styles.empty}>
              <MutedText>Nenhuma tarefa criada ainda.</MutedText>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
            onPress={() => navigation.navigate("ProfTarefasDetail", { activityId: item.id })}
          >
            <View style={styles.cardRow}>
              <View style={styles.flex}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <MutedText>
                  {activityKindBehaviorLabel(item.kind)} · {activityStatusLabel(item.status)} · prazo{" "}
                  {formatDate(item.dueAt)}
                </MutedText>
              </View>
              <View style={styles.cardAside}>
                <Text style={styles.score}>Total: {item.totalScore}</Text>
                <Text style={styles.link}>Abrir</Text>
              </View>
            </View>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flexList: { flex: 1 },
  head: { marginBottom: theme.space.md },
  headText: { marginBottom: theme.space.sm },
  flex: { flex: 1 },
  list: { paddingBottom: theme.space.xl, gap: theme.space.md, marginTop: theme.space.md },
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.space.lg,
    marginBottom: theme.space.sm,
  },
  cardPressed: { opacity: 0.92 },
  cardRow: { flexDirection: "row", justifyContent: "space-between", gap: theme.space.md, flexWrap: "wrap" },
  cardTitle: { fontSize: theme.font.heading, fontWeight: "700", color: theme.colors.text, marginBottom: theme.space.xs },
  cardAside: { alignItems: "flex-end", gap: 4 },
  score: { color: theme.colors.text, fontWeight: "600" },
  link: { color: theme.colors.primary, fontWeight: "600" },
  empty: {
    borderWidth: 1,
    borderColor: theme.colors.dashed,
    borderStyle: "dashed",
    borderRadius: theme.radius.lg,
    padding: theme.space.lg,
  },
});
