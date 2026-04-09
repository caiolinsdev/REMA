import type { ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { theme } from "../../theme";

type Props = {
  children: ReactNode;
  scroll?: boolean;
  edges?: ("top" | "right" | "bottom" | "left")[];
};

export function Screen({ children, scroll, edges = ["left", "right", "bottom"] }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, styles.pad]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  flex: {
    flex: 1,
  },
  pad: {
    padding: theme.space.xl,
  },
  scrollContent: {
    flexGrow: 1,
    padding: theme.space.xl,
    paddingBottom: theme.space.xl * 2,
  },
});
