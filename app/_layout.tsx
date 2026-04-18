import { Slot } from "expo-router";
import { AppConvexProvider } from "../lib/convexClient";
import { AuthProvider } from "../context/AuthContext";

export default function RootLayout() {
  return (
    <AppConvexProvider>
      <AuthProvider>
        <Slot />
      </AuthProvider>
    </AppConvexProvider>
  );
}
