"use client";

import { useEffect, useMemo, useState } from "react";

import type { CalendarEventSummary, PersonalCalendarNote } from "@rema/contracts";
import { apiCalendarEvents, apiCalendarNotes, apiCreateCalendarNote } from "@/lib/api";
import { getStoredToken } from "@/lib/cookies";

type CalendarItem = {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string | null;
  category: "academic_deadline" | "manual_event" | "personal_note";
  label: string;
  color: string;
};

const weekdayLabels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"];

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatMonthLabel(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(value);
}

function formatInputDate(value: Date) {
  const local = new Date(value.getTime() - value.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function startOfMonth(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), 1);
}

function addDays(value: Date, amount: number) {
  const next = new Date(value);
  next.setDate(next.getDate() + amount);
  return next;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function dateKey(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(
    value.getDate(),
  ).padStart(2, "0")}`;
}

function itemDateKey(value: string) {
  return dateKey(new Date(value));
}

function toCalendarItem(event: CalendarEventSummary): CalendarItem {
  if (event.type === "other") {
    return {
      id: event.id,
      title: event.title,
      description: event.description ?? null,
      startAt: event.startAt,
      endAt: event.endAt,
      category: "manual_event",
      label: "Evento",
      color: "#0f766e",
    };
  }
  return {
    id: event.id,
    title: event.title,
    description: event.description ?? null,
    startAt: event.startAt,
    endAt: event.endAt,
    category: "academic_deadline",
    label: "Prazo academico",
    color: "#b45309",
  };
}

function toNoteItem(note: PersonalCalendarNote): CalendarItem {
  return {
    id: note.id,
    title: note.title,
    description: note.description,
    startAt: note.startAt,
    endAt: note.endAt,
    category: "personal_note",
    label: "Nota pessoal",
    color: "#2563eb",
  };
}

export default function Page() {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [events, setEvents] = useState<CalendarEventSummary[]>([]);
  const [notes, setNotes] = useState<PersonalCalendarNote[]>([]);
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(today));
  const [selectedDate, setSelectedDate] = useState(today);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startAt, setStartAt] = useState(formatInputDate(new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0)));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function loadCalendar() {
    const token = getStoredToken();
    if (!token) return;
    const [loadedEvents, loadedNotes] = await Promise.all([
      apiCalendarEvents(token),
      apiCalendarNotes(token),
    ]);
    setEvents(loadedEvents);
    setNotes(loadedNotes);
  }

  useEffect(() => {
    loadCalendar().catch((err) =>
      setError(err instanceof Error ? err.message : "Falha ao carregar calendario"),
    );
  }, []);

  useEffect(() => {
    setStartAt(
      formatInputDate(
        new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
          9,
          0,
        ),
      ),
    );
  }, [selectedDate]);

  const items = useMemo(
    () => [...events.map(toCalendarItem), ...notes.map(toNoteItem)].sort((a, b) => a.startAt.localeCompare(b.startAt)),
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

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const token = getStoredToken();
    if (!token) return;
    setSaving(true);
    setError(null);
    try {
      await apiCreateCalendarNote(token, {
        title,
        description,
        startAt: new Date(startAt).toISOString(),
        endAt: null,
      });
      setTitle("");
      setDescription("");
      await loadCalendar();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao criar nota pessoal");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div>
        <h1 style={{ marginTop: 0 }}>Calendario</h1>
        <p style={{ color: "#64748b", lineHeight: 1.6 }}>
          Veja prazos academicos, eventos manuais e notas pessoais na mesma agenda mensal.
        </p>
      </div>

      {error ? (
        <div style={{ color: "#b91c1c", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 16, padding: 16 }}>
          {error}
        </div>
      ) : null}

      <section style={{ background: "#fff", border: "1px solid #dbe4f0", borderRadius: 20, padding: 20, display: "grid", gap: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: 0, textTransform: "capitalize" }}>{formatMonthLabel(currentMonth)}</h2>
            <p style={{ margin: "6px 0 0", color: "#64748b" }}>
              Clique num dia para ver detalhes e criar uma nota pessoal.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              type="button"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
              style={{ borderRadius: 10, border: "1px solid #cbd5e1", padding: "10px 14px", background: "#fff", cursor: "pointer" }}
            >
              Mes anterior
            </button>
            <button
              type="button"
              onClick={() => {
                setCurrentMonth(startOfMonth(today));
                setSelectedDate(today);
              }}
              style={{ borderRadius: 10, border: "1px solid #cbd5e1", padding: "10px 14px", background: "#fff", cursor: "pointer" }}
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
              style={{ borderRadius: 10, border: "1px solid #cbd5e1", padding: "10px 14px", background: "#fff", cursor: "pointer" }}
            >
              Proximo mes
            </button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", color: "#475569", fontSize: 14 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><span style={{ width: 10, height: 10, borderRadius: 999, background: "#b45309" }} /> Prazo academico</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><span style={{ width: 10, height: 10, borderRadius: 999, background: "#0f766e" }} /> Evento</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><span style={{ width: 10, height: 10, borderRadius: 999, background: "#2563eb" }} /> Nota pessoal</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 10 }}>
          {weekdayLabels.map((label) => (
            <div key={label} style={{ textAlign: "center", fontSize: 13, fontWeight: 700, color: "#64748b", paddingBottom: 4 }}>
              {label}
            </div>
          ))}
          {monthDays.map((day) => {
            const key = dateKey(day);
            const dayItems = itemsByDay.get(key) ?? [];
            const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
            const isSelected = sameDay(day, selectedDate);
            const isToday = sameDay(day, today);
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedDate(day)}
                style={{
                  minHeight: 118,
                  textAlign: "left",
                  borderRadius: 16,
                  border: isSelected ? "2px solid #2563eb" : "1px solid #dbe4f0",
                  background: isCurrentMonth ? "#fff" : "#f8fafc",
                  padding: 10,
                  cursor: "pointer",
                  display: "grid",
                  alignContent: "start",
                  gap: 6,
                  boxShadow: isToday ? "0 0 0 2px rgba(37, 99, 235, 0.12)" : "none",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <strong style={{ color: isCurrentMonth ? "#0f172a" : "#94a3b8" }}>{day.getDate()}</strong>
                  {dayItems.length > 0 ? (
                    <span style={{ fontSize: 12, color: "#475569", background: "#e2e8f0", borderRadius: 999, padding: "2px 8px" }}>
                      {dayItems.length}
                    </span>
                  ) : null}
                </div>
                <div style={{ display: "grid", gap: 4 }}>
                  {dayItems.slice(0, 3).map((item) => (
                    <div
                      key={item.id}
                      style={{
                        borderLeft: `4px solid ${item.color}`,
                        background: "#f8fafc",
                        borderRadius: 8,
                        padding: "4px 6px",
                        fontSize: 12,
                        color: "#334155",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.title}
                    </div>
                  ))}
                  {dayItems.length > 3 ? (
                    <span style={{ fontSize: 12, color: "#64748b" }}>
                      +{dayItems.length - 3} itens
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.3fr) minmax(320px, 0.9fr)", gap: 20, alignItems: "start" }}>
        <div style={{ background: "#fff", border: "1px solid #dbe4f0", borderRadius: 20, padding: 20, display: "grid", gap: 16 }}>
          <div>
            <h2 style={{ margin: 0 }}>
              Itens de {new Intl.DateTimeFormat("pt-BR", { dateStyle: "full" }).format(selectedDate)}
            </h2>
            <p style={{ margin: "6px 0 0", color: "#64748b" }}>
              Prazos, eventos e notas aparecem juntos na leitura do dia.
            </p>
          </div>

          {selectedItems.length === 0 ? (
            <div style={{ border: "1px dashed #cbd5e1", borderRadius: 16, padding: 18, color: "#64748b" }}>
              Nenhum item neste dia.
            </div>
          ) : (
            selectedItems.map((item) => (
              <article key={item.id} style={{ border: "1px solid #e2e8f0", borderRadius: 16, padding: 16, display: "grid", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                  <h3 style={{ margin: 0 }}>{item.title}</h3>
                  <span style={{ color: item.color, fontWeight: 700, fontSize: 13 }}>
                    {item.label}
                  </span>
                </div>
                <p style={{ margin: 0, color: "#64748b" }}>
                  {formatDateTime(item.startAt)}
                </p>
                {item.description ? (
                  <p style={{ margin: 0, color: "#334155", lineHeight: 1.6 }}>{item.description}</p>
                ) : null}
              </article>
            ))
          )}
        </div>

        <form onSubmit={onSubmit} style={{ background: "#fff", border: "1px solid #dbe4f0", borderRadius: 20, padding: 20, display: "grid", gap: 12 }}>
          <div>
            <h2 style={{ margin: 0 }}>Nova nota pessoal</h2>
            <p style={{ margin: "6px 0 0", color: "#64748b" }}>
              A nota entra automaticamente no dia selecionado do calendario.
            </p>
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titulo"
            required
            style={{ padding: 10, borderRadius: 10, border: "1px solid #cbd5e1" }}
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descricao"
            rows={4}
            required
            style={{ padding: 10, borderRadius: 10, border: "1px solid #cbd5e1", resize: "vertical" }}
          />
          <input
            type="datetime-local"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
            required
            style={{ padding: 10, borderRadius: 10, border: "1px solid #cbd5e1" }}
          />
          <button
            type="submit"
            disabled={saving}
            style={{ width: "fit-content", borderRadius: 10, border: "none", padding: "12px 16px", background: "#2563eb", color: "#fff", cursor: "pointer", fontWeight: 600 }}
          >
            {saving ? "Criando…" : "Criar nota"}
          </button>
        </form>
      </section>
    </div>
  );
}
