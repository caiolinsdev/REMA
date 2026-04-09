import { ResizeMode, Video } from "expo-av";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import type { ContentDetail, UpsertContentRequest } from "@rema/contracts";

import { AppMediaImage } from "../../components/AppMediaImage";
import { MutedText } from "../../components/ui/BodyText";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { LoadingCenter } from "../../components/ui/LoadingCenter";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { Screen } from "../../components/ui/Screen";
import { SectionTitle } from "../../components/ui/Title";
import { useAuth } from "../../context/AuthContext";
import {
  apiContentDetail,
  apiCreateContent,
  apiUpdateContent,
  apiUploadMedia,
} from "../../lib/api";
import { pickImageForUpload, pickVideoForUpload } from "../../lib/mediaPick";
import { resolveMediaUrl } from "../../lib/mediaUrl";
import type { ProfConteudosStackParamList } from "../../navigation/contentCalendarProfileTypes";
import { theme } from "../../theme";

type Nav = NativeStackNavigationProp<ProfConteudosStackParamList>;
type EditorRoute = RouteProp<ProfConteudosStackParamList, "ProfConteudosNova" | "ProfConteudosEditar">;

export function ProfessorContentEditorScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<EditorRoute>();
  const mode = route.name === "ProfConteudosEditar" ? "edit" : "create";
  const contentId =
    route.name === "ProfConteudosEditar" && route.params ? route.params.contentId : undefined;

  const { token } = useAuth();
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  useEffect(() => {
    if (mode !== "edit" || !contentId || !token) return;
    apiContentDetail(token, contentId)
      .then((c: ContentDetail) => {
        setTitle(c.title);
        setSubtitle(c.subtitle);
        setDescription(c.description);
        setImageUrl(c.imageUrl ?? "");
        setVideoUrl(c.videoUrl ?? "");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Falha ao carregar conteúdo"))
      .finally(() => setLoading(false));
  }, [contentId, mode, token]);

  async function onSubmit() {
    if (!token) return;
    const body: UpsertContentRequest = {
      title,
      subtitle,
      description,
      imageUrl: imageUrl || null,
      videoUrl: videoUrl || null,
    };
    setSaving(true);
    setError(null);
    try {
      const content =
        mode === "create"
          ? await apiCreateContent(token, body)
          : await apiUpdateContent(token, contentId!, body);
      navigation.navigate("ProfConteudosDetail", { contentId: content.id });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar conteúdo");
    } finally {
      setSaving(false);
    }
  }

  async function handleUploadImage() {
    if (!token) return;
    setUploadingImage(true);
    setError(null);
    try {
      const file = await pickImageForUpload();
      if (!file) return;
      const uploaded = await apiUploadMedia(token, file, "content_image");
      setImageUrl(uploaded.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao enviar arquivo");
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleUploadVideo() {
    if (!token) return;
    setUploadingVideo(true);
    setError(null);
    try {
      const file = await pickVideoForUpload();
      if (!file) return;
      const uploaded = await apiUploadMedia(token, file, "content_video");
      setVideoUrl(uploaded.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao enviar arquivo");
    } finally {
      setUploadingVideo(false);
    }
  }

  const videoUri = videoUrl ? resolveMediaUrl(videoUrl) : null;

  if (loading) {
    return (
      <Screen scroll={false}>
        <LoadingCenter />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <SectionTitle>{mode === "create" ? "Novo conteúdo" : "Editar conteúdo"}</SectionTitle>
      <MutedText style={styles.lead}>
        Conteúdos nascem em rascunho e podem ser publicados quando estiverem prontos.
      </MutedText>
      {error ? <ErrorBanner message={error} /> : null}

      <View style={styles.panel}>
        <Text style={styles.label}>Título</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Título" />

        <Text style={styles.label}>Subtítulo</Text>
        <TextInput style={styles.input} value={subtitle} onChangeText={setSubtitle} />

        <Text style={styles.label}>Descrição</Text>
        <TextInput
          style={styles.textArea}
          value={description}
          onChangeText={setDescription}
          multiline
          placeholderTextColor={theme.colors.muted}
        />

        <Text style={styles.label}>Imagem do conteúdo</Text>
        {imageUrl ? (
          <AppMediaImage src={imageUrl} style={styles.previewImg} resizeMode="contain" />
        ) : null}
        <Pressable
          style={styles.secondaryBtn}
          onPress={() => void handleUploadImage()}
          disabled={uploadingImage}
        >
          <Text style={styles.secondaryText}>
            {uploadingImage ? "Enviando imagem…" : "Escolher imagem (png, jpeg, webp)"}
          </Text>
        </Pressable>
        <Pressable
          style={styles.secondaryBtn}
          onPress={() => setImageUrl("")}
          disabled={!imageUrl || uploadingImage}
        >
          <Text style={styles.secondaryText}>Remover imagem</Text>
        </Pressable>

        <Text style={styles.label}>Vídeo do conteúdo</Text>
        {videoUri ? (
          <Video
            style={styles.previewVideo}
            source={{ uri: videoUri }}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
          />
        ) : null}
        <Pressable
          style={styles.secondaryBtn}
          onPress={() => void handleUploadVideo()}
          disabled={uploadingVideo}
        >
          <Text style={styles.secondaryText}>
            {uploadingVideo ? "Enviando vídeo…" : "Escolher vídeo (mp4, webm…)"}
          </Text>
        </Pressable>
        <Pressable
          style={styles.secondaryBtn}
          onPress={() => setVideoUrl("")}
          disabled={!videoUrl || uploadingVideo}
        >
          <Text style={styles.secondaryText}>Remover vídeo</Text>
        </Pressable>
      </View>

      <View style={styles.footer}>
        <PrimaryButton loading={saving} onPress={() => void onSubmit()}>
          {saving ? "Salvando…" : mode === "create" ? "Criar rascunho" : "Salvar alterações"}
        </PrimaryButton>
        <Pressable style={styles.secondaryBtn} onPress={() => navigation.goBack()}>
          <Text style={[styles.secondaryText, { textAlign: "center" }]}>Cancelar</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: { marginBottom: theme.space.md },
  panel: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.space.lg,
    gap: theme.space.sm,
    marginBottom: theme.space.md,
  },
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
    minHeight: 120,
    borderWidth: 1,
    borderColor: theme.colors.dashed,
    borderRadius: theme.radius.sm,
    padding: theme.space.md,
    fontSize: theme.font.body,
    color: theme.colors.text,
    textAlignVertical: "top",
  },
  previewImg: { width: "100%", height: 180, borderRadius: theme.radius.md },
  previewVideo: { width: "100%", height: 200, borderRadius: theme.radius.md },
  secondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.dashed,
    alignSelf: "flex-start",
  },
  secondaryText: { fontWeight: "600", color: theme.colors.text },
  footer: { gap: theme.space.sm, marginBottom: theme.space.xl },
});
