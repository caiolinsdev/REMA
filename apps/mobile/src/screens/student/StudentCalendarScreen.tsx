import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import type { CalendarEventSummary, PersonalCalendarNote } from "@rema/contracts";

import { BodyText, MutedText } from "../../components/ui/BodyText";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { LoadingCenter } from "../../components/ui/LoadingCenter";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { Screen } from "../../components/ui/Screen";
import { SectionTitle } from "../../components/ui/Title";
import { useAuth } from "../../context/AuthContext";
import {
  addDays,
  dateKey,
  formatDateTime,
  formatMonthLabel,
  itemDateKey,
  sameDay,
  startOfDay,
  startOfMonth,
  toCalendarItem,
  toNoteItem,
  type CalendarItem,
  WEEKDAY_LABELS,
} from "../../lib/calendarUtils";
import { apiCalendarEvents, apiCalendarNotes, apiCreateCalendarNote } from "../../lib/api";
import { theme } from "../../theme";

function defaultNoteStart(selected: Date) {
  return new Date(
    selected.getFullYear(),
    selected.getMonth(),
    selected.getDate(),
    9,
    0,
    0,
    0,
  );
}

export function StudentCalendarScreen() {
  const { token } = useAuth();
  const today = useMemo(() => startOfDay(new Date()), []);
  const [events, setEvents] = useState<CalendarEventSummary[]>([]);
  const [notes, setNotes] = useState<PersonalCalendarNote[]>([]);
  const [currentMonth, setCurrentMonth] = useState(() => startOfMonth(today));
  const [selectedDate, setSelectedDate] = useState(today);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [noteStartAt, setNoteStartAt] = useState(() => defaultNoteStart(today));
  const [showNoteTimePicker, setShowNoteTimePicker] = useState(false);
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
    Promise.all([apiCalendarEvents(token), apiCalendarNotes(token)])
      .then(([ev, nt]) => {
        setEvents(ev);
        setNotes(nt);
      })
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

  useEffect(() => {
    setNoteStartAt(defaultNoteStart(selectedDate));
  }, [selectedDate]);

  const items = useMemo(
    () =>
      [...events.map(toCalendarItem), ...notes.map(toNoteItem)].sort((a, b) =>
        a.startAt.localeCompare(b.startAt),
      ),
    [events, notes],
  );

  const itemsByDay = useMemo(() => {
    const grouped = new Map<string, CalendarItem[]>();
    for (const item of items) {
      const key = itemDateKey(item.startAt);
      grouped.set(key, [...(grouped.get(key) ?? []), item]);
    }
    return grouped;
  }, [items]);

  const monthDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const gridStart = addDays(monthStart, -monthStart.getDay());
    return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
  }, [currentMonth]);

  const selectedItems = useMemo(
    () => itemsByDay.get(dateKey(selectedDate)) ?? [],
    [itemsByDay, selectedDate],
  );

  async function onSubmitNote() {
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      await apiCreateCalendarNote(token, {
        title,
        description,
        startAt: noteStartAt.toISOString(),
        endAt: null,
      });
      setTitle("");
      setDescription("");
      const [ev, nt] = await Promise.all([apiCalendarEvents(token), apiCalendarNotes(token)]);
      setEvents(ev);
      setNotes(nt);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao criar nota pessoal");
    } finally {
      setSaving(false);
    }
  }

  if (loading && !events.length && !notes.length) {
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
        Veja prazos acadêmicos, eventos manuais e notas pessoais na mesma agenda mensal.
      </MutedText>
      {error ? <ErrorBanner message={error} /> : null}

      <View style={styles.panel}>
        <View style={styles.monthHeader}>
          <View style={styles.flex}>
            <Text style={styles.monthTitle}>{formatMonthLabel(currentMonth)}</Text>
            <MutedText>Toque em um dia para ver detalhes e criar uma nota pessoal.</MutedText>
          </View>
          <View style={styles.monthNav}>
            <Pressable
              style={styles.navChip}
              onPress={() =>
                setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
              }
            >
              <Text style={styles.navChipText}>Anterior</Text>
            </Pressable>
            <Pressable
              style={styles.navChip}
              onPress={() => {
                setCurrentMonth(startOfMonth(today));
                setSelectedDate(today);
              }}
            >
              <Text style={styles.navChipText}>Hoje</Text>
            </Pressable>
            <Pressable
              style={styles.navChip}
              onPress={() =>
                setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
              }
            >
              <Text style={styles.navChipText}>Próximo</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.legend}>
          <LegendDot color="#b45309" label="Prazo acadêmico" />
          <LegendDot color="#0f766e" label="Evento" />
          <LegendDot color="#2563eb" label="Nota pessoal" />
        </View>

        <View style={styles.weekRow}>
          {WEEKDAY_LABELS.map((label) => (
            <Text key={label} style={styles.weekdayCell}>
              {label}
            </Text>
          ))}
        </View>
        {Array.from({ length: 6 }, (_, row) => (
          <View key={`row-${row}`} style={styles.weekRow}>
            {monthDays.slice(row * 7, row * 7 + 7).map((day) => {
              const key = dateKey(day);
              const dayItems = itemsByDay.get(key) ?? [];
              const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
              const isSelected = sameDay(day, selectedDate);
              const isToday = sameDay(day, today);
              return (
                <Pressable
                  key={key}
                  style={[
                    styles.dayCell,
                    !isCurrentMonth && styles.dayMuted,
                    isSelected && styles.daySelected,
                    isToday && styles.dayToday,
                  ]}
                  onPress={() => setSelectedDate(day)}
                >
                  <View style={styles.dayCellTop}>
                    <Text style={[styles.dayNum, !isCurrentMonth && styles.dayNumMuted]}>
                      {day.getDate()}
                    </Text>
                    {dayItems.length > 0 ? (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{dayItems.length}</Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.dayPreview}>
                    {dayItems.slice(0, 2).map((item) => (
                      <View key={item.id} style={[styles.previewPill, { borderLeftColor: item.color }]}>
                        <Text numberOfLines={1} style={styles.previewPillText}>
                          {item.title}
                        </Text>
                      </View>
                    ))}
                    {dayItems.length > 2 ? (
                      <Text style={styles.moreItems}>+{dayItems.length - 2}</Text>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <View style={styles.split}>
        <View style={[styles.panel, styles.splitCol]}>
          <Text style={styles.subTitle}>
            Itens de{" "}
            {new Intl.DateTimeFormat("pt-BR", { dateStyle: "full" }).format(selectedDate)}
          </Text>
          <MutedText>Prazos, eventos e notas aparecem juntos na leitura do dia.</MutedText>
          {selectedItems.length === 0 ? (
            <View style={styles.emptyDay}>
              <MutedText>Nenhum item neste dia.</MutedText>
            </View>
          ) : (
            selectedItems.map((item) => (
              <View key={item.id} style={styles.dayItem}>
                <View style={styles.dayItemHead}>
                  <Text style={styles.dayItemTitle}>{item.title}</Text>
                  <Text style={[styles.dayItemTag, { color: item.color }]}>{item.label}</Text>
                </View>
                <MutedText>{formatDateTime(item.startAt)}</MutedText>
                {item.description ? <BodyText>{item.description}</BodyText> : null}
              </View>
            ))
          )}
        </View>

        <View style={[styles.panel, styles.splitCol]}>
          <Text style={styles.subTitle}>Nova nota pessoal</Text>
          <MutedText>A nota entra automaticamente no dia selecionado do calendário.</MutedText>
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
          <Text style={styles.label}>Data e hora</Text>
          <Pressable style={styles.selectBtn} onPress={() => setShowNoteTimePicker(true)}>
            <Text style={styles.selectBtnText}>{formatDateTime(noteStartAt.toISOString())}</Text>
          </Pressable>
          {Platform.OS === "android" && showNoteTimePicker ? (
            <DateTimePicker
              value={noteStartAt}
              mode="datetime"
              display="default"
              onChange={(ev, date) => {
                setShowNoteTimePicker(false);
                if (ev.type === "set" && date) setNoteStartAt(date);
              }}
            />
          ) : null}
          <Modal visible={Platform.OS === "ios" && showNoteTimePicker} transparent animationType="slide">
            <View style={styles.dateModalRoot}>
              <Pressable style={styles.dateModalFill} onPress={() => setShowNoteTimePicker(false)} />
              <View style={styles.modalCard}>
                <DateTimePicker
                  value={noteStartAt}
                  mode="datetime"
                  display="spinner"
                  onChange={(_, date) => {
                    if (date) setNoteStartAt(date);
                  }}
                />
                <PrimaryButton onPress={() => setShowNoteTimePicker(false)}>Concluir</PrimaryButton>
              </View>
            </View>
          </Modal>
          <PrimaryButton
            loading={saving}
            disabled={!title.trim() || !description.trim()}
            onPress={() => void onSubmitNote()}
          >
            {saving ? "Criando…" : "Criar nota"}
          </PrimaryButton>
        </View>
      </View>
    </Screen>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendRow}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  lead: { marginBottom: theme.space.md },
  flex: { flex: 1 },
  panel: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.space.lg,
    marginBottom: theme.space.md,
    gap: theme.space.sm,
  },
  monthHeader: { gap: theme.space.md },
  monthTitle: {
    fontSize: theme.font.heading,
    fontWeight: "700",
    color: theme.colors.text,
    textTransform: "capitalize",
  },
  monthNav: { flexDirection: "row", flexWrap: "wrap", gap: theme.space.sm },
  navChip: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.dashed,
  },
  navChipText: { fontWeight: "600", color: theme.colors.text },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: theme.space.md, marginTop: theme.space.sm },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 999 },
  legendText: { fontSize: 13, color: theme.colors.textSecondary },
  weekRow: { flexDirection: "row" },
  weekdayCell: {
    flex: 1,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "700",
    color: theme.colors.muted,
    paddingBottom: 4,
  },
  dayCell: {
    flex: 1,
    minHeight: 88,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: 6,
    margin: 2,
    backgroundColor: theme.colors.surface,
  },
  dayMuted: { backgroundColor: theme.colors.bg },
  daySelected: { borderWidth: 2, borderColor: theme.colors.primary },
  dayToday: {
    shadowColor: theme.colors.primary,
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  dayCellTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dayNum: { fontWeight: "700", color: theme.colors.text },
  dayNumMuted: { color: theme.colors.muted },
  badge: {
    backgroundColor: theme.colors.borderMuted,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 11, color: theme.colors.textSecondary },
  dayPreview: { gap: 4, marginTop: 4 },
  previewPill: {
    borderLeftWidth: 4,
    backgroundColor: theme.colors.bg,
    borderRadius: 6,
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  previewPillText: { fontSize: 11, color: theme.colors.text },
  moreItems: { fontSize: 11, color: theme.colors.muted },
  split: { gap: theme.space.md, marginBottom: theme.space.xl },
  splitCol: {},
  subTitle: { fontSize: theme.font.heading, fontWeight: "700", color: theme.colors.text },
  emptyDay: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: theme.colors.dashed,
    borderRadius: theme.radius.md,
    padding: theme.space.lg,
    alignItems: "center",
  },
  dayItem: {
    borderWidth: 1,
    borderColor: theme.colors.borderMuted,
    borderRadius: theme.radius.md,
    padding: theme.space.md,
    gap: theme.space.xs,
  },
  dayItemHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: theme.space.sm,
    flexWrap: "wrap",
    alignItems: "center",
  },
  dayItemTitle: { fontSize: theme.font.body, fontWeight: "700", color: theme.colors.text, flex: 1 },
  dayItemTag: { fontWeight: "700", fontSize: 13 },
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
    gap: theme.space.sm,
  },
});
