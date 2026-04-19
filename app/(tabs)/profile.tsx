import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { useDashboardData } from "../../hooks/useDashboardData";
import * as ImagePicker from "expo-image-picker";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { ActivityIndicator } from "react-native";

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
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const generateUploadUrl = useMutation(api.users.generateUploadUrl);
  const updatePhoto = useMutation(api.users.updatePhoto);

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
        
        // 1. Get short-lived upload URL
        const postUrl = await generateUploadUrl();
        
        // 2. Fetch the image locally to convert to Blob/File
        const response = await fetch(imageUri);
        const blob = await response.blob();
        
        // 3. PUT to Convex storage
        const uploadResult = await fetch(postUrl, {
          method: "POST",
          body: blob,
        });
        const { storageId } = await uploadResult.json();
        
        // 4. Save to user datastore
        const newUrl = await updatePhoto({ 
          userId: user?._id as any, 
          storageId 
        });

        // 5. Update local context
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

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to log out of DailyBoost AI?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
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
    ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "Recently";

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
          <Text style={styles.headerTitle}>Profile</Text>
        </View>
        <View style={{ width: 40 }} /> {/* Empty spacer to balance header */}
      </View>
      <View style={styles.headerDivider} />

      {/* ━━━ SIDE MENU MODAL ━━━ */}
      <Modal
        visible={isMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsMenuVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalDismissArea} 
            activeOpacity={1} 
            onPress={() => setIsMenuVisible(false)} 
          />
          <View style={styles.sideMenu}>
            <View style={styles.sideMenuHeader}>
              <Text style={styles.sideMenuTitle}>Menu</Text>
              <TouchableOpacity onPress={() => setIsMenuVisible(false)}>
                <MaterialIcons name="close" size={24} color={C.onSurfaceVariant} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {[
                { icon: "sync", title: "Refresh Data", action: () => { setIsMenuVisible(false); Alert.alert("Synced", "Data updated."); } },
                { icon: "file-download", title: "Export Summary", action: () => { setIsMenuVisible(false); Alert.alert("Exporting", "Financial summary is being downloaded to your device."); } },
                { icon: "auto-awesome", title: "AI Model Settings", action: () => { setIsMenuVisible(false); Alert.alert("AI Settings", "Preferences opened."); } },
                { icon: "star-rate", title: "Rate App", action: () => { setIsMenuVisible(false); Alert.alert("Thank you!", "Redirecting to App Store..."); } },
                { icon: "bug-report", title: "Report a Bug", action: () => { setIsMenuVisible(false); } },
              ].map((item, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  style={styles.sideMenuItem} 
                  activeOpacity={0.7}
                  onPress={item.action}
                >
                  <MaterialIcons name={item.icon as any} size={22} color={C.onSurface} />
                  <Text style={styles.sideMenuItemText}>{item.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ━━━ HERO PROFILE SECTION ━━━ */}
        <View style={[styles.heroSection, styles.elevation]}>
          <View style={styles.heroBackgroundGlow} />
          <View style={styles.heroContent}>
            <View style={styles.avatarContainer}>
              <TouchableOpacity activeOpacity={0.8} onPress={handlePickImage}>
                <LinearGradient
                  colors={[C.primary, C.secondary]}
                  style={styles.avatarGradient}
                >
                  <View style={styles.avatarImageWrapper}>
                    {user?.photoUrl ? (
                      <Image
                        source={{ uri: user.photoUrl }}
                        style={styles.avatarImage}
                      />
                    ) : (
                      <View style={styles.avatarPlaceholder}>
                         <MaterialIcons name="person" size={48} color={C.primaryFixedDim} />
                      </View>
                    )}
                    {isUploading && (
                      <View style={styles.avatarLoadingOverlay}>
                        <ActivityIndicator size="small" color="#fff" />
                      </View>
                    )}
                  </View>
                </LinearGradient>
                <View style={styles.verifiedBadge}>
                  <MaterialIcons name="edit" size={14} color="#fff" />
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.heroTextContent}>
              <Text style={styles.userName}>{user?.name || "DailyBoost User"}</Text>
              <Text style={styles.userJoined}>Premium Member since {joinDate}</Text>
              <View style={styles.tagsRow}>
                <View style={styles.tagProsperous}>
                  <Text style={styles.tagTextProsperous}>PROSPEROUS TIER</Text>
                </View>
                <View style={styles.tagSaver}>
                  <Text style={styles.tagTextSaver}>TOP SAVER</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ━━━ STATS GRID ━━━ */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Wealth Growth</Text>
            <View style={styles.statValueContainer}>
              <Text style={styles.statValueGreen}>+{savingsRate}%</Text>
              <Text style={styles.statSubtext}>average savings</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Monthly Insights</Text>
            <View style={styles.statValueContainer}>
              <Text style={styles.statValueBlue}>{totalInsights}</Text>
              <Text style={styles.statSubtext}>generated total</Text>
            </View>
          </View>
        </View>

        {/* ━━━ ACCOUNT SETTINGS ━━━ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <View style={[styles.cardGroup, styles.elevation]}>
            <TouchableOpacity style={styles.listItem} activeOpacity={0.7}>
              <View style={styles.listLeft}>
                <View style={[styles.iconBox, { backgroundColor: C.primaryFixed }]}>
                  <MaterialIcons name="person" size={20} color={C.primary} />
                </View>
                <Text style={styles.listText}>Personal Information</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={C.onSurfaceVariant} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.listItem, styles.borderTop]} activeOpacity={0.7}>
              <View style={styles.listLeft}>
                <View style={[styles.iconBox, { backgroundColor: C.secondaryFixed }]}>
                  <MaterialIcons name="security" size={20} color={C.secondary} />
                </View>
                <Text style={styles.listText}>Security & Password</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={C.onSurfaceVariant} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.listItem, styles.borderTop]} activeOpacity={0.7}>
              <View style={styles.listLeft}>
                <View style={[styles.iconBox, { backgroundColor: C.primaryFixed }]}>
                  <MaterialIcons name="payments" size={20} color={C.primary} />
                </View>
                <Text style={styles.listText}>Payment Methods</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={C.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ━━━ APP PREFERENCES ━━━ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Preferences</Text>
          <View style={[styles.cardGroup, styles.elevation]}>
            <View style={styles.listItem}>
              <View style={styles.listLeft}>
                <View style={[styles.iconBox, { backgroundColor: C.tertiaryFixed }]}>
                  <MaterialIcons name="notifications" size={20} color={C.tertiary} />
                </View>
                <Text style={styles.listText}>Notifications</Text>
              </View>
              <TouchableOpacity
                style={[styles.switch, notificationsEnabled ? styles.switchOn : styles.switchOff]}
                activeOpacity={0.8}
                onPress={() => setNotificationsEnabled(!notificationsEnabled)}
              >
                <View style={[styles.switchThumb, notificationsEnabled ? styles.thumbOn : styles.thumbOff]} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.listItem, styles.borderTop]} activeOpacity={0.7}>
              <View style={styles.listLeft}>
                <View style={[styles.iconBox, { backgroundColor: C.surfaceContainerHigh }]}>
                  <MaterialIcons name="language" size={20} color={C.onSurface} />
                </View>
                <Text style={styles.listText}>Language</Text>
              </View>
              <Text style={styles.listRightText}>Bahasa Indonesia</Text>
            </TouchableOpacity>

            <View style={[styles.listItem, styles.borderTop]}>
              <View style={styles.listLeft}>
                <View style={[styles.iconBox, { backgroundColor: C.inverseSurface }]}>
                  <MaterialIcons name="dark-mode" size={20} color={C.inverseOnSurface} />
                </View>
                <Text style={styles.listText}>Dark Mode</Text>
              </View>
              <TouchableOpacity
                style={[styles.switch, darkModeEnabled ? styles.switchOn : styles.switchOff]}
                activeOpacity={0.8}
                onPress={() => setDarkModeEnabled(!darkModeEnabled)}
              >
                <View style={[styles.switchThumb, darkModeEnabled ? styles.thumbOn : styles.thumbOff]} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ━━━ SUPPORT & INFO ━━━ */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support & Info</Text>
          <View style={[styles.cardGroup, styles.elevation]}>
            <TouchableOpacity style={styles.listItem} activeOpacity={0.7}>
              <View style={styles.listLeft}>
                <View style={[styles.iconBox, { backgroundColor: C.surfaceContainerHigh }]}>
                  <MaterialIcons name="help" size={20} color={C.onSurfaceVariant} />
                </View>
                <Text style={styles.listText}>Help Center</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={C.onSurfaceVariant} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.listItem, styles.borderTop]} activeOpacity={0.7}>
              <View style={styles.listLeft}>
                <View style={[styles.iconBox, { backgroundColor: C.surfaceContainerHigh }]}>
                  <MaterialIcons name="info" size={20} color={C.onSurfaceVariant} />
                </View>
                <Text style={styles.listText}>About App</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={C.onSurfaceVariant} />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.listItem, styles.borderTop]} activeOpacity={0.7}>
              <View style={styles.listLeft}>
                <View style={[styles.iconBox, { backgroundColor: C.surfaceContainerHigh }]}>
                  <MaterialIcons name="policy" size={20} color={C.onSurfaceVariant} />
                </View>
                <Text style={styles.listText}>Privacy Policy</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color={C.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ━━━ LOGOUT BUTTON ━━━ */}
        <TouchableOpacity style={styles.logoutButton} activeOpacity={0.8} onPress={handleLogout}>
          <MaterialIcons name="logout" size={22} color={C.onErrorContainer} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ━━━ FLOATING AI BUTTON ━━━ */}
      <TouchableOpacity activeOpacity={0.85} style={styles.fab}>
        <LinearGradient
          colors={[C.primary, C.primaryFixedDim]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <MaterialIcons name="smart-toy" size={26} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconButton: {
    padding: 8,
    borderRadius: 99,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: C.primary,
    letterSpacing: -0.5,
  },
  headerDivider: {
    height: 1,
    backgroundColor: C.surfaceContainerHigh,
    opacity: 0.5,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120, // space for tab bar
  },

  // Modal Menu
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    flexDirection: "row",
  },
  modalDismissArea: {
    flex: 1,
  },
  sideMenu: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 280,
    backgroundColor: C.surfaceContainerLowest,
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 24,
  },
  sideMenuHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.outlineVariant,
  },
  sideMenuTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: C.onSurface,
  },
  sideMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 16,
  },
  sideMenuItemText: {
    fontSize: 16,
    fontWeight: "600",
    color: C.onSurface,
  },

  // FAB
  fab: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 105 : 85,
    right: 20,
    zIndex: 50,
    borderRadius: 30,
    shadowColor: "#0d631b",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },

  // Hero Section
  heroSection: {
    backgroundColor: C.surfaceContainerLowest,
    borderRadius: 24,
    padding: 24,
    overflow: "hidden",
    position: "relative",
    marginBottom: 24,
  },
  heroBackgroundGlow: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    backgroundColor: C.primaryFixed,
    borderRadius: 60,
    opacity: 0.2,
  },
  heroContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    zIndex: 10,
  },
  avatarContainer: {
    position: "relative",
  },
  avatarGradient: {
    width: 88,
    height: 88,
    borderRadius: 44,
    padding: 4,
  },
  avatarImageWrapper: {
    width: "100%",
    height: "100%",
    borderRadius: 40,
    borderWidth: 4,
    borderColor: "#fff",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: C.surfaceContainerHigh,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: C.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  heroTextContent: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: "800",
    color: C.onSurface,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  userJoined: {
    fontSize: 13,
    fontWeight: "500",
    color: C.onSurfaceVariant,
    marginBottom: 12,
  },
  tagsRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  tagProsperous: {
    backgroundColor: C.primaryFixed,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
  },
  tagTextProsperous: {
    fontSize: 10,
    fontWeight: "700",
    color: C.onPrimaryFixed,
    letterSpacing: 0.5,
  },
  tagSaver: {
    backgroundColor: C.tertiaryFixed,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 99,
  },
  tagTextSaver: {
    fontSize: 10,
    fontWeight: "700",
    color: C.onTertiaryFixed,
    letterSpacing: 0.5,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: C.surfaceContainer,
    borderRadius: 20,
    padding: 20,
    justifyContent: "space-between",
  },
  statLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: C.onSurfaceVariant,
    marginBottom: 16,
  },
  statValueContainer: {
    gap: 4,
  },
  statValueGreen: {
    fontSize: 24,
    fontWeight: "800",
    color: C.primary,
  },
  statValueBlue: {
    fontSize: 24,
    fontWeight: "800",
    color: C.secondary,
  },
  statSubtext: {
    fontSize: 11,
    color: C.onSurfaceVariant,
  },

  // Lists
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: C.onSurfaceVariant,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  cardGroup: {
    backgroundColor: C.surfaceContainerLowest,
    borderRadius: 24,
    overflow: "hidden",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: C.outlineVariant,
  },
  listLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  listText: {
    fontSize: 15,
    fontWeight: "600",
    color: C.onSurface,
  },
  listRightText: {
    fontSize: 13,
    fontWeight: "700",
    color: C.primary,
  },

  // Switch
  switch: {
    width: 48,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
  },
  switchOn: {
    backgroundColor: C.primary,
  },
  switchOff: {
    backgroundColor: C.surfaceContainerHigh,
  },
  switchThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: "absolute",
  },
  thumbOn: {
    right: 4,
  },
  thumbOff: {
    left: 4,
  },

  // Logout
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.errorContainer,
    borderRadius: 24,
    paddingVertical: 18,
    gap: 12,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "700",
    color: C.onErrorContainer,
  },

  elevation: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
});
