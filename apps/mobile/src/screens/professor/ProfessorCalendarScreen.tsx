import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import type { CalendarEventSummary } from "@rema/contracts";

import { BodyText, MutedText } from "../../components/ui/BodyText";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { LoadingCenter } from "../../components/ui/LoadingCenter";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { Screen } from "../../components/ui/Screen";
import { SectionTitle } from "../../components/ui/Title";
import { useAuth } from "../../context/AuthContext";
import { formatDateTime } from "../../lib/calendarUtils";
import { apiCalendarEvents, apiCreateCalendarEvent } from "../../lib/api";
import { theme } from "../../theme";

export function ProfessorCalendarScreen() {
  const { token } = useAuth();
  const [events, setEvents] = useState<CalendarEventSummary[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startAtMs, setStartAtMs] = useState<number | null>(() => Date.now());
  const [showPicker, setShowPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    apiCalendarEvents(token)
      .then(setEvents)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Falha ao carregar calendário"),
      )
      .finally(() => setLoading(false));
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function onSubmit() {
    if (!token || startAtMs == null) return;
    setSaving(true);
    setError(null);
    try {
      await apiCreateCalendarEvent(token, {
        title,
        description,
        type: "other",
        startAt: new Date(startAtMs).toISOString(),
        endAt: null,
      });
      setTitle("");
      setDescription("");
      setEvents(await apiCalendarEvents(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao criar evento");
    } finally {
      setSaving(false);
    }
  }

  if (loading && events.length === 0) {
    return (
      <Screen scroll={false}>
        {error ? <ErrorBanner message={error} /> : <LoadingCenter />}
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <SectionTitle>Calendário</SectionTitle>
      <MutedText style={styles.lead}>
        Eventos manuais do professor e prazos acadêmicos das tarefas criadas.
      </MutedText>
      {error ? <ErrorBanner message={error} /> : null}

      <View style={styles.panel}>
        <Text style={styles.subTitle}>Novo evento acadêmico</Text>
        <Text style={styles.label}>Título</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Título"
          placeholderTextColor={theme.colors.muted}
        />
        <Text style={styles.label}>Descrição</Text>
        <TextInput
          style={styles.textArea}
          value={description}
          onChangeText={setDescription}
          multiline
          placeholder="Descrição"
          placeholderTextColor={theme.colors.muted}
        />
        <Text style={styles.label}>Início</Text>
        <Pressable style={styles.selectBtn} onPress={() => setShowPicker(true)}>
          <Text style={styles.selectBtnText}>
            {startAtMs != null ? formatDateTime(new Date(startAtMs).toISOString()) : "Definir data"}
          </Text>
        </Pressable>
        {Platform.OS === "android" && showPicker ? (
          <DateTimePicker
            value={startAtMs != null ? new Date(startAtMs) : new Date()}
            mode="datetime"
            display="default"
            onChange={(ev, date) => {
              setShowPicker(false);
              if (ev.type === "set" && date) setStartAtMs(date.getTime());
            }}
          />
        ) : null}
        <Modal visible={Platform.OS === "ios" && showPicker} transparent animationType="slide">
          <View style={styles.dateModalRoot}>
            <Pressable style={styles.dateModalFill} onPress={() => setShowPicker(false)} />
            <View style={styles.modalCard}>
              <DateTimePicker
                value={startAtMs != null ? new Date(startAtMs) : new Date()}
                mode="datetime"
                display="spinner"
                onChange={(_, date) => {
                  if (date) setStartAtMs(date.getTime());
                }}
              />
              <PrimaryButton onPress={() => setShowPicker(false)}>Concluir</PrimaryButton>
            </View>
          </View>
        </Modal>
        <PrimaryButton
          loading={saving}
          disabled={!title.trim()}
          onPress={() => void onSubmit()}
        >
          {saving ? "Criando…" : "Criar evento"}
        </PrimaryButton>
      </View>

      <View style={styles.list}>
        {events.map((calendarEvent) => (
          <View key={calendarEvent.id} style={styles.eventCard}>
            <Text style={styles.eventTitle}>{calendarEvent.title}</Text>
            <MutedText>
              {calendarEvent.type} · {formatDateTime(calendarEvent.startAt)}
            </MutedText>
            {calendarEvent.description ? <BodyText>{calendarEvent.description}</BodyText> : null}
          </View>
        ))}
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
  subTitle: { fontSize: theme.font.heading, fontWeight: "700", color: theme.colors.text, marginBottom: theme.space.xs },
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
    minHeight: 88,
    borderWidth: 1,
    borderColor: theme.colors.dashed,
    borderRadius: theme.radius.sm,
    padding: theme.space.md,
    fontSize: theme.font.body,
    color: theme.colors.text,
    textAlignVertical: "top",
  },
  selectBtn: {
    borderWidth: 1,
    borderColor: theme.colors.dashed,
    borderRadius: theme.radius.sm,
    padding: theme.space.md,
  },
  selectBtnText: { color: theme.colors.text, fontSize: theme.font.body },
  dateModalRoot: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  dateModalFill: { flex: 1 },
  modalCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.space.sm,
  },
  list: { gap: theme.space.md, marginBottom: theme.space.xl },
  eventCard: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.space.lg,
    gap: theme.space.sm,
  },
  eventTitle: { fontSize: theme.font.heading, fontWeight: "700", color: theme.colors.text },
});
