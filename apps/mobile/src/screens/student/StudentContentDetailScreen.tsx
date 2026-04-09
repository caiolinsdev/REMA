import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useFocusEffect, useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ResizeMode, Video } from "expo-av";

import type { ContentDetail } from "@rema/contracts";

import { AppMediaImage } from "../../components/AppMediaImage";
import { BodyText, MutedText } from "../../components/ui/BodyText";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { LoadingCenter } from "../../components/ui/LoadingCenter";
import { Screen } from "../../components/ui/Screen";
import { SectionTitle } from "../../components/ui/Title";
import { useAuth } from "../../context/AuthContext";
import { apiContentDetail } from "../../lib/api";
import { resolveMediaUrl } from "../../lib/mediaUrl";
import type { AlunoConteudosStackParamList } from "../../navigation/contentCalendarProfileTypes";
import { theme } from "../../theme";

type Nav = NativeStackNavigationProp<AlunoConteudosStackParamList, "AlunoConteudosDetail">;
type R = RouteProp<AlunoConteudosStackParamList, "AlunoConteudosDetail">;

export function StudentContentDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<R>();
  const { contentId } = route.params;
  const { token } = useAuth();
  const [content, setContent] = useState<ContentDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      <SectionTitle>{content.title}</SectionTitle>
      <MutedText style={styles.sub}>{content.subtitle}</MutedText>
      <View style={styles.panel}>
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
  sub: { marginBottom: theme.space.md },
  panel: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.space.lg,
    gap: theme.space.md,
  },
  image: { width: "100%", height: 220, borderRadius: theme.radius.md },
  video: { width: "100%", height: 220, borderRadius: theme.radius.md },
});
