import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { AppMediaImage } from "../../components/AppMediaImage";
import { MutedText } from "../../components/ui/BodyText";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { LoadingCenter } from "../../components/ui/LoadingCenter";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { Screen } from "../../components/ui/Screen";
import { SectionTitle } from "../../components/ui/Title";
import { useAuth } from "../../context/AuthContext";
import { apiProfile, apiUpdateAvatar, apiUpdateProfile, apiUploadMedia } from "../../lib/api";
import { pickImageForUpload } from "../../lib/mediaPick";
import { theme } from "../../theme";

export function ProfessorProfileScreen() {
  const { token } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [communityEmails, setCommunityEmails] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const load = useCallback(() => {
    if (!token) {
      setInitialized(true);
      return;
    }
    setError(null);
    apiProfile(token)
      .then((payload) => {
        setDisplayName(payload.displayName);
        setBio(payload.bio ?? "");
        setAvatarUrl(payload.avatarUrl ?? "");
        setCommunityEmails(Boolean(payload.preferences?.communityEmails ?? true));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Falha ao carregar perfil"))
      .finally(() => {
        setInitialized(true);
      });
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function saveProfile() {
    if (!token) return;
    setSavingProfile(true);
    setError(null);
    try {
      await apiUpdateProfile(token, {
        displayName,
        bio,
        preferences: { communityEmails },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao salvar perfil");
    } finally {
      setSavingProfile(false);
    }
  }

  async function saveAvatar() {
    if (!token) return;
    setSavingAvatar(true);
    setError(null);
    try {
      await apiUpdateAvatar(token, { avatarUrl });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao atualizar avatar");
    } finally {
      setSavingAvatar(false);
    }
  }

  async function handlePickAvatar() {
    if (!token) return;
    setUploadingAvatar(true);
    setError(null);
    try {
      const file = await pickImageForUpload();
      if (!file) return;
      const uploaded = await apiUploadMedia(token, file, "avatar");
      setAvatarUrl(uploaded.url);
      await apiUpdateAvatar(token, { avatarUrl: uploaded.url });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao enviar avatar");
    } finally {
      setUploadingAvatar(false);
    }
  }

  if (!initialized) {
    return (
      <Screen scroll={false}>
        {error ? <ErrorBanner message={error} /> : <LoadingCenter />}
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <SectionTitle>Perfil</SectionTitle>
      <MutedText style={styles.lead}>
        Perfil do professor com bio opcional e preferências básicas.
      </MutedText>
      {error ? <ErrorBanner message={error} /> : null}

      <View style={styles.panel}>
        <Text style={styles.label}>Nome de exibição</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholderTextColor={theme.colors.muted}
        />
        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={styles.textArea}
          value={bio}
          onChangeText={setBio}
          multiline
          placeholderTextColor={theme.colors.muted}
        />
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Receber alertas da comunidade de professores</Text>
          <Switch value={communityEmails} onValueChange={setCommunityEmails} />
        </View>
        <PrimaryButton loading={savingProfile} onPress={() => void saveProfile()}>
          {savingProfile ? "Salvando…" : "Salvar perfil"}
        </PrimaryButton>
      </View>

      <View style={styles.panel}>
        <Text style={styles.label}>Avatar</Text>
        {avatarUrl ? (
          <AppMediaImage src={avatarUrl} style={styles.avatar} resizeMode="cover" />
        ) : (
          <View style={styles.avatarPlaceholder} />
        )}
        <Pressable
          style={styles.secondaryBtn}
          onPress={() => void handlePickAvatar()}
          disabled={uploadingAvatar}
        >
          <Text style={styles.secondaryText}>
            {uploadingAvatar ? "Enviando…" : "Escolher imagem (png, jpeg, webp)"}
          </Text>
        </Pressable>
        <PrimaryButton loading={savingAvatar} onPress={() => void saveAvatar()} disabled={!avatarUrl}>
          {savingAvatar ? "Salvando…" : "Salvar avatar atual"}
        </PrimaryButton>
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
    marginBottom: theme.space.md,
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
    minHeight: 100,
    borderWidth: 1,
    borderColor: theme.colors.dashed,
    borderRadius: theme.radius.sm,
    padding: theme.space.md,
    fontSize: theme.font.body,
    color: theme.colors.text,
    textAlignVertical: "top",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: theme.space.md,
    marginVertical: theme.space.xs,
  },
  switchLabel: { flex: 1, color: theme.colors.text, fontSize: theme.font.body },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    borderColor: theme.colors.dashed,
    alignSelf: "flex-start",
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.colors.borderMuted,
    alignSelf: "flex-start",
  },
  secondaryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.dashed,
    alignSelf: "flex-start",
  },
  secondaryText: { fontWeight: "600", color: theme.colors.text },
});
