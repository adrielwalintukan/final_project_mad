import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

// ─── Color Tokens (Editorial Intelligence theme) ───
const C = {
  primary: "#0d631b",
  primaryContainer: "#2e7d32",
  primaryFixed: "#a3f69c",
  primaryFixedDim: "#88d982",
  onPrimary: "#ffffff",
  onPrimaryFixed: "#002204",
  onPrimaryFixedVariant: "#005312",
  secondary: "#4c56af",
  secondaryContainer: "#959efd",
  secondaryFixed: "#e0e0ff",
  tertiary: "#923357",
  tertiaryContainer: "#b14b6f",
  tertiaryFixed: "#ffd9e2",
  onTertiaryFixed: "#3f001c",
  onTertiaryFixedVariant: "#7f2448",
  background: "#f8f9fa",
  surface: "#f8f9fa",
  surfaceContainerLowest: "#ffffff",
  surfaceContainerLow: "#f3f4f5",
  surfaceContainer: "#edeeef",
  surfaceContainerHigh: "#e7e8e9",
  surfaceContainerHighest: "#e1e3e4",
  onSurface: "#191c1d",
  onSurfaceVariant: "#40493d",
  outline: "#707a6c",
  outlineVariant: "#bfcaba",
  error: "#ba1a1a",
};

// ─── Mock Data ───
const TRANSACTIONS = [
  {
    id: "1",
    title: "Premium Organic Atelier",
    category: "Grocery",
    time: "Today, 11:42 AM",
    amount: -124.5,
    icon: "shopping-bag" as const,
    iconBg: C.primaryFixed,
    iconColor: C.primary,
  },
  {
    id: "2",
    title: "Dividend Yield: GreenTech",
    category: "Investments",
    time: "Yesterday, 4:00 PM",
    amount: 3400.0,
    icon: "payments" as const,
    iconBg: C.secondaryFixed,
    iconColor: C.secondary,
  },
  {
    id: "3",
    title: "The Editorial Kitchen",
    category: "Dining",
    time: "Oct 24, 8:15 PM",
    amount: -86.2,
    icon: "restaurant" as const,
    iconBg: C.tertiaryFixed,
    iconColor: C.tertiary,
  },
];

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ━━━ HEADER ━━━ */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarWrap}>
              <Image
                source={{ uri: "https://i.pravatar.cc/100?img=11" }}
                style={styles.avatar}
              />
            </View>
            <Text style={styles.brandName}>Editorial Intelligence</Text>
          </View>
          <TouchableOpacity activeOpacity={0.7} style={styles.headerAction}>
            <MaterialIcons name="auto-awesome" size={24} color={C.primary} />
          </TouchableOpacity>
        </View>

        {/* ━━━ HERO BALANCE ━━━ */}
        <View style={styles.heroSection}>
          <View style={styles.statusDot}>
            <View style={styles.dot} />
            <Text style={styles.statusLabel}>Portfolio Excellence</Text>
          </View>
          <Text style={styles.heroAmount}>
            $142,580<Text style={styles.heroCents}>.42</Text>
          </Text>
          <View style={styles.badgeRow}>
            <View style={styles.badgeGreen}>
              <MaterialIcons name="trending-up" size={14} color={C.onPrimaryFixedVariant} />
              <Text style={styles.badgeGreenText}>+12.4% this month</Text>
            </View>
            <View style={styles.badgeNeutral}>
              <Text style={styles.badgeNeutralText}>Last sync: 2m ago</Text>
            </View>
          </View>
        </View>

        {/* ━━━ AI INSIGHT CARD ━━━ */}
        <TouchableOpacity activeOpacity={0.92} style={styles.aiCard}>
          <LinearGradient
            colors={["#ffd9e2", "#ffe8ed"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.aiGradient}
          >
            <View style={styles.aiLabelRow}>
              <MaterialIcons name="lightbulb" size={18} color={C.onTertiaryFixed} />
              <Text style={styles.aiLabel}>INTELLIGENCE FRAGMENT</Text>
            </View>
            <Text style={styles.aiHeadline}>
              Your grocery spending is 15% lower than your average Atelier profile.
            </Text>
            <Text style={styles.aiBody}>
              Redirect the $240 surplus into your "High-Yield Growth" goal for optimal alignment.
            </Text>
            <View style={styles.aiButtonWrap}>
              <View style={styles.aiButton}>
                <Text style={styles.aiButtonText}>Execute Recommendation</Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* ━━━ INFLOW / OUTFLOW CARDS ━━━ */}
        <View style={styles.flowRow}>
          {/* Inflow */}
          <View style={[styles.flowCard, styles.elevation]}>
            <Text style={styles.flowLabel}>INFLOW</Text>
            <Text style={styles.flowAmount}>$4,250</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: "75%", backgroundColor: C.primary }]} />
            </View>
            <Text style={styles.flowMeta}>75% of Daily Target met</Text>
          </View>
          {/* Outflow */}
          <View style={[styles.flowCard, styles.elevation]}>
            <Text style={styles.flowLabel}>OUTFLOW</Text>
            <Text style={styles.flowAmount}>$842</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: "40%", backgroundColor: C.secondary }]} />
            </View>
            <Text style={styles.flowMeta}>Conservative trend identified</Text>
          </View>
        </View>

        {/* ━━━ RECENT LEDGER ━━━ */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Ledger</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.sectionAction}>Review All</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.ledgerWrap, styles.elevation]}>
          {TRANSACTIONS.map((tx, idx) => (
            <TouchableOpacity
              key={tx.id}
              activeOpacity={0.8}
              style={[
                styles.txRow,
                idx < TRANSACTIONS.length - 1 && styles.txRowBorder,
              ]}
            >
              <View style={[styles.txIcon, { backgroundColor: tx.iconBg }]}>
                <MaterialIcons name={tx.icon} size={22} color={tx.iconColor} />
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txTitle} numberOfLines={1}>
                  {tx.title}
                </Text>
                <Text style={styles.txMeta}>
                  {tx.category} • {tx.time}
                </Text>
              </View>
              <Text
                style={[
                  styles.txAmount,
                  { color: tx.amount > 0 ? C.primary : C.onSurface },
                ]}
              >
                {tx.amount > 0 ? "+" : ""}${Math.abs(tx.amount).toFixed(2)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ━━━ GOAL TRACKING ━━━ */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Active Quest</Text>
        </View>

        <TouchableOpacity activeOpacity={0.9} style={[styles.goalCard, styles.elevation]}>
          <Text style={styles.goalLabel}>ACTIVE QUEST</Text>
          <Text style={styles.goalTitle}>New York Atelier Studio</Text>
          <View style={styles.goalProgressSection}>
            <Text style={styles.goalProgressText}>$42,000 / $150,000</Text>
            <View style={styles.goalTrack}>
              <LinearGradient
                colors={[C.primary, C.primaryContainer]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.goalFill, { width: "28%" }]}
              />
            </View>
          </View>
        </TouchableOpacity>

        {/* Manifest New Goal */}
        <TouchableOpacity activeOpacity={0.8} style={styles.newGoalCard}>
          <View style={styles.newGoalCircle}>
            <Ionicons name="add" size={28} color={C.primary} />
          </View>
          <Text style={styles.newGoalText}>Manifest New Goal</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ━━━ FLOATING AI BUTTON ━━━ */}
      <TouchableOpacity activeOpacity={0.85} style={styles.fab}>
        <LinearGradient
          colors={[C.primary, C.primaryContainer]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <MaterialCommunityIcons name="forum" size={26} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ─── Styles ───
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 110,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatarWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    overflow: "hidden",
    backgroundColor: C.surfaceContainerHigh,
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  brandName: {
    fontSize: 17,
    fontWeight: "800",
    color: C.primary,
    letterSpacing: -0.3,
  },
  headerAction: {
    padding: 6,
  },

  // Hero
  heroSection: {
    marginTop: 8,
    marginBottom: 24,
  },
  statusDot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.primary,
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: C.onSurfaceVariant,
  },
  heroAmount: {
    fontSize: 52,
    fontWeight: "800",
    color: C.onSurface,
    letterSpacing: -2,
    lineHeight: 58,
  },
  heroCents: {
    color: C.primary,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 16,
  },
  badgeGreen: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: C.primaryFixed,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  badgeGreenText: {
    fontSize: 13,
    fontWeight: "700",
    color: C.onPrimaryFixedVariant,
  },
  badgeNeutral: {
    backgroundColor: C.surfaceContainerLowest,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
  },
  badgeNeutralText: {
    fontSize: 13,
    fontWeight: "500",
    color: C.onSurfaceVariant,
  },

  // AI Card
  aiCard: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
  },
  aiGradient: {
    padding: 24,
  },
  aiLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  aiLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: C.onTertiaryFixed,
  },
  aiHeadline: {
    fontSize: 24,
    fontWeight: "800",
    color: C.onTertiaryFixed,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  aiBody: {
    fontSize: 14,
    fontWeight: "500",
    color: C.onTertiaryFixedVariant,
    lineHeight: 22,
    marginTop: 12,
  },
  aiButtonWrap: {
    marginTop: 24,
  },
  aiButton: {
    alignSelf: "flex-start",
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  aiButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: C.tertiary,
  },

  // Inflow / Outflow
  flowRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 28,
  },
  flowCard: {
    flex: 1,
    backgroundColor: C.surfaceContainerLowest,
    borderRadius: 16,
    padding: 18,
  },
  flowLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: C.onSurfaceVariant,
    marginBottom: 8,
  },
  flowAmount: {
    fontSize: 28,
    fontWeight: "800",
    color: C.onSurface,
    letterSpacing: -1,
    marginBottom: 14,
  },
  progressTrack: {
    height: 4,
    backgroundColor: C.surfaceContainer,
    borderRadius: 999,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },
  flowMeta: {
    fontSize: 10,
    fontWeight: "600",
    color: C.onSurfaceVariant,
  },

  // Sections
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: C.onSurface,
    letterSpacing: -0.5,
  },
  sectionAction: {
    fontSize: 13,
    fontWeight: "700",
    color: C.primary,
  },

  // Ledger
  ledgerWrap: {
    backgroundColor: C.surfaceContainerLow,
    borderRadius: 16,
    padding: 8,
    marginBottom: 28,
  },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surfaceContainerLowest,
    borderRadius: 12,
    padding: 14,
    marginBottom: 6,
  },
  txRowBorder: {
    marginBottom: 6,
  },
  txIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  txInfo: {
    flex: 1,
    marginRight: 8,
  },
  txTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: C.onSurface,
    marginBottom: 2,
  },
  txMeta: {
    fontSize: 11,
    fontWeight: "500",
    color: C.onSurfaceVariant,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.3,
  },

  // Goals
  goalCard: {
    backgroundColor: C.surfaceContainerHighest,
    borderRadius: 16,
    padding: 24,
    marginBottom: 14,
  },
  goalLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: C.onSurfaceVariant,
    marginBottom: 8,
  },
  goalTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: C.onSurface,
    letterSpacing: -0.5,
    marginBottom: 24,
  },
  goalProgressSection: {
    gap: 8,
  },
  goalProgressText: {
    fontSize: 14,
    fontWeight: "500",
    color: C.onSurfaceVariant,
  },
  goalTrack: {
    height: 10,
    backgroundColor: "rgba(255,255,255,0.5)",
    borderRadius: 999,
    overflow: "hidden",
  },
  goalFill: {
    height: "100%",
    borderRadius: 999,
  },
  newGoalCard: {
    backgroundColor: C.surfaceContainerHighest,
    borderRadius: 16,
    padding: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: C.outlineVariant,
    marginBottom: 20,
  },
  newGoalCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  newGoalText: {
    fontSize: 16,
    fontWeight: "800",
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

  // Utility
  elevation: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
});
