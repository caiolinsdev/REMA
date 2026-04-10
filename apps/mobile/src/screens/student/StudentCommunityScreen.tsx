import { useCallback, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import type { CommunityPostSummary } from "@rema/contracts";

import { CommunityPostMedia } from "../../components/CommunityPostMedia";
import { BodyText, MutedText } from "../../components/ui/BodyText";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { LoadingCenter } from "../../components/ui/LoadingCenter";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { Screen } from "../../components/ui/Screen";
import { SectionTitle } from "../../components/ui/Title";
import { useAuth } from "../../context/AuthContext";
import {
  apiCommunityPosts,
  apiCreateCommunityPost,
  apiUploadMedia,
} from "../../lib/api";
import {
  pickGifForUpload,
  pickImageForUpload,
  pickVideoForUpload,
} from "../../lib/mediaPick";
import { communityPostStatusColor, communityPostStatusLabel } from "../../modules/community/postStatus";
import { theme } from "../../theme";

export function StudentCommunityScreen() {
  const { token } = useAuth();
  const [posts, setPosts] = useState<CommunityPostSummary[]>([]);
  const [myPosts, setMyPosts] = useState<CommunityPostSummary[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [gifUrl, setGifUrl] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingKind, setUploadingKind] = useState<string | null>(null);

  const loadFeed = useCallback(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    setError(null);
    Promise.all([apiCommunityPosts(token), apiCommunityPosts(token, "scope=mine")])
      .then(([approvedPosts, ownPosts]) => {
        setPosts(approvedPosts);
        setMyPosts(ownPosts);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Falha ao carregar comunidade"),
      )
      .finally(() => setLoading(false));
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadFeed();
    }, [loadFeed]),
  );

  async function submitPost() {
    if (!token) return;
    setSubmitting(true);
    setError(null);
    setStatusMessage(null);
    try {
      const created = await apiCreateCommunityPost(token, {
        audience: "alunos",
        title,
        body,
        imageUrl: imageUrl || null,
        videoUrl: videoUrl || null,
        gifUrl: gifUrl || null,
      });
      setTitle("");
      setBody("");
      setImageUrl("");
      setVideoUrl("");
      setGifUrl("");
      setStatusMessage(
        created.status === "pending_review"
          ? "Seu post foi enviado para moderação."
          : "Post publicado.",
      );
      loadFeed();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao publicar");
    } finally {
      setSubmitting(false);
    }
  }

  async function uploadMedia(kind: "community_image" | "community_video" | "community_gif") {
    if (!token) return;
    setUploadingKind(kind);
    setError(null);
    try {
      const file =
        kind === "community_image"
          ? await pickImageForUpload()
          : kind === "community_video"
            ? await pickVideoForUpload()
            : await pickGifForUpload();
      if (!file) return;
      const uploaded = await apiUploadMedia(token, file, kind);
      if (kind === "community_image") setImageUrl(uploaded.url);
      if (kind === "community_video") setVideoUrl(uploaded.url);
      if (kind === "community_gif") setGifUrl(uploaded.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao enviar arquivo");
    } finally {
      setUploadingKind(null);
    }
  }

  if (loading && posts.length === 0 && myPosts.length === 0) {
    return (
      <Screen scroll={false}>
        {error ? <ErrorBanner message={error} /> : <LoadingCenter />}
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <SectionTitle>Comunidade</SectionTitle>
        <MutedText style={styles.lead}>
          Espaço dos alunos com publicação sujeita a aprovação.
        </MutedText>
        {error ? <ErrorBanner message={error} /> : null}

        <View style={styles.panel}>
          <Text style={styles.label}>Título do post</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Título do post"
            placeholderTextColor={theme.colors.muted}
          />
          <Text style={styles.label}>Mensagem</Text>
          <TextInput
            style={styles.textArea}
            value={body}
            onChangeText={setBody}
            multiline
            placeholder="Compartilhe sua dúvida, ideia ou dica"
            placeholderTextColor={theme.colors.muted}
          />
          <Text style={styles.label}>Anexos opcionais</Text>
          <View style={styles.attachRow}>
            <Pressable
              style={styles.secondaryBtn}
              disabled={uploadingKind != null}
              onPress={() => void uploadMedia("community_image")}
            >
              <Text style={styles.secondaryText}>Imagem</Text>
            </Pressable>
            <Pressable
              style={styles.secondaryBtn}
              disabled={uploadingKind != null}
              onPress={() => void uploadMedia("community_video")}
            >
              <Text style={styles.secondaryText}>Vídeo</Text>
            </Pressable>
            <Pressable
              style={styles.secondaryBtn}
              disabled={uploadingKind != null}
              onPress={() => void uploadMedia("community_gif")}
            >
              <Text style={styles.secondaryText}>GIF</Text>
            </Pressable>
          </View>
          {uploadingKind ? (
            <MutedText>
              Enviando{" "}
              {uploadingKind === "community_image"
                ? "imagem"
                : uploadingKind === "community_video"
                  ? "vídeo"
                  : "GIF"}
              …
            </MutedText>
          ) : null}
          <CommunityPostMedia title="Pré-visualização" imageUrl={imageUrl} videoUrl={videoUrl} gifUrl={gifUrl} />
          <PrimaryButton
            loading={submitting}
            disabled={uploadingKind != null}
            onPress={() => void submitPost()}
          >
            Enviar para moderação
          </PrimaryButton>
          {statusMessage ? (
            <Text style={styles.okText} accessibilityLiveRegion="polite">
              {statusMessage}
            </Text>
          ) : null}
        </View>

        <Text style={styles.sectionHeading}>Meus posts</Text>
        {myPosts.length === 0 ? (
          <MutedText style={styles.empty}>Você ainda não criou posts.</MutedText>
        ) : (
          myPosts.map((post) => (
            <View key={post.id} style={styles.postCard}>
              <View style={styles.postHead}>
                <Text style={styles.postTitle}>{post.title}</Text>
                <Text
                  style={[
                    styles.postStatus,
                    { color: communityPostStatusColor(post.status) },
                  ]}
                >
                  {communityPostStatusLabel(post.status)}
                </Text>
              </View>
              <BodyText style={styles.postBody}>{post.body}</BodyText>
              <CommunityPostMedia
                title={post.title}
                imageUrl={post.imageUrl}
                videoUrl={post.videoUrl}
                gifUrl={post.gifUrl}
              />
            </View>
          ))
        )}

        <Text style={styles.sectionHeading}>Feed aprovado</Text>
        {posts.length === 0 ? (
          <MutedText style={styles.empty}>Nenhum post aprovado ainda.</MutedText>
        ) : (
          posts.map((post) => (
            <View key={post.id} style={styles.postCard}>
              <Text style={styles.postTitle}>{post.title}</Text>
              <BodyText style={styles.postBody}>{post.body}</BodyText>
              <CommunityPostMedia
                title={post.title}
                imageUrl={post.imageUrl}
                videoUrl={post.videoUrl}
                gifUrl={post.gifUrl}
              />
            </View>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: theme.space.xl, gap: theme.space.md },
  lead: { marginBottom: theme.space.sm },
  panel: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.space.lg,
    gap: theme.space.sm,
  },
  label: { fontWeight: "600", color: theme.colors.text },
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
  attachRow: { flexDirection: "row", flexWrap: "wrap", gap: theme.space.sm },
  secondaryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.dashed,
  },
  secondaryText: { fontWeight: "600", color: theme.colors.text },
  okText: { color: "#166534", fontWeight: "600" },
  sectionHeading: {
    fontSize: theme.font.heading,
    fontWeight: "700",
    color: theme.colors.text,
    marginTop: theme.space.sm,
  },
  empty: { marginBottom: theme.space.md },
  postCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.space.lg,
    marginBottom: theme.space.md,
    gap: theme.space.sm,
  },
  postHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.space.sm,
    alignItems: "flex-start",
  },
  postTitle: { fontSize: theme.font.body, fontWeight: "700", color: theme.colors.text, flex: 1 },
  postStatus: { fontWeight: "700" },
  postBody: { lineHeight: 22 },
});
