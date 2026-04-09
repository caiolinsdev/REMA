import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import type { ProfileResponse } from "@rema/contracts";

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

export function StudentProfileScreen() {
  const { token } = useAuth();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [themePref, setThemePref] = useState("light");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const load = useCallback(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    apiProfile(token)
      .then((payload) => {
        setProfile(payload);
        setDisplayName(payload.displayName);
        setAvatarUrl(payload.avatarUrl ?? "");
        setThemePref(String(payload.preferences?.theme ?? "light"));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Falha ao carregar perfil"))
      .finally(() => setLoading(false));
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
      const updated = await apiUpdateProfile(token, {
        displayName,
        preferences: { theme: themePref },
        bio: profile?.bio ?? null,
      });
      setProfile(updated);
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
      const updated = await apiUpdateAvatar(token, { avatarUrl });
      setProfile(updated);
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
      const updated = await apiUpdateAvatar(token, { avatarUrl: uploaded.url });
      setProfile(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao enviar avatar");
    } finally {
      setUploadingAvatar(false);
    }
  }

  if (loading && !profile) {
    return (
      <Screen scroll={false}>
        {error ? <ErrorBanner message={error} /> : <LoadingCenter />}
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <SectionTitle>Perfil</SectionTitle>
      <MutedText style={styles.lead}>Ajuste sua identidade básica e preferências pessoais.</MutedText>
      {error ? <ErrorBanner message={error} /> : null}

      <View style={styles.panel}>
        <Text style={styles.label}>Nome de exibição</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholderTextColor={theme.colors.muted}
        />
        <Text style={styles.label}>Tema preferido</Text>
        <View style={styles.themeRow}>
          {(["light", "dark"] as const).map((value) => (
            <Pressable
              key={value}
              style={[styles.chip, themePref === value && styles.chipOn]}
              onPress={() => setThemePref(value)}
            >
              <Text style={themePref === value ? styles.chipOnText : styles.chipText}>
                {value === "light" ? "Claro" : "Escuro"}
              </Text>
            </Pressable>
          ))}
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
  themeRow: { flexDirection: "row", gap: theme.space.sm, flexWrap: "wrap" },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.dashed,
  },
  chipOn: { borderColor: theme.colors.primary, backgroundColor: "#eff6ff" },
  chipText: { color: theme.colors.text },
  chipOnText: { color: theme.colors.primary, fontWeight: "700" },
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
