import type { NativeStackNavigationOptions } from "@react-navigation/native-stack";

export const theme = {
  colors: {
    bg: "#f8fafc",
    surface: "#ffffff",
    border: "#dbe4f0",
    borderMuted: "#e2e8f0",
    text: "#0f172a",
    textSecondary: "#475569",
    muted: "#64748b",
    primary: "#2563eb",
    navBg: "#0f172a",
    navText: "#f8fafc",
    errorBg: "#fef2f2",
    errorBorder: "#fecaca",
    errorText: "#b91c1c",
    dashed: "#cbd5e1",
    loginBg: "#0f172a",
    loginAccent: "#93c5fd",
    loginMuted: "#94a3b8",
  },
  space: {
    xs: 6,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
  },
  radius: {
    sm: 10,
    md: 14,
    lg: 18,
  },
  font: {
    title: 22,
    heading: 18,
    body: 15,
    caption: 14,
    small: 13,
  },
} as const;

export const stackScreenOptions: NativeStackNavigationOptions = {
  headerStyle: { backgroundColor: theme.colors.navBg },
  headerTintColor: theme.colors.navText,
  headerTitleStyle: { fontWeight: "600" },
  contentStyle: { backgroundColor: theme.colors.bg },
};
