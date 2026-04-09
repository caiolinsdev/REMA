import { StyleSheet, Text, View } from "react-native";
import { useRoute } from "@react-navigation/native";

import { BodyText } from "../components/ui/BodyText";
import { Screen } from "../components/ui/Screen";
import { SectionTitle } from "../components/ui/Title";
import { theme } from "../theme";

export type PhasePlaceholderParams = {
  title: string;
  phase: number;
};

export function PhasePlaceholderScreen() {
  const route = useRoute();
  const params = route.params as PhasePlaceholderParams | undefined;
  const title = params?.title ?? "REMA";
  const phase = params?.phase ?? 2;

  return (
    <Screen scroll>
      <SectionTitle>{title}</SectionTitle>
      <View style={styles.box}>
        <BodyText>
          Esta área será implementada na Fase {phase} do mobile (paridade com a web).
        </BodyText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  box: {
    marginTop: theme.space.md,
    padding: theme.space.md,
    borderWidth: 1,
    borderColor: theme.colors.dashed,
    borderStyle: "dashed",
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.surface,
  },
});
