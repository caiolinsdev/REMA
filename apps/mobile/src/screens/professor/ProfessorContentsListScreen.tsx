import { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import type { ContentSummary } from "@rema/contracts";

import { BodyText, MutedText } from "../../components/ui/BodyText";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { LoadingCenter } from "../../components/ui/LoadingCenter";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { Screen } from "../../components/ui/Screen";
import { SectionTitle } from "../../components/ui/Title";
import { useAuth } from "../../context/AuthContext";
import { apiContents } from "../../lib/api";
import type { ProfConteudosStackParamList } from "../../navigation/contentCalendarProfileTypes";
import { theme } from "../../theme";

type Nav = NativeStackNavigationProp<ProfConteudosStackParamList, "ProfConteudosList">;

function formatPublished(value: string | null) {
  if (!value) return "Não publicado";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function ProfessorContentsListScreen() {
  const navigation = useNavigation<Nav>();
  const { token } = useAuth();
  const [contents, setContents] = useState<ContentSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    apiContents(token)
      .then(setContents)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Falha ao carregar conteúdos"),
      )
      .finally(() => setLoading(false));
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (loading && contents.length === 0) {
    return (
      <Screen scroll={false}>
        <LoadingCenter />
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <View style={styles.head}>
        <SectionTitle>Conteúdos</SectionTitle>
        <BodyText>Professores criam, editam e publicam materiais de apoio.</BodyText>
      </View>
      <PrimaryButton onPress={() => navigation.navigate("ProfConteudosNova")}>Novo conteúdo</PrimaryButton>
      {error ? <ErrorBanner message={error} /> : null}
      <FlatList
        style={styles.flexList}
        data={contents}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !error ? (
            <View style={styles.empty}>
              <MutedText>Nenhum conteúdo criado ainda.</MutedText>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            onPress={() => navigation.navigate("ProfConteudosDetail", { contentId: item.id })}
          >
            <View style={styles.row}>
              <View style={styles.flex}>
                <Text style={styles.title}>{item.title}</Text>
                <MutedText>
                  {item.subtitle} · {item.status} · {formatPublished(item.publishedAt)}
                </MutedText>
              </View>
              <Text style={styles.link}>Abrir</Text>
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
  pressed: { opacity: 0.92 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: theme.space.md, flexWrap: "wrap" },
  title: { fontSize: theme.font.heading, fontWeight: "700", color: theme.colors.text, marginBottom: theme.space.xs },
  link: { color: theme.colors.primary, fontWeight: "600" },
  empty: {
    borderWidth: 1,
    borderColor: theme.colors.dashed,
    borderStyle: "dashed",
    borderRadius: theme.radius.lg,
    padding: theme.space.lg,
  },
});
