import { MaterialIcons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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
import { useLanguage } from "../../context/LanguageContext";
import { api } from "../../convex/_generated/api";
import { useDashboardData } from "../../hooks/useDashboardData";

// ─── Color Tokens ───
const C = {
  primary: "#0d631b",
  primaryFixed: "#a3f69c",
  primaryFixedDim: "#88d982",
  onPrimaryFixed: "#002204",
  secondary: "#4c56af",
  secondaryFixed: "#e0e0ff",
  tertiary: "#923357",
  tertiaryFixed: "#ffd9e2",
  onTertiaryFixed: "#3f001c",
  background: "#f8f9fa",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerLow: "#f3f4f5",
  surfaceContainer: "#edeeef",
  surfaceContainerHigh: "#e7e8e9",
  onSurface: "#191c1d",
  onSurfaceVariant: "#40493d",
  outlineVariant: "rgba(191,202,186,0.2)",
  errorContainer: "#ffdad6",
  onErrorContainer: "#93000a",
  inverseSurface: "#2e3132",
  inverseOnSurface: "#f0f1f2",
};

export default function ProfileScreen() {
  const { user, setUser } = useAuth();
  const router = useRouter();

  // Get real dashboard data
  const dashboard = useDashboardData() as any;
  const totalInsights = dashboard.totalInsights || 0;
  const savingsRate = dashboard.savingsRate || "0.0";

  const { t, language, setLanguage } = useLanguage();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Modal states
  const [personalInfoVisible, setPersonalInfoVisible] = useState(false);
  const [securityVisible, setSecurityVisible] = useState(false);
  const [supportVisible, setSupportVisible] = useState(false);
  const [supportType, setSupportType] = useState<"help" | "about" | "privacy">("help");

  // Form states
  const [newName, setNewName] = useState(user?.name || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const generateUploadUrl = useMutation(api.users.generateUploadUrl);
  const updatePhoto = useMutation(api.users.updatePhoto);
  const updateName = useMutation(api.users.updateName);
  const resetPassword = useMutation(api.auth.resetPassword);
  const resetData = useMutation(api.maintenance.resetUserData);

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled) {
        setIsUploading(true);
        const imageUri = result.assets[0].uri;
        const postUrl = await generateUploadUrl();
        const response = await fetch(imageUri);
        const blob = await response.blob();

        const uploadResult = await fetch(postUrl, {
          method: "POST",
          body: blob,
        });
        const { storageId } = await uploadResult.json();

        const newUrl = await updatePhoto({
          userId: user?._id as any,
          storageId
        });

        if (newUrl) {
          setUser({ ...user, photoUrl: newUrl } as any);
        }
      }
    } catch (error) {
      console.error("Failed to upload image:", error);
      Alert.alert("Upload Failed", "There was an error updating your profile picture.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateName = async () => {
    if (!newName.trim()) return;
    setIsUpdating(true);
    try {
      await updateName({ userId: user?._id as any, name: newName.trim() });
      setUser({ ...user, name: newName.trim() } as any);
      setPersonalInfoVisible(false);
      Alert.alert(t("success"), t("update_success"));
    } catch (e: any) {
      Alert.alert(t("error"), e.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      Alert.alert(t("error"), "Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(t("error"), "Passwords do not match.");
      return;
    }
    setIsUpdating(true);
    try {
      await resetPassword({ email: user?.email as any, newPassword });
      setSecurityVisible(false);
      setNewPassword("");
      setConfirmPassword("");
      Alert.alert(t("success"), t("update_success"));
    } catch (e: any) {
      Alert.alert(t("error"), e.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResetData = () => {
    Alert.alert(
      t("reset_confirm_title"),
      t("reset_confirm_desc"),
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("reset_data"),
          style: "destructive",
          onPress: async () => {
            try {
              await resetData({ userId: user?._id as any });
              Alert.alert(t("success"), "Data has been reset.");
              router.replace("/(tabs)/home");
            } catch (e: any) {
              Alert.alert(t("error"), "Failed to reset data.");
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      t("logout_confirm_title"),
      t("logout_confirm_desc"),
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("logout"),
          style: "destructive",
          onPress: () => {
            setUser(null);
            router.replace("/auth/login");
          },
        },
      ]
    );
  };

  const joinDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(language === "en" ? "en-US" : "id-ID", { month: "short", year: "numeric" })
    : t("recently");

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* ━━━ HEADER ━━━ */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.iconButton}
            onPress={() => setIsMenuVisible(true)}
          >
            <MaterialIcons name="menu" size={24} color={C.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("profile")}</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.iconButton}
          onPress={() => router.push("/chatbot")}
        >
          <MaterialIcons name="auto-awesome" size={24} color={C.primary} />
        </TouchableOpacity>
      </View>

      {/* ━━━ MODALS ━━━ */}
      <Modal visible={isMenuVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalDismissArea} activeOpacity={1} onPress={() => setIsMenuVisible(false)} />
          <View style={styles.sideMenu}>
            <View style={styles.sideMenuHeader}>
              <Text style={styles.sideMenuTitle}>{t("menu")}</Text>
              <TouchableOpacity onPress={() => setIsMenuVisible(false)}><MaterialIcons name="close" size={24} color={C.onSurfaceVariant} /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { icon: "sync", title: t("refresh_data"), action: () => { setIsMenuVisible(false); Alert.alert(t("synced"), t("data_updated")); } },
                { icon: "file-download", title: t("export_summary"), action: () => { setIsMenuVisible(false); Alert.alert(t("exporting"), t("export_desc")); } },
                { icon: "auto-awesome", title: t("ai_settings"), action: () => { setIsMenuVisible(false); Alert.alert(t("ai_settings"), t("ai_settings_msg")); } },
                { icon: "star-rate", title: t("rate_app"), action: () => { setIsMenuVisible(false); Alert.alert(t("thank_you"), t("redirect_store")); } },
                { icon: "bug-report", title: t("report_bug"), action: () => { setIsMenuVisible(false); } },
              ].map((item, idx) => (
                <TouchableOpacity key={idx} style={styles.sideMenuItem} activeOpacity={0.7} onPress={item.action}>
                  <MaterialIcons name={item.icon as any} size={22} color={C.onSurface} />
                  <Text style={styles.sideMenuText}>{item.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Personal Information Modal */}
      <Modal visible={personalInfoVisible} transparent animationType="slide">
        <View style={styles.fullModalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("personal_info")}</Text>
              <TouchableOpacity onPress={() => setPersonalInfoVisible(false)}><MaterialIcons name="close" size={24} /></TouchableOpacity>
            </View>
            <Text style={styles.inputLabel}>{t("new_name")}</Text>
            <TextInput
              style={styles.textInput}
              value={newName}
              onChangeText={setNewName}
              placeholder={user?.name}
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleUpdateName} disabled={isUpdating}>
              {isUpdating ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{t("save")}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Security Modal */}
      <Modal visible={securityVisible} transparent animationType="slide">
        <View style={styles.fullModalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t("security_password")}</Text>
              <TouchableOpacity onPress={() => setSecurityVisible(false)}><MaterialIcons name="close" size={24} /></TouchableOpacity>
            </View>
            <Text style={styles.inputLabel}>{t("new_password")}</Text>
            <TextInput
              style={styles.textInput}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              placeholder="••••••••"
            />
            <Text style={styles.inputLabel}>{t("confirm_password")}</Text>
            <TextInput
              style={styles.textInput}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholder="••••••••"
            />
            <TouchableOpacity style={styles.saveBtn} onPress={handleChangePassword} disabled={isUpdating}>
              {isUpdating ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{t("change_password")}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Support Modals */}
      <Modal visible={supportVisible} transparent animationType="fade">
        <View style={styles.fullModalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t(supportType === "help" ? "help_center" : supportType === "about" ? "about_app" : "privacy_policy")}</Text>
              <TouchableOpacity onPress={() => setSupportVisible(false)}><MaterialIcons name="close" size={24} /></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalBodyText}>
                {t(supportType === "help" ? "help_center_content" : supportType === "about" ? "about_app_content" : "privacy_policy_content")}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* ━━━ HERO PROFILE SECTION ━━━ */}
        <View style={[styles.heroSection, styles.elevation]}>
          <View style={styles.heroBackgroundGlow} />
          <View style={styles.heroContent}>
            <View style={styles.avatarContainer}>
              <TouchableOpacity activeOpacity={0.8} onPress={handlePickImage}>
                <LinearGradient colors={[C.primary, C.secondary]} style={styles.avatarGradient}>
                  <View style={styles.avatarImageWrapper}>
                    {user?.photoUrl ? <Image source={{ uri: user.photoUrl }} style={styles.avatarImage} /> : (
                      <View style={styles.avatarPlaceholder}><MaterialIcons name="person" size={48} color={C.primaryFixedDim} /></View>
                    )}
                    {isUploading && <View style={styles.avatarLoadingOverlay}><ActivityIndicator size="small" color="#fff" /></View>}
                  </View>
                </LinearGradient>
                <View style={styles.verifiedBadge}><MaterialIcons name="edit" size={14} color="#fff" /></View>
              </TouchableOpacity>
            </View>
            <View style={styles.heroTextContent}>
              <Text style={styles.userName}>{user?.name || "DailyBoost User"}</Text>
              <Text style={styles.userJoined}>{t("premium_member_since")} {joinDate}</Text>
              <View style={styles.tagsRow}>
                <View style={styles.tagProsperous}><Text style={styles.tagTextProsperous}>{t("prosperous_tier")}</Text></View>
                <View style={styles.tagSaver}><Text style={styles.tagTextSaver}>{t("top_saver")}</Text></View>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{t("wealth_growth")}</Text>
            <View style={styles.statValueContainer}>
              <Text style={styles.statValueGreen}>+{savingsRate}%</Text>
              <Text style={styles.statSubtext}>{t("average_savings")}</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{t("monthly_insights")}</Text>
            <View style={styles.statValueContainer}>
              <Text style={styles.statValueBlue}>{totalInsights}</Text>
              <Text style={styles.statSubtext}>{t("generated_total")}</Text>
            </View>
          </View>
        </View>

        {/* ━━━ ACCOUNT SETTINGS ━━━ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("account_settings")}</Text>
          <View style={[styles.cardGroup, styles.elevation]}>
            <TouchableOpacity style={styles.listItem} activeOpacity={0.7} onPress={() => setPersonalInfoVisible(true)}>
              <View style={styles.listLeft}>
                <View style={[styles.iconBox, { backgroundColor: C.primaryFixed }]}><MaterialIcons name="person" size={20} color={C.primary} /></View>
                <Text style={styles.listText}>{t("personal_info")}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={C.onSurfaceVariant} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.listItem, styles.borderTop]} activeOpacity={0.7} onPress={() => setSecurityVisible(true)}>
              <View style={styles.listLeft}>
                <View style={[styles.iconBox, { backgroundColor: C.secondaryFixed }]}><MaterialIcons name="security" size={20} color={C.secondary} /></View>
                <Text style={styles.listText}>{t("security_password")}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={C.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ━━━ APP PREFERENCES ━━━ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("app_preferences")}</Text>
          <View style={[styles.cardGroup, styles.elevation]}>
            <View style={styles.listItem}>
              <View style={styles.listLeft}>
                <View style={[styles.iconBox, { backgroundColor: C.tertiaryFixed }]}><MaterialIcons name="notifications" size={20} color={C.tertiary} /></View>
                <Text style={styles.listText}>{t("notifications")}</Text>
              </View>
              <TouchableOpacity style={[styles.switch, notificationsEnabled ? styles.switchOn : styles.switchOff]} activeOpacity={0.8} onPress={() => setNotificationsEnabled(!notificationsEnabled)}>
                <View style={[styles.switchThumb, notificationsEnabled ? styles.thumbOn : styles.thumbOff]} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={[styles.listItem, styles.borderTop]} activeOpacity={0.7} onPress={() => setLanguage(language === "en" ? "id" : "en")}>
              <View style={styles.listLeft}>
                <View style={[styles.iconBox, { backgroundColor: C.surfaceContainerHigh }]}><MaterialIcons name="language" size={20} color={C.onSurface} /></View>
                <Text style={styles.listText}>{t("language")}</Text>
              </View>
              <Text style={styles.listRightText}>{language === "en" ? "English" : "Bahasa Indonesia"}</Text>
            </TouchableOpacity>
            <View style={[styles.listItem, styles.borderTop]}>
              <View style={styles.listLeft}>
                <View style={[styles.iconBox, { backgroundColor: C.inverseSurface }]}><MaterialIcons name="dark-mode" size={20} color={C.inverseOnSurface} /></View>
                <Text style={styles.listText}>{t("dark_mode")}</Text>
              </View>
              <TouchableOpacity style={[styles.switch, darkModeEnabled ? styles.switchOn : styles.switchOff]} activeOpacity={0.8} onPress={() => setDarkModeEnabled(!darkModeEnabled)}>
                <View style={[styles.switchThumb, darkModeEnabled ? styles.thumbOn : styles.thumbOff]} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ━━━ SUPPORT & INFO ━━━ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("support_info")}</Text>
          <View style={[styles.cardGroup, styles.elevation]}>
            {[
              { id: "help", icon: "help", title: t("help_center") },
              { id: "about", icon: "info", title: t("about_app") },
              { id: "privacy", icon: "policy", title: t("privacy_policy") },
            ].map((item, idx) => (
              <TouchableOpacity key={item.id} style={[styles.listItem, idx > 0 && styles.borderTop]} activeOpacity={0.7} onPress={() => { setSupportType(item.id as any); setSupportVisible(true); }}>
                <View style={styles.listLeft}>
                  <View style={[styles.iconBox, { backgroundColor: C.surfaceContainerHigh }]}><MaterialIcons name={item.icon as any} size={20} color={C.onSurfaceVariant} /></View>
                  <Text style={styles.listText}>{item.title}</Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={C.onSurfaceVariant} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ━━━ DATA MANAGEMENT ━━━ */}
        <View style={[styles.section, { marginBottom: 12 }]}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          <TouchableOpacity style={styles.resetButton} activeOpacity={0.8} onPress={handleResetData}>
            <MaterialIcons name="refresh" size={22} color={C.onErrorContainer} />
            <Text style={styles.resetText}>{t("reset_data")}</Text>
          </TouchableOpacity>
        </View>

        {/* ━━━ LOGOUT BUTTON ━━━ */}
        <TouchableOpacity style={styles.logoutButton} activeOpacity={0.8} onPress={handleLogout}>
          <MaterialIcons name="logout" size={22} color={C.onErrorContainer} />
          <Text style={styles.logoutText}>{t("logout")}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconButton: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "800", color: C.primary, letterSpacing: -0.3 },
  headerDivider: { height: 1, backgroundColor: C.surfaceContainerHigh, opacity: 0.5 },
  scrollContent: { padding: 20, paddingBottom: 110 },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", flexDirection: "row" },
  modalDismissArea: { flex: 1 },
  sideMenu: { position: "absolute", left: 0, top: 0, bottom: 0, width: 280, backgroundColor: C.surfaceContainerLowest, paddingTop: Platform.OS === "ios" ? 60 : 40, paddingHorizontal: 20, elevation: 24 },
  sideMenuHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.outlineVariant },
  sideMenuTitle: { fontSize: 20, fontWeight: "800", color: C.onSurface },
  sideMenuItem: { flexDirection: "row", alignItems: "center", gap: 16, paddingVertical: 16 },
  sideMenuText: { fontSize: 16, fontWeight: "600", color: C.onSurface },

  fullModalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  modalContent: { backgroundColor: "#fff", borderRadius: 24, padding: 24, maxHeight: "80%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "800", color: C.onSurface },
  modalScroll: { marginTop: 10 },
  modalBodyText: { fontSize: 15, lineHeight: 24, color: C.onSurfaceVariant },
  inputLabel: { fontSize: 13, fontWeight: "700", color: C.onSurfaceVariant, marginBottom: 8, marginTop: 16 },
  textInput: { backgroundColor: C.surfaceContainerLow, borderRadius: 12, padding: 16, fontSize: 16, color: C.onSurface },
  saveBtn: { backgroundColor: C.primary, borderRadius: 12, padding: 16, alignItems: "center", marginTop: 24 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  // Hero
  heroSection: { backgroundColor: C.surfaceContainerLowest, borderRadius: 24, padding: 24, overflow: "hidden", position: "relative", marginBottom: 24 },
  heroBackgroundGlow: { position: "absolute", top: -40, right: -40, width: 120, height: 120, backgroundColor: C.primaryFixed, borderRadius: 60, opacity: 0.2 },
  heroContent: { flexDirection: "row", alignItems: "center", gap: 20, zIndex: 10 },
  avatarContainer: { position: "relative" },
  avatarGradient: { width: 88, height: 88, borderRadius: 44, padding: 4 },
  avatarImageWrapper: { width: "100%", height: "100%", borderRadius: 40, borderWidth: 4, borderColor: "#fff", overflow: "hidden" },
  avatarImage: { width: "100%", height: "100%" },
  avatarPlaceholder: { width: "100%", height: "100%", backgroundColor: C.surfaceContainerHigh, alignItems: "center", justifyContent: "center" },
  avatarLoadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)", alignItems: "center", justifyContent: "center" },
  verifiedBadge: { position: "absolute", bottom: 2, right: 2, backgroundColor: C.primary, width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: "#fff", alignItems: "center", justifyContent: "center" },
  heroTextContent: { flex: 1 },
  userName: { fontSize: 24, fontWeight: "800", color: C.onSurface, letterSpacing: -0.5, marginBottom: 4 },
  userJoined: { fontSize: 13, fontWeight: "500", color: C.onSurfaceVariant, marginBottom: 12 },
  tagsRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  tagProsperous: { backgroundColor: C.primaryFixed, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99 },
  tagTextProsperous: { fontSize: 10, fontWeight: "700", color: C.onPrimaryFixed, letterSpacing: 0.5 },
  tagSaver: { backgroundColor: C.tertiaryFixed, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99 },
  tagTextSaver: { fontSize: 10, fontWeight: "700", color: C.onTertiaryFixed, letterSpacing: 0.5 },

  // Stats
  statsGrid: { flexDirection: "row", gap: 16, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: C.surfaceContainer, borderRadius: 20, padding: 20, justifyContent: "space-between" },
  statLabel: { fontSize: 13, fontWeight: "600", color: C.onSurfaceVariant, marginBottom: 16 },
  statValueContainer: { gap: 4 },
  statValueGreen: { fontSize: 24, fontWeight: "800", color: C.primary },
  statValueBlue: { fontSize: 24, fontWeight: "800", color: C.secondary },
  statSubtext: { fontSize: 11, color: C.onSurfaceVariant },

  // Lists
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: C.onSurfaceVariant, marginBottom: 12, paddingHorizontal: 8 },
  cardGroup: { backgroundColor: C.surfaceContainerLowest, borderRadius: 24, overflow: "hidden" },
  listItem: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20 },
  borderTop: { borderTopWidth: 1, borderTopColor: C.outlineVariant },
  listLeft: { flexDirection: "row", alignItems: "center", gap: 16 },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  listText: { fontSize: 15, fontWeight: "600", color: C.onSurface },
  listRightText: { fontSize: 13, fontWeight: "700", color: C.primary },

  // Switch
  switch: { width: 48, height: 24, borderRadius: 12, justifyContent: "center" },
  switchOn: { backgroundColor: C.primary },
  switchOff: { backgroundColor: C.surfaceContainerHigh },
  switchThumb: { width: 16, height: 16, borderRadius: 8, backgroundColor: "#fff", position: "absolute" },
  thumbOn: { right: 4 },
  thumbOff: { left: 4 },

  // Buttons
  resetButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: C.errorContainer, borderRadius: 20, paddingVertical: 16, gap: 12, marginTop: 4 },
  resetText: { fontSize: 15, fontWeight: "700", color: C.onErrorContainer },
  logoutButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: C.surfaceContainerHigh, borderRadius: 20, paddingVertical: 16, gap: 12, marginTop: 12 },
  logoutText: { fontSize: 15, fontWeight: "700", color: C.onSurfaceVariant },

  elevation: { shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
});
