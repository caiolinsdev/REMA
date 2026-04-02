import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";

import { useAuth } from "../context/AuthContext";
import { LoginScreen } from "../screens/LoginScreen";
import { MainDrawer } from "./MainDrawer";

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const { token, booting } = useAuth();

  if (booting) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8fafc" }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {token ? (
        <Stack.Screen name="Main" component={MainDrawer} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}
