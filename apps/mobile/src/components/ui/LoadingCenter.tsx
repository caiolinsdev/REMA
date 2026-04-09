import { ActivityIndicator, StyleSheet, View } from "react-native";

import { theme } from "../../theme";

export function LoadingCenter() {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    minHeight: 120,
    justifyContent: "center",
    alignItems: "center",
  },
});
