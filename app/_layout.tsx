import "react-native-gesture-handler";

import { Ionicons } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  const [fontsReady] = useFonts(Ionicons.font);

  if (!fontsReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="transactions" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="income-cycle" />
          <Stack.Screen name="categories" />
          <Stack.Screen name="reminders" />
        <Stack.Screen name="annual-summary" />
        <Stack.Screen name="monthly-review" />
        <Stack.Screen name="data-management" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
