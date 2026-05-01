import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../../context/AuthContext";

// ─── Color Tokens ───
const C = {
  primary: "#0d631b",
  primaryContainer: "#2e7d32",
  primaryFixed: "#a3f69c",
  onPrimary: "#ffffff",
  background: "#f8f9fa",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerLow: "#f3f4f5",
  onSurface: "#191c1d",
  onSurfaceVariant: "#40493d",
  outline: "#707a6c",
  outlineVariant: "#bfcaba",
};

export default function SignupScreen() {
  const router = useRouter();
  const { setUser } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  // Convex mutation — uses auth.registerUser with password hashing
  const registerUser = useMutation(api.auth.registerUser);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleSignUp = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert("Missing Name", "Please enter your full name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }
    if (!password.trim() || password.length < 6) {
      Alert.alert("Invalid Password", "Password must be at least 6 characters.");
      return;
    }

    setIsLoading(true);

    Animated.sequence([
      Animated.timing(buttonScale, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(buttonScale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();

    try {
      const userData = await registerUser({
        name: name.trim(),
        email: email.trim(),
        password: password,
      });

      setUser({
        _id: userData._id,
        name: userData.name,
        email: userData.email,
        photoUrl: userData.photoUrl,
        createdAt: userData.createdAt,
      });

      router.replace("/(tabs)/home");
    } catch (error: any) {
      const msg = error?.data ?? error?.message ?? "Something went wrong.";
      Alert.alert("Sign Up Failed", msg);
    } finally {
      setIsLoading(false);
    }
  }, [name, email, password]);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
        >
          {/* ━━━ HEADER ━━━ */}
          <Animated.View
            style={[
              styles.headerArea,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={[C.primary, C.primaryContainer]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.logoGradient}
              >
                <MaterialCommunityIcons name="wallet-plus-outline" size={36} color="#ffffff" />
              </LinearGradient>
            </View>
            <Text style={styles.appName}>DailyBoost AI</Text>
            <Text style={styles.appSubtitle}>Start your smart financial journey</Text>
          </Animated.View>

          {/* ━━━ WELCOME ━━━ */}
          <Animated.View
            style={[
              styles.welcomeSection,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <Text style={styles.welcomeTitle}>Create Account</Text>
            <Text style={styles.welcomeSubtext}>
              Sign up to start tracking your finances with AI
            </Text>
          </Animated.View>

          {/* ━━━ FORM CARD ━━━ */}
          <Animated.View style={[styles.formCard, styles.elevation, { opacity: fadeAnim }]}>
            {/* Name */}
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color={C.outline} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor={C.outline}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            {/* Email */}
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color={C.outline} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor={C.outline}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={C.outline} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Create a password"
                placeholderTextColor={C.outline}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleSignUp}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons
                  name={showPassword ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color={C.outline}
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.passwordHint}>Password must be at least 6 characters</Text>

            {/* Sign Up Button */}
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSignUp}
                disabled={isLoading}
                style={styles.signUpButtonWrap}
              >
                <LinearGradient
                  colors={[C.primary, C.primaryContainer]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.signUpButton}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <Text style={styles.signUpText}>Create Account</Text>
                      <Ionicons name="arrow-forward" size={20} color="#ffffff" style={{ marginLeft: 8 }} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>

          {/* ━━━ LOGIN CTA ━━━ */}
          <Animated.View style={[styles.loginRow, { opacity: fadeAnim }]}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()}>
              <Text style={styles.loginLink}>Sign In</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.background },
  keyboardView: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },

  headerArea: { alignItems: "center", marginTop: 16, marginBottom: 28 },
  logoContainer: {
    marginBottom: 16,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  logoGradient: {
    width: 72,
    height: 72,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    fontSize: 28,
    fontWeight: "800",
    color: C.primary,
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  appSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: C.onSurfaceVariant,
    letterSpacing: 0.2,
  },

  welcomeSection: { marginBottom: 24 },
  welcomeTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: C.onSurface,
    letterSpacing: -0.8,
    marginBottom: 6,
  },
  welcomeSubtext: {
    fontSize: 15,
    fontWeight: "400",
    color: C.onSurfaceVariant,
    lineHeight: 22,
  },

  formCard: {
    backgroundColor: C.surfaceContainerLowest,
    borderRadius: 20,
    padding: 24,
    marginBottom: 32,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surfaceContainerLow,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "transparent",
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 14,
  },
  inputIcon: { marginRight: 12 },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: C.onSurface,
  },
  eyeButton: { padding: 4 },

  passwordHint: {
    fontSize: 12,
    fontWeight: "400",
    color: C.outline,
    marginBottom: 20,
    marginTop: -4,
    paddingLeft: 4,
  },

  signUpButtonWrap: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  signUpButton: {
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  signUpText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.3,
  },

  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loginText: {
    fontSize: 14,
    fontWeight: "400",
    color: C.onSurfaceVariant,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: "700",
    color: C.primary,
  },

  elevation: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
});
