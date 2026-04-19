import { Slot } from "expo-router";
import { AppConvexProvider } from "../lib/convexClient";
import { AuthProvider } from "../context/AuthContext";
import { LanguageProvider } from "../context/LanguageContext";

export default function RootLayout() {
  return (
    <AppConvexProvider>
      <AuthProvider>
        <LanguageProvider>
          <Slot />
        </LanguageProvider>
      </AuthProvider>
    </AppConvexProvider>
  );
}
