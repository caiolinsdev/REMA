import { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import type { ContentSummary } from "@rema/contracts";

import { BodyText, MutedText } from "../../components/ui/BodyText";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { LoadingCenter } from "../../components/ui/LoadingCenter";
import { Screen } from "../../components/ui/Screen";
import { SectionTitle } from "../../components/ui/Title";
import { useAuth } from "../../context/AuthContext";
import { apiContents } from "../../lib/api";
import type { AlunoConteudosStackParamList } from "../../navigation/contentCalendarProfileTypes";
import { theme } from "../../theme";

type Nav = NativeStackNavigationProp<AlunoConteudosStackParamList, "AlunoConteudosList">;

export function StudentContentsListScreen() {
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
      <SectionTitle>Conteúdos</SectionTitle>
      <BodyText style={styles.lead}>Biblioteca de materiais publicados pelos professores.</BodyText>
      {error ? <ErrorBanner message={error} /> : null}
      <FlatList
        style={styles.flexList}
        data={contents}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !error ? (
            <View style={styles.empty}>
              <MutedText>Nenhum conteúdo publicado ainda.</MutedText>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
            onPress={() => navigation.navigate("AlunoConteudosDetail", { contentId: item.id })}
          >
            <Text style={styles.title}>{item.title}</Text>
            <MutedText style={styles.sub}>{item.subtitle}</MutedText>
            <Text style={styles.link}>Ver conteúdo</Text>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flexList: { flex: 1 },
  lead: { marginBottom: theme.space.md },
  list: { paddingBottom: theme.space.xl, gap: theme.space.md },
  card: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.space.lg,
    marginBottom: theme.space.sm,
  },
  pressed: { opacity: 0.92 },
  title: { fontSize: theme.font.heading, fontWeight: "700", color: theme.colors.text, marginBottom: theme.space.xs },
  sub: { marginBottom: theme.space.sm },
  link: { color: theme.colors.primary, fontWeight: "600" },
  empty: {
    borderWidth: 1,
    borderColor: theme.colors.dashed,
    borderStyle: "dashed",
    borderRadius: theme.radius.lg,
    padding: theme.space.lg,
  },
});
