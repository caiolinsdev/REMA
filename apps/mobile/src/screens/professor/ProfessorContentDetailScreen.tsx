import { useCallback, useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ResizeMode, Video } from "expo-av";

import type { ContentDetail } from "@rema/contracts";

import { AppMediaImage } from "../../components/AppMediaImage";
import { BodyText, MutedText } from "../../components/ui/BodyText";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { LoadingCenter } from "../../components/ui/LoadingCenter";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { Screen } from "../../components/ui/Screen";
import { SectionTitle } from "../../components/ui/Title";
import { useAuth } from "../../context/AuthContext";
import { apiContentDetail, apiDeleteContent, apiUpdateContent } from "../../lib/api";
import { resolveMediaUrl } from "../../lib/mediaUrl";
import type { ProfConteudosStackParamList } from "../../navigation/contentCalendarProfileTypes";
import { theme } from "../../theme";

type Nav = NativeStackNavigationProp<ProfConteudosStackParamList, "ProfConteudosDetail">;
type R = RouteProp<ProfConteudosStackParamList, "ProfConteudosDetail">;

function formatPublished(value: string | null) {
  if (!value) return "Não publicado";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function ProfessorContentDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const { contentId } = route.params;
  const { token } = useAuth();
  const [content, setContent] = useState<ContentDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);

  const load = useCallback(() => {
    if (!token) return;
    setError(null);
    apiContentDetail(token, contentId)
      .then((c) => {
        setContent(c);
        navigation.setOptions({ title: c.title });
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Falha ao carregar conteúdo"));
  }, [token, contentId, navigation]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function updateStatus(status: "published" | "draft" | "archived") {
    if (!token || !content) return;
    setLoadingAction(true);
    setError(null);
    try {
      setContent(await apiUpdateContent(token, content.id, { status }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao atualizar conteúdo");
    } finally {
      setLoadingAction(false);
    }
  }

  function handleDelete() {
    if (!token || !content) return;
    Alert.alert("Excluir conteúdo", "Deseja excluir este conteúdo?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          setLoadingAction(true);
          try {
            await apiDeleteContent(token, content.id);
            navigation.navigate("ProfConteudosList");
          } catch (err) {
            setError(err instanceof Error ? err.message : "Falha ao excluir conteúdo");
            setLoadingAction(false);
          }
        },
      },
    ]);
  }

  if (!content) {
    return (
      <Screen scroll={false}>
        {error ? <ErrorBanner message={error} /> : <LoadingCenter />}
      </Screen>
    );
  }

  const videoUri = content.videoUrl ? resolveMediaUrl(content.videoUrl) : null;

  return (
    <Screen scroll>
      <View style={styles.top}>
        <View style={styles.flex}>
          <SectionTitle>{content.title}</SectionTitle>
          <MutedText>
            {content.subtitle} · {content.status} · {formatPublished(content.publishedAt)}
          </MutedText>
        </View>
        <View style={styles.actions}>
          <Pressable
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate("ProfConteudosEditar", { contentId: content.id })}
          >
            <Text style={styles.secondaryText}>Editar</Text>
          </Pressable>
          {content.status !== "published" ? (
            <PrimaryButton
              loading={loadingAction}
              onPress={() => void updateStatus("published")}
            >
              Publicar
            </PrimaryButton>
          ) : null}
          {content.status === "published" ? (
            <Pressable
              style={styles.secondaryBtn}
              disabled={loadingAction}
              onPress={() => void updateStatus("archived")}
            >
              <Text style={styles.secondaryText}>Arquivar</Text>
            </Pressable>
          ) : null}
          <Pressable style={styles.dangerBtn} disabled={loadingAction} onPress={handleDelete}>
            <Text style={styles.dangerText}>Excluir</Text>
          </Pressable>
        </View>
      </View>

      {error ? <ErrorBanner message={error} /> : null}

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Preview</Text>
        <BodyText>{content.description}</BodyText>
        {content.imageUrl ? (
          <AppMediaImage src={content.imageUrl} style={styles.image} resizeMode="contain" />
        ) : null}
        {videoUri ? (
          <Video
            style={styles.video}
            source={{ uri: videoUri }}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  top: { gap: theme.space.md, marginBottom: theme.space.md },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: theme.space.sm },
  secondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.dashed,
    justifyContent: "center",
  },
  secondaryText: { fontWeight: "600", color: theme.colors.text },
  dangerBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.errorBorder,
  },
  dangerText: { fontWeight: "600", color: theme.colors.errorText },
  panel: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.space.lg,
    gap: theme.space.md,
  },
  panelTitle: { fontSize: theme.font.heading, fontWeight: "700", color: theme.colors.text },
  image: { width: "100%", height: 220, borderRadius: theme.radius.md },
  video: { width: "100%", height: 220, borderRadius: theme.radius.md },
});
