export type CalendarEventType =
  | "delivery_prova"
  | "delivery_atividade"
  | "delivery_trabalho"
  | "other";

export interface CalendarEventSummary {
  id: string;
  title: string;
  type: CalendarEventType;
  startAt: string;
  endAt: string | null;
  sourceActivityId?: string | null;
  description?: string | null;
}

export interface PersonalCalendarNote {
  id: string;
  studentId: string;
  title: string;
  description: string;
  startAt: string;
  endAt: string | null;
}

export interface UpsertCalendarEventRequest {
  title: string;
  description: string;
  type: CalendarEventType;
  startAt: string;
  endAt?: string | null;
}

export interface UpsertPersonalCalendarNoteRequest {
  title: string;
  description: string;
  startAt: string;
  endAt?: string | null;
}
