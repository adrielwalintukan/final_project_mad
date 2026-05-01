import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { makeRedirectUri } from "expo-auth-session";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../convex/_generated/api";

// Ensure smooth redirect back after Google login
WebBrowser.maybeCompleteAuthSession();

const { width, height } = Dimensions.get("window");

// ─── Color Tokens ───
const C = {
  primary: "#0d631b",
  primaryContainer: "#2e7d32",
  primaryFixed: "#a3f69c",
  onPrimary: "#ffffff",
  background: "#f8f9fa",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerLow: "#f3f4f5",
  surfaceContainerHigh: "#e7e8e9",
  onSurface: "#191c1d",
  onSurfaceVariant: "#40493d",
  outline: "#707a6c",
  outlineVariant: "#bfcaba",
  error: "#ba1a1a",
};

// ─── Forgot Password Modal ───
function ForgotPasswordModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState<"email" | "reset" | "done">("email");
  const [fpEmail, setFpEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const resetPasswordMutation = useMutation(api.auth.resetPassword);

  const handleClose = () => {
    setStep("email");
    setFpEmail("");
    setNewPassword("");
    setConfirmPassword("");
    setIsLoading(false);
    onClose();
  };

  const handleSubmitEmail = () => {
    if (!fpEmail.trim() || !fpEmail.includes("@")) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }
    setStep("reset");
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      Alert.alert("Invalid Password", "Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Mismatch", "Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      await resetPasswordMutation({
        email: fpEmail.trim(),
        newPassword: newPassword,
      });
      setStep("done");
    } catch (error: any) {
      const msg = error?.data ?? error?.message ?? "Failed to reset password.";
      Alert.alert("Error", msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={fpStyles.overlay}>
        <View style={fpStyles.card}>
          <TouchableOpacity style={fpStyles.closeBtn} onPress={handleClose} activeOpacity={0.7}>
            <Ionicons name="close" size={22} color={C.onSurfaceVariant} />
          </TouchableOpacity>

          {step === "email" && (
            <>
              <Ionicons name="lock-open-outline" size={40} color={C.primary} style={{ alignSelf: "center", marginBottom: 16 }} />
              <Text style={fpStyles.title}>Forgot Password?</Text>
              <Text style={fpStyles.subtitle}>
                Enter your email address to reset your password.
              </Text>
              <View style={fpStyles.inputWrap}>
                <Ionicons name="mail-outline" size={18} color={C.outline} style={{ marginRight: 10 }} />
                <TextInput
                  style={fpStyles.input}
                  placeholder="Enter your email"
                  placeholderTextColor={C.outline}
                  value={fpEmail}
                  onChangeText={setFpEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <TouchableOpacity activeOpacity={0.85} onPress={handleSubmitEmail}>
                <LinearGradient
                  colors={[C.primary, C.primaryContainer]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={fpStyles.button}
                >
                  <Text style={fpStyles.buttonText}>Continue</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}

          {step === "reset" && (
            <>
              <Ionicons name="key-outline" size={40} color={C.primary} style={{ alignSelf: "center", marginBottom: 16 }} />
              <Text style={fpStyles.title}>Reset Password</Text>
              <Text style={fpStyles.subtitle}>
                Create a new password for {fpEmail}
              </Text>
              <View style={fpStyles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color={C.outline} style={{ marginRight: 10 }} />
                <TextInput
                  style={fpStyles.input}
                  placeholder="New password"
                  placeholderTextColor={C.outline}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNew}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowNew(!showNew)}>
                  <Ionicons name={showNew ? "eye-outline" : "eye-off-outline"} size={18} color={C.outline} />
                </TouchableOpacity>
              </View>
              <View style={fpStyles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color={C.outline} style={{ marginRight: 10 }} />
                <TextInput
                  style={fpStyles.input}
                  placeholder="Confirm password"
                  placeholderTextColor={C.outline}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                  <Ionicons name={showConfirm ? "eye-outline" : "eye-off-outline"} size={18} color={C.outline} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity activeOpacity={0.85} onPress={handleResetPassword} disabled={isLoading}>
                <LinearGradient
                  colors={[C.primary, C.primaryContainer]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={fpStyles.button}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={fpStyles.buttonText}>Reset Password</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}

          {step === "done" && (
            <>
              <Ionicons name="checkmark-circle" size={56} color={C.primary} style={{ alignSelf: "center", marginBottom: 16 }} />
              <Text style={fpStyles.title}>Password Reset!</Text>
              <Text style={fpStyles.subtitle}>
                Your password has been updated. You can now sign in with your new password.
              </Text>
              <TouchableOpacity activeOpacity={0.85} onPress={handleClose}>
                <LinearGradient
                  colors={[C.primary, C.primaryContainer]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={fpStyles.button}
                >
                  <Text style={fpStyles.buttonText}>Back to Login</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const fpStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 28,
  },
  closeBtn: {
    position: "absolute",
    top: 14,
    right: 14,
    zIndex: 1,
    padding: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: C.onSurface,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "400",
    color: C.onSurfaceVariant,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surfaceContainerLow,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 14,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: C.onSurface,
  },
  button: {
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});

// ─── Login Screen ───
export default function LoginScreen() {
  const router = useRouter();
  const { setUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [forgotModalVisible, setForgotModalVisible] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  // Convex mutations
  const loginUser = useMutation(api.auth.loginUser);
  const loginWithGoogle = useMutation(api.auth.loginWithGoogle);

  // ─── Google Sign-In via WebBrowser + Convex redirect ───
  // Uses your Convex site URL as the OAuth redirect endpoint.
  // Google redirects there → HTML page deep-links back to the app.
  const GOOGLE_REDIRECT_URI = `${process.env.EXPO_PUBLIC_CONVEX_SITE_URL}/auth/google/callback`;

  // Refs to avoid stale closures in the Google sign-in flow
  const setUserRef = useRef(setUser);
  const routerRef = useRef(router);
  const loginWithGoogleRef = useRef(loginWithGoogle);
  useEffect(() => {
    setUserRef.current = setUser;
    routerRef.current = router;
    loginWithGoogleRef.current = loginWithGoogle;
  });

  // Decode Google user info from the id_token JWT (no API call needed!)
  const handleGoogleIdToken = async (idToken: string) => {
    try {
      console.log("[GoogleAuth] Decoding id_token...");
      
      // JWT format: header.payload.signature — we only need the payload
      const parts = idToken.split(".");
      if (parts.length < 2) {
        throw new Error("Invalid id_token format");
      }

      // Base64url decode the payload
      let payload = parts[1];
      // Fix base64url → base64 (replace URL-safe chars, add padding)
      payload = payload.replace(/-/g, "+").replace(/_/g, "/");
      while (payload.length % 4 !== 0) {
        payload += "=";
      }
      
      const decoded = JSON.parse(atob(payload));
      console.log("[GoogleAuth] Decoded email:", decoded.email);
      console.log("[GoogleAuth] Decoded name:", decoded.name);

      // Save to Convex database
      const userData = await loginWithGoogleRef.current({
        name: decoded.name || "Google User",
        email: decoded.email,
        photoUrl: decoded.picture,
      });

      console.log("[GoogleAuth] Convex login success, userId:", userData._id);

      setUserRef.current({
        _id: userData._id,
        name: userData.name,
        email: userData.email,
        photoUrl: userData.photoUrl,
        createdAt: userData.createdAt,
      });

      console.log("[GoogleAuth] User set, navigating to home...");
      routerRef.current.replace("/(tabs)/home");
    } catch (error: any) {
      console.error("[GoogleAuth] handleGoogleIdToken error:", error?.message || error);
      const msg = error?.data ?? error?.message ?? "Google sign-in failed.";
      Alert.alert("Google Sign In Failed", msg);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleSignIn = useCallback(async () => {
    const clientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
    if (!clientId) {
      Alert.alert("Error", "Google Client ID is not configured.");
      return;
    }

    setIsGoogleLoading(true);

    try {
      const returnUrl = makeRedirectUri();
      
      // Generate a random nonce (required for id_token request)
      const nonce = Math.random().toString(36).substring(2) + Date.now().toString(36);

      // Request id_token + token so we can get user info from the JWT directly
      // (no need to call Google's userinfo API)
      const authUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}` +
        `&redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}` +
        `&response_type=${encodeURIComponent("id_token token")}` +
        `&scope=${encodeURIComponent("openid profile email")}` +
        `&state=${encodeURIComponent(returnUrl)}` +
        `&nonce=${encodeURIComponent(nonce)}` +
        `&prompt=select_account`;

      // Warm up the browser for better performance
      if (Platform.OS === "android") {
        await WebBrowser.warmUpAsync();
      }

      // Open Browser Session
      const result = await WebBrowser.openAuthSessionAsync(authUrl, returnUrl);

      // Cool down the browser
      if (Platform.OS === "android") {
        await WebBrowser.coolDownAsync();
      }

      console.log("[GoogleAuth] result.type:", result.type);

      if (result.type === "success" && result.url) {
        const url = result.url;
        
        // Extract id_token from the URL
        const idTokenMatch = url.match(/id_token=([^&#]+)/);
        const idToken = idTokenMatch ? decodeURIComponent(idTokenMatch[1]) : null;

        console.log("[GoogleAuth] id_token found:", !!idToken);

        if (idToken) {
          await handleGoogleIdToken(idToken);
        } else {
          setIsGoogleLoading(false);
          Alert.alert("Error", "Gagal mendapatkan token dari Google.");
        }
      } else {
        // User cancelled or browser dismissed
        setIsGoogleLoading(false);
      }
    } catch (error: any) {
      console.error("[GoogleAuth] Error:", error);
      setIsGoogleLoading(false);
      Alert.alert("Error", "Gagal memulai login Google.");
    }
  }, []);

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

  // ── Email / Password Sign In ──
  const handleSignIn = useCallback(async () => {
    if (!email.trim()) {
      Alert.alert("Missing Email", "Please enter your email address.");
      return;
    }
    if (!password.trim()) {
      Alert.alert("Missing Password", "Please enter your password.");
      return;
    }

    setIsLoading(true);

    Animated.sequence([
      Animated.timing(buttonScale, { toValue: 0.96, duration: 80, useNativeDriver: true }),
      Animated.timing(buttonScale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();

    try {
      const userData = await loginUser({
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
      Alert.alert("Login Failed", msg);
    } finally {
      setIsLoading(false);
    }
  }, [email, password]);

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
          {/* ━━━ TOP HEADER / BRAND ━━━ */}
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
            <Text style={styles.appSubtitle}>Track your money smarter with AI</Text>
          </Animated.View>

          {/* ━━━ WELCOME SECTION ━━━ */}
          <Animated.View
            style={[
              styles.welcomeSection,
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <Text style={styles.welcomeTitle}>Welcome Back</Text>
            <Text style={styles.welcomeSubtext}>
              Login to continue managing your finances
            </Text>
          </Animated.View>

          {/* ━━━ LOGIN FORM CARD ━━━ */}
          <Animated.View style={[styles.formCard, styles.elevation, { opacity: fadeAnim }]}>
            {/* Email Input */}
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

            {/* Password Input */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={C.outline} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={C.outline}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleSignIn}
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

            {/* Forgot Password */}
            <TouchableOpacity
              style={styles.forgotButton}
              activeOpacity={0.7}
              onPress={() => setForgotModalVisible(true)}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Sign In Button */}
            <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleSignIn}
                disabled={isLoading}
                style={styles.signInButtonWrap}
              >
                <LinearGradient
                  colors={[C.primary, C.primaryContainer]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.signInButton}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <Text style={styles.signInText}>Sign In</Text>
                      <Ionicons name="arrow-forward" size={20} color="#ffffff" style={{ marginLeft: 8 }} />
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>

          {/* ━━━ DIVIDER ━━━ */}
          <Animated.View style={[styles.dividerRow, { opacity: fadeAnim }]}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </Animated.View>

          {/* ━━━ GOOGLE LOGIN — opens native account picker ━━━ */}
          <Animated.View style={{ opacity: fadeAnim }}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.googleButton, styles.elevation]}
              onPress={handleGoogleSignIn}
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                <ActivityIndicator color={C.onSurface} size="small" style={{ marginRight: 12 }} />
              ) : (
                <Image
                  source={{ uri: "https://developers.google.com/identity/images/g-logo.png" }}
                  style={styles.googleIcon}
                />
              )}
              <Text style={styles.googleButtonText}>Continue with Google</Text>
            </TouchableOpacity>
          </Animated.View>

          {/* ━━━ REGISTER CTA ━━━ */}
          <Animated.View style={[styles.registerRow, { opacity: fadeAnim }]}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => router.push("/auth/signup")}>
              <Text style={styles.registerLink}>Sign Up</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Forgot Password Modal ── */}
      <ForgotPasswordModal
        visible={forgotModalVisible}
        onClose={() => setForgotModalVisible(false)}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },

  // Header
  headerArea: {
    alignItems: "center",
    marginTop: 16,
    marginBottom: 32,
  },
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

  // Welcome
  welcomeSection: {
    marginBottom: 24,
  },
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

  // Form Card
  formCard: {
    backgroundColor: C.surfaceContainerLowest,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },

  // Inputs
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
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: C.onSurface,
  },
  eyeButton: {
    padding: 4,
  },

  // Forgot
  forgotButton: {
    alignSelf: "flex-end",
    marginBottom: 20,
    marginTop: 2,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: "600",
    color: C.primary,
  },

  // Sign In
  signInButtonWrap: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  signInButton: {
    height: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  signInText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: 0.3,
  },

  // Divider
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: C.outlineVariant,
  },
  dividerText: {
    fontSize: 13,
    fontWeight: "500",
    color: C.outline,
    paddingHorizontal: 16,
  },

  // Google
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.surfaceContainerLowest,
    borderRadius: 14,
    height: 56,
    borderWidth: 1.5,
    borderColor: C.outlineVariant,
    marginBottom: 32,
  },
  googleIcon: {
    width: 22,
    height: 22,
    marginRight: 12,
  },
  googleButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: C.onSurface,
  },

  // Register CTA
  registerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  registerText: {
    fontSize: 14,
    fontWeight: "400",
    color: C.onSurfaceVariant,
  },
  registerLink: {
    fontSize: 14,
    fontWeight: "700",
    color: C.primary,
  },

  // Utility
  elevation: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
});
