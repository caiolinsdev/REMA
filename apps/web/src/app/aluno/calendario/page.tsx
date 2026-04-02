"use client";

import { useEffect, useState } from "react";

import type { CalendarEventSummary, PersonalCalendarNote } from "@rema/contracts";
import { apiCalendarEvents, apiCalendarNotes, apiCreateCalendarNote } from "@/lib/api";
import { getStoredToken } from "@/lib/cookies";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function Page() {
  const [events, setEvents] = useState<CalendarEventSummary[]>([]);
  const [notes, setNotes] = useState<PersonalCalendarNote[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startAt, setStartAt] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    Promise.all([apiCalendarEvents(token), apiCalendarNotes(token)])
      .then(([loadedEvents, loadedNotes]) => {
        setEvents(loadedEvents);
        setNotes(loadedNotes);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Falha ao carregar calendario"));
  }, []);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const token = getStoredToken();
    if (!token) return;
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
      setStartAt("");
      const [loadedEvents, loadedNotes] = await Promise.all([
        apiCalendarEvents(token),
        apiCalendarNotes(token),
      ]);
      setEvents(loadedEvents);
      setNotes(loadedNotes);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao criar nota pessoal");
    }
  }

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div>
        <h1 style={{ marginTop: 0 }}>Calendario</h1>
        <p style={{ color: "#64748b", lineHeight: 1.6 }}>
          Datas academicas automaticas e notas pessoais visiveis so para voce.
        </p>
      </div>

      {error ? <div style={{ color: "#b91c1c" }}>{error}</div> : null}

      <form onSubmit={onSubmit} style={{ background: "#fff", border: "1px solid #dbe4f0", borderRadius: 16, padding: 20, display: "grid", gap: 12 }}>
        <h2 style={{ margin: 0 }}>Nova nota pessoal</h2>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titulo" required style={{ padding: 10, borderRadius: 10, border: "1px solid #cbd5e1" }} />
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descricao" rows={3} required style={{ padding: 10, borderRadius: 10, border: "1px solid #cbd5e1", resize: "vertical" }} />
        <input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} required style={{ padding: 10, borderRadius: 10, border: "1px solid #cbd5e1" }} />
        <button type="submit" style={{ width: "fit-content", borderRadius: 10, border: "none", padding: "12px 16px", background: "#2563eb", color: "#fff", cursor: "pointer", fontWeight: 600 }}>
          Criar nota
        </button>
      </form>

      <section style={{ display: "grid", gap: 16 }}>
        <h2 style={{ marginBottom: 0 }}>Eventos do calendario</h2>
        {events.map((calendarEvent) => (
          <article key={calendarEvent.id} style={{ background: "#fff", border: "1px solid #dbe4f0", borderRadius: 16, padding: 18 }}>
            <h3 style={{ margin: "0 0 8px" }}>{calendarEvent.title}</h3>
            <p style={{ margin: "0 0 8px", color: "#64748b" }}>
              {calendarEvent.type} · {formatDate(calendarEvent.startAt)}
            </p>
            {calendarEvent.description ? (
              <p style={{ margin: 0, color: "#334155" }}>{calendarEvent.description}</p>
            ) : null}
          </article>
        ))}
      </section>

      <section style={{ display: "grid", gap: 16 }}>
        <h2 style={{ marginBottom: 0 }}>Minhas notas</h2>
        {notes.map((note) => (
          <article key={note.id} style={{ background: "#fff", border: "1px solid #dbe4f0", borderRadius: 16, padding: 18 }}>
            <h3 style={{ margin: "0 0 8px" }}>{note.title}</h3>
            <p style={{ margin: "0 0 8px", color: "#64748b" }}>{formatDate(note.startAt)}</p>
            <p style={{ margin: 0, color: "#334155" }}>{note.description}</p>
          </article>
        ))}
        {notes.length === 0 ? (
          <div style={{ border: "1px dashed #cbd5e1", borderRadius: 16, padding: 18, color: "#64748b" }}>
            Nenhuma nota pessoal criada ainda.
          </div>
        ) : null}
      </section>
    </div>
  );
}
