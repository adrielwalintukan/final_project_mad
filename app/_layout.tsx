import { Stack } from "expo-router";
import { AppConvexProvider } from "../lib/convexClient";
import { AuthProvider } from "../context/AuthContext";
import { LanguageProvider } from "../context/LanguageContext";

export default function RootLayout() {
  return (
    <AppConvexProvider>
      <AuthProvider>
        <LanguageProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="ai-chat" options={{ presentation: "modal" }} />
          </Stack>
        </LanguageProvider>
      </AuthProvider>
    </AppConvexProvider>
  );
}