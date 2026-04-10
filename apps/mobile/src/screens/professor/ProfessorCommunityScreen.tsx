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
  apiApproveCommunityPost,
  apiCommunityPosts,
  apiCreateCommunityPost,
  apiRejectCommunityPost,
  apiUploadMedia,
} from "../../lib/api";
import {
  pickGifForUpload,
  pickImageForUpload,
  pickVideoForUpload,
} from "../../lib/mediaPick";
import { theme } from "../../theme";

export function ProfessorCommunityScreen() {
  const { token } = useAuth();
  const [teacherPosts, setTeacherPosts] = useState<CommunityPostSummary[]>([]);
  const [moderationQueue, setModerationQueue] = useState<CommunityPostSummary[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [gifUrl, setGifUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [moderatingId, setModeratingId] = useState<string | null>(null);
  const [uploadingKind, setUploadingKind] = useState<string | null>(null);

  const loadData = useCallback(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    setError(null);
    Promise.all([apiCommunityPosts(token), apiCommunityPosts(token, "queue=moderation")])
      .then(([feed, queue]) => {
        setTeacherPosts(feed);
        setModerationQueue(queue);
      })
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Falha ao carregar comunidade"),
      )
      .finally(() => setLoading(false));
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadData();
    }, [loadData]),
  );

  async function submitTeacherPost() {
    if (!token) return;
    setSubmitting(true);
    setError(null);
    try {
      await apiCreateCommunityPost(token, {
        audience: "professores",
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
      loadData();
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

  async function moderate(postId: string, decision: "approve" | "reject") {
    if (!token) return;
    setModeratingId(postId);
    setError(null);
    try {
      if (decision === "approve") {
        await apiApproveCommunityPost(token, postId, { comment: "Aprovado pelo professor." });
      } else {
        await apiRejectCommunityPost(token, postId, { comment: "Revisar antes de publicar." });
      }
      loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao moderar");
    } finally {
      setModeratingId(null);
    }
  }

  if (loading && teacherPosts.length === 0 && moderationQueue.length === 0) {
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
          Feed privado entre professores e fila de moderação dos posts de alunos.
        </MutedText>
        {error ? <ErrorBanner message={error} /> : null}

        <View style={styles.panel}>
          <Text style={styles.subTitle}>Novo post para professores</Text>
          <Text style={styles.label}>Título do aviso</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholderTextColor={theme.colors.muted}
          />
          <Text style={styles.label}>Mensagem</Text>
          <TextInput
            style={styles.textArea}
            value={body}
            onChangeText={setBody}
            multiline
            placeholder="Compartilhe combinados e trocas internas"
            placeholderTextColor={theme.colors.muted}
          />
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
          {uploadingKind ? <MutedText>Enviando…</MutedText> : null}
          <CommunityPostMedia title="Pré-visualização" imageUrl={imageUrl} videoUrl={videoUrl} gifUrl={gifUrl} />
          <PrimaryButton
            loading={submitting}
            disabled={uploadingKind != null}
            onPress={() => void submitTeacherPost()}
          >
            Publicar no feed privado
          </PrimaryButton>
        </View>

        <Text style={styles.sectionHeading}>Fila de moderação</Text>
        {moderationQueue.length === 0 ? (
          <MutedText style={styles.empty}>Nenhuma pendência no momento.</MutedText>
        ) : (
          moderationQueue.map((post) => (
            <View key={post.id} style={styles.postCard}>
              <Text style={styles.postTitle}>{post.title}</Text>
              <BodyText style={styles.postBody}>{post.body}</BodyText>
              <CommunityPostMedia
                title={post.title}
                imageUrl={post.imageUrl}
                videoUrl={post.videoUrl}
                gifUrl={post.gifUrl}
              />
              <View style={styles.modActions}>
                <Pressable
                  style={styles.approveBtn}
                  disabled={moderatingId != null}
                  onPress={() => void moderate(post.id, "approve")}
                >
                  <Text style={styles.approveText}>
                    {moderatingId === post.id ? "…" : "Aprovar"}
                  </Text>
                </Pressable>
                <Pressable
                  style={styles.rejectBtn}
                  disabled={moderatingId != null}
                  onPress={() => void moderate(post.id, "reject")}
                >
                  <Text style={styles.rejectText}>
                    {moderatingId === post.id ? "…" : "Rejeitar"}
                  </Text>
                </Pressable>
              </View>
            </View>
          ))
        )}

        <Text style={styles.sectionHeading}>Feed privado de professores</Text>
        {teacherPosts.length === 0 ? (
          <MutedText style={styles.empty}>Nenhum post privado ainda.</MutedText>
        ) : (
          teacherPosts.map((post) => (
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
  subTitle: { fontSize: theme.font.heading, fontWeight: "700", color: theme.colors.text },
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
  postTitle: { fontSize: theme.font.body, fontWeight: "700", color: theme.colors.text },
  postBody: { lineHeight: 22 },
  modActions: { flexDirection: "row", gap: theme.space.sm, flexWrap: "wrap", marginTop: theme.space.sm },
  approveBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: theme.radius.sm,
    backgroundColor: "#166534",
  },
  approveText: { color: "#fff", fontWeight: "700" },
  rejectBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: "#dc2626",
    backgroundColor: theme.colors.surface,
  },
  rejectText: { color: "#dc2626", fontWeight: "700" },
});
