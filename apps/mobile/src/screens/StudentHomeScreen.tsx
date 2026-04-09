import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { StudentHomeSummary, StudentHomeUpcomingItem } from "@rema/contracts";

import { BodyText, MutedText } from "../components/ui/BodyText";
import { ErrorBanner } from "../components/ui/ErrorBanner";
import { LoadingCenter } from "../components/ui/LoadingCenter";
import { Screen } from "../components/ui/Screen";
import { SectionTitle, Title } from "../components/ui/Title";
import { useAuth } from "../context/AuthContext";
import { apiStudentHomeSummary } from "../lib/api";
import { theme } from "../theme";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function truncateText(value: string, max = 120) {
  if (value.length <= max) return value;
  return `${value.slice(0, max).trimEnd()}...`;
}

function upcomingTypeLabel(item: StudentHomeUpcomingItem) {
  if (item.source === "personal_note") return "Nota";
  if (item.eventType === "other") return "Evento";
  return "Prazo";
}

export function StudentHomeScreen() {
  const { token } = useAuth();
  const [summary, setSummary] = useState<StudentHomeSummary | null>(null);
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
    apiStudentHomeSummary(token)
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
      <Title>Área do aluno</Title>
      <BodyText style={styles.lead}>
        Acompanhe o que apareceu de novo na comunidade e os próximos compromissos da sua rotina.
      </BodyText>

      {error ? <ErrorBanner message={error} /> : null}

      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <View style={styles.flex}>
            <SectionTitle>Posts recentes</SectionTitle>
            <MutedText style={styles.sectionHint}>
              Últimas publicações aprovadas para alunos.
            </MutedText>
          </View>
          <Text style={styles.link}>Ver comunidade (Fase 4)</Text>
        </View>

        {summary?.recentPosts.length ? (
          summary.recentPosts.map((post) => (
            <View key={post.id} style={styles.card}>
              <Text style={styles.cardTitle}>{post.title}</Text>
              <BodyText>{truncateText(post.body)}</BodyText>
              <MutedText>Publicado em {formatDate(post.createdAt)}</MutedText>
            </View>
          ))
        ) : (
          <View style={styles.empty}>
            <MutedText>Nenhum post recente disponível.</MutedText>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <View style={styles.flex}>
            <SectionTitle>Próximos compromissos</SectionTitle>
            <MutedText style={styles.sectionHint}>
              Próximas entregas, eventos e anotações do seu calendário.
            </MutedText>
          </View>
          <Text style={styles.link}>Calendário (Fase 3)</Text>
        </View>

        {summary?.upcomingItems.length ? (
          summary.upcomingItems.map((item) => (
            <View key={item.id} style={styles.card}>
              <View style={styles.rowBetween}>
                <Text style={styles.cardTitleStrong}>{item.title}</Text>
                <Text style={styles.badge}>{upcomingTypeLabel(item)}</Text>
              </View>
              {item.description ? (
                <BodyText>{truncateText(item.description, 140)}</BodyText>
              ) : null}
              <MutedText>{formatDate(item.startAt)}</MutedText>
            </View>
          ))
        ) : (
          <View style={styles.empty}>
            <MutedText>Nenhum compromisso futuro encontrado.</MutedText>
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
    maxWidth: 120,
    textAlign: "right",
  },
  card: {
    borderWidth: 1,
    borderColor: theme.colors.borderMuted,
    borderRadius: theme.radius.md,
    padding: theme.space.md,
    gap: theme.space.xs,
  },
  cardTitle: {
    fontSize: theme.font.heading,
    fontWeight: "600",
    color: theme.colors.text,
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
  },
  badge: {
    color: theme.colors.primary,
    fontWeight: "700",
    fontSize: theme.font.caption,
  },
  empty: {
    borderWidth: 1,
    borderColor: theme.colors.dashed,
    borderStyle: "dashed",
    borderRadius: theme.radius.md,
    padding: theme.space.md,
  },
});
