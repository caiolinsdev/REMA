import type { TextProps } from "react-native";
import { StyleSheet, Text, View } from "react-native";

import { theme } from "../../theme";

type Props = { message: string; textProps?: TextProps };

export function ErrorBanner({ message, textProps }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.text} {...textProps}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: theme.colors.errorBg,
    borderWidth: 1,
    borderColor: theme.colors.errorBorder,
    borderRadius: theme.radius.lg,
    padding: theme.space.md,
    marginBottom: theme.space.lg,
  },
  text: {
    color: theme.colors.errorText,
    fontSize: theme.font.body,
  },
});
