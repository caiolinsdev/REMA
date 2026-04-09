import type { TextProps } from "react-native";
import { StyleSheet, Text } from "react-native";

import { theme } from "../../theme";

export function BodyText({ style, ...rest }: TextProps) {
  return <Text style={[styles.body, style]} {...rest} />;
}

export function MutedText({ style, ...rest }: TextProps) {
  return <Text style={[styles.muted, style]} {...rest} />;
}

const styles = StyleSheet.create({
  body: {
    fontSize: theme.font.body,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  muted: {
    fontSize: theme.font.caption,
    color: theme.colors.muted,
    lineHeight: 20,
  },
});
