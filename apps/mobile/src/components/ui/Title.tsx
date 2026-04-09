import type { TextProps } from "react-native";
import { StyleSheet, Text } from "react-native";

import { theme } from "../../theme";

export function Title({ style, ...rest }: TextProps) {
  return <Text style={[styles.title, style]} {...rest} />;
}

export function SectionTitle({ style, ...rest }: TextProps) {
  return <Text style={[styles.section, style]} {...rest} />;
}

const styles = StyleSheet.create({
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: theme.space.sm,
  },
  section: {
    fontSize: theme.font.heading,
    fontWeight: "700",
    color: theme.colors.text,
  },
});
