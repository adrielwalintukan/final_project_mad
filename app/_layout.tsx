import { Slot } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AppConvexProvider } from "../lib/convexClient";
import { AuthProvider } from "../context/AuthContext";
import { LanguageProvider } from "../context/LanguageContext";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AppConvexProvider>
        <AuthProvider>
          <LanguageProvider>
            <Slot />
          </LanguageProvider>
        </AuthProvider>
      </AppConvexProvider>
    </SafeAreaProvider>
  );
}
