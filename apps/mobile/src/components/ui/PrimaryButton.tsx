import type { ReactNode } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  type TouchableOpacityProps,
} from "react-native";

import { theme } from "../../theme";

type Props = TouchableOpacityProps & {
  children: ReactNode;
  loading?: boolean;
};

export function PrimaryButton({ children, loading, disabled, style, ...rest }: Props) {
  return (
    <TouchableOpacity
      style={[styles.btn, (disabled || loading) && styles.btnDisabled, style]}
      disabled={disabled || loading}
      activeOpacity={0.85}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.label}>{children}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.sm,
    paddingVertical: 14,
    paddingHorizontal: theme.space.lg,
    alignItems: "center",
  },
  btnDisabled: {
    opacity: 0.7,
  },
  label: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
