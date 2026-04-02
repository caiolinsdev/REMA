import { StyleSheet, Text, View } from "react-native";

type Props = { title: string; subtitle?: string };

export function PlaceholderScreen({ title, subtitle }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    padding: 24,
    backgroundColor: "#f8fafc",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
  },
  sub: {
    fontSize: 15,
    color: "#64748b",
    lineHeight: 22,
  },
});
