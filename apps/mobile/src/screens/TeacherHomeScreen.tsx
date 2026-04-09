import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { TeacherHomeSummary } from "@rema/contracts";

import { BodyText, MutedText } from "../components/ui/BodyText";
import { ErrorBanner } from "../components/ui/ErrorBanner";
import { LoadingCenter } from "../components/ui/LoadingCenter";
import { Screen } from "../components/ui/Screen";
import { SectionTitle, Title } from "../components/ui/Title";
import { useAuth } from "../context/AuthContext";
import { apiTeacherHomeSummary } from "../lib/api";
import { theme } from "../theme";

function formatDate(value: string | null) {
  if (!value) return "Sem data";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusLabel(value: string) {
  if (value === "published") return "Publicado";
  if (value === "draft") return "Rascunho";
  if (value === "archived") return "Arquivado";
  return value;
}

export function TeacherHomeScreen() {
  const { token } = useAuth();
  const [summary, setSummary] = useState<TeacherHomeSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    apiTeacherHomeSummary(token)
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Falha ao carregar a home");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (loading && !summary) {
    return (
      <Screen scroll={false}>
        <LoadingCenter />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Title>Área do professor</Title>
      <BodyText style={styles.lead}>
        Veja rapidamente os conteúdos mais recentes e o que ainda precisa de correção.
      </BodyText>

      {error ? <ErrorBanner message={error} /> : null}

      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <View style={styles.flex}>
            <SectionTitle>Conteúdos recentes</SectionTitle>
            <MutedText style={styles.sectionHint}>
              Últimos materiais criados ou publicados por você.
            </MutedText>
          </View>
          <Text style={styles.link}>Conteúdos (Fase 3)</Text>
        </View>

        {summary?.recentContents.length ? (
          summary.recentContents.map((content) => (
            <View key={content.id} style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.cardTitleStrong}>{content.title}</Text>
                <MutedText>{statusLabel(content.status)}</MutedText>
              </View>
              <BodyText>{content.subtitle}</BodyText>
              <View style={styles.rowBetween}>
                <MutedText>{formatDate(content.publishedAt ?? null)}</MutedText>
                <Text style={styles.link}>Abrir (Fase 3)</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.empty}>
            <MutedText>Nenhum conteúdo recente encontrado.</MutedText>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <View style={styles.flex}>
            <SectionTitle>Tarefas para corrigir</SectionTitle>
            <MutedText style={styles.sectionHint}>
              Envios já submetidos aguardando sua revisão.
            </MutedText>
          </View>
          <Text style={styles.link}>Tarefas (Fase 2)</Text>
        </View>

        {summary?.pendingReviews.length ? (
          summary.pendingReviews.map((review) => (
            <View key={review.submissionId} style={styles.card}>
              <Text style={styles.cardTitleStrong}>{review.activityTitle}</Text>
              <BodyText>Aluno: {review.studentName}</BodyText>
              <View style={styles.rowBetween}>
                <MutedText>Enviado em {formatDate(review.submittedAt)}</MutedText>
                <Text style={styles.linkMuted}>Correção na Fase 2</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.empty}>
            <MutedText>Nenhuma correção pendente no momento.</MutedText>
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: {
    marginBottom: theme.space.lg,
  },
  flex: {
    flex: 1,
  },
  section: {
    marginBottom: theme.space.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.space.lg,
    gap: theme.space.sm,
  },
  sectionHead: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: theme.space.sm,
    marginBottom: theme.space.xs,
  },
  sectionHint: {
    marginTop: theme.space.xs,
  },
  link: {
    color: theme.colors.primary,
    fontWeight: "600",
    fontSize: theme.font.small,
    maxWidth: 130,
    textAlign: "right",
  },
  linkMuted: {
    color: theme.colors.muted,
    fontWeight: "600",
    fontSize: theme.font.small,
  },
  card: {
    borderWidth: 1,
    borderColor: theme.colors.borderMuted,
    borderRadius: theme.radius.md,
    padding: theme.space.md,
    gap: theme.space.xs,
  },
  cardTitleStrong: {
    fontSize: theme.font.body,
    fontWeight: "700",
    color: theme.colors.text,
    flex: 1,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.space.sm,
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  empty: {
    borderWidth: 1,
    borderColor: theme.colors.dashed,
    borderStyle: "dashed",
    borderRadius: theme.radius.md,
    padding: theme.space.md,
  },
});
