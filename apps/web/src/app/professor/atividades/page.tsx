"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { ActivitySummary } from "@rema/contracts";
import { apiActivities } from "@/lib/api";
import { getStoredToken } from "@/lib/cookies";

function formatDate(value: string | null) {
  if (!value) return "Sem prazo";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function Page() {
  const [activities, setActivities] = useState<ActivitySummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getStoredToken();
    if (!token) return;
    apiActivities(token).then(setActivities).catch((err) => setError(err instanceof Error ? err.message : "Falha ao carregar atividades"));
  }, []);

  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ marginTop: 0 }}>Provas, atividades e trabalhos</h1>
          <p style={{ color: "#64748b", lineHeight: 1.6 }}>
            Area do professor para criar, editar drafts e publicar itens academicos.
          </p>
        </div>
        <Link
          href="/professor/atividades/novo"
          style={{ borderRadius: 10, background: "#2563eb", color: "#fff", textDecoration: "none", padding: "12px 16px", fontWeight: 600 }}
        >
          Nova atividade
        </Link>
      </div>

      {error ? <div style={{ color: "#b91c1c" }}>{error}</div> : null}

      <div style={{ display: "grid", gap: 16 }}>
        {activities.map((activity) => (
          <article key={activity.id} style={{ border: "1px solid #dbe4f0", borderRadius: 16, padding: 18, background: "#fff" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
              <div>
                <h2 style={{ margin: "0 0 8px" }}>{activity.title}</h2>
                <p style={{ margin: 0, color: "#64748b" }}>
                  {activity.kind} · {activity.status} · prazo {formatDate(activity.dueAt)}
                </p>
              </div>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ color: "#0f172a", fontWeight: 600 }}>Total: {activity.totalScore}</span>
                <Link href={`/professor/atividades/${activity.id}`} style={{ color: "#2563eb", fontWeight: 600 }}>
                  Abrir
                </Link>
              </div>
            </div>
          </article>
        ))}
        {activities.length === 0 && !error ? (
          <div style={{ border: "1px dashed #cbd5e1", borderRadius: 16, padding: 18, color: "#64748b" }}>
            Nenhuma atividade criada ainda.
          </div>
        ) : null}
      </div>
    </div>
  );
}
