import type { CalendarEventSummary, PersonalCalendarNote } from "@rema/contracts";

export type CalendarItemCategory = "academic_deadline" | "manual_event" | "personal_note";

export type CalendarItem = {
  id: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string | null;
  category: CalendarItemCategory;
  label: string;
  color: string;
};

export const WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"] as const;

export function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

export function startOfMonth(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), 1);
}

export function addDays(value: Date, amount: number) {
  const next = new Date(value);
  next.setDate(next.getDate() + amount);
  return next;
}

export function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function dateKey(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(
    value.getDate(),
  ).padStart(2, "0")}`;
}

export function itemDateKey(iso: string) {
  return dateKey(new Date(iso));
}

export function formatMonthLabel(value: Date) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(value);
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function toCalendarItem(event: CalendarEventSummary): CalendarItem {
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
    label: "Prazo acadêmico",
    color: "#b45309",
  };
}

export function toNoteItem(note: PersonalCalendarNote): CalendarItem {
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
