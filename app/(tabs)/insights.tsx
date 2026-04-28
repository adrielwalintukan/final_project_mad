import { useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
  ActivityIndicator, Image, Platform, ScrollView, StyleSheet,
  Text, TouchableOpacity, View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useInsights } from "../../hooks/useInsights";
import { MaterialIcons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";

const C = {
  primary: "#0d631b", primaryContainer: "#2e7d32", primaryFixed: "#a3f69c",
  onPrimary: "#fff", background: "#f8f9fa", surface: "#fff",
  surfaceContainerLow: "#f3f4f5", surfaceContainerHigh: "#e7e8e9",
  onSurface: "#191c1d", onSurfaceVariant: "#40493d", outline: "#707a6c",
  outlineVariant: "#bfcaba", tertiary: "#923357", tertiaryFixed: "#ffd9e2",
  secondary: "#4c56af", error: "#c62828",
};

function formatRp(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

export default function InsightsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const userId = user?._id as Id<"users">;

  const dashboardData = useQuery(
    api.insights.getInsightsDashboardData,
    userId ? { userId } : "skip"
  );

  const { latestInsight, isGenerating, generateNewInsight, hasTransactions } = useInsights();

  useEffect(() => {
    if (hasTransactions && !latestInsight && !isGenerating) {
      generateNewInsight();
    }
  }, [hasTransactions, latestInsight]);

  if (dashboardData === undefined) {
    return (
      <SafeAreaView style={[st.container, { justifyContent: "center", alignItems: "center" }]} edges={["top"]}>
        <ActivityIndicator size="large" color={C.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={st.container} edges={["top"]}>
      {/* Header */}
      <View style={[st.header, { paddingHorizontal: 20 }]}>
        <View style={st.headerLeft}>
          <View style={st.avatarWrap}>
            {user?.photoUrl ? (
              <Image source={{ uri: user.photoUrl }} style={st.avatar} />
            ) : (
              <View style={[st.avatar, { alignItems: "center", justifyContent: "center", backgroundColor: C.surfaceContainerHigh }]}>
                <MaterialIcons name="person" size={22} color={C.onSurfaceVariant} />
              </View>
            )}
          </View>
          <Text style={st.headerTitle}>{user?.name?.split(" ")[0] || t("insights")}</Text>
        </View>
        <TouchableOpacity activeOpacity={0.7} style={{ padding: 6 }} onPress={() => router.push("/chatbot")}>
          <MaterialIcons name="auto-awesome" size={24} color={C.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={st.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Hero */}
        <View style={st.heroSection}>
          <View style={st.badge}>
            <Text style={st.badgeText}>{t("ins_badge")}</Text>
          </View>
          <Text style={st.heroTitle}>{t("ins_hero_title")}</Text>
          <Text style={st.heroSub}>
            {t("ins_hero_sub_pre")}
            <Text style={st.heroHighlight}>{dashboardData?.performancePercentage}%</Text>
            {t("ins_hero_sub_post")}
          </Text>
        </View>

        {/* Monthly Summary Card */}
        <LinearGradient colors={[C.primary, C.primaryContainer]} style={st.monthCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={st.monthCardLabel}>{t("ins_month_label")}</Text>
          <View style={st.monthRow}>
            <View style={st.monthItem}>
              <Text style={st.monthValue}>{formatRp(dashboardData?.thisMonthIncome || 0)}</Text>
              <Text style={st.monthLabel}>{t("ins_month_income")}</Text>
            </View>
            <View style={st.monthDivider} />
            <View style={st.monthItem}>
              <Text style={st.monthValue}>{formatRp(dashboardData?.thisMonthExpense || 0)}</Text>
              <Text style={st.monthLabel}>{t("ins_month_expense")}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Spending Analysis Card */}
        <View style={st.card}>
          <Text style={st.cardTitle}>{t("ins_spending_title")}</Text>
          <Text style={st.cardSub}>{t("ins_spending_sub")}</Text>
          <View style={st.spendingRow}>
            <View style={{ width: 130, height: 130, position: "relative", alignItems: "center", justifyContent: "center" }}>
              <View style={st.donutInner}>
                <Text style={st.donutTotal}>{formatRp(dashboardData?.spendingMetrics.total || 0)}</Text>
                <Text style={st.donutLabel}>{t("ins_donut_total")}</Text>
              </View>
              {(() => {
                const total = dashboardData?.spendingMetrics?.total || 0;
                const breakdown = dashboardData?.spendingMetrics?.breakdown || [];
                const radius = 55;
                const strokeWidth = 14;
                const cx = 65;
                const cy = 65;
                const circumference = 2 * Math.PI * radius;
                let currentOffset = 0;

                if (total === 0 || breakdown.length === 0) {
                  return (
                    <Svg width={130} height={130}>
                      <Circle cx={cx} cy={cy} r={radius} stroke={C.surfaceContainerLow} strokeWidth={strokeWidth} fill="none" />
                    </Svg>
                  );
                }

                return (
                  <Svg width={130} height={130} style={{ transform: [{ rotate: "-90deg" }] }}>
                    {breakdown.map((item: any, idx: number) => {
                      if (item.amount === 0) return null;
                      const percentage = item.amount / total;
                      const strokeLength = percentage * circumference;
                      const offset = currentOffset;
                      currentOffset += strokeLength;
                      
                      return (
                        <Circle
                          key={idx} cx={cx} cy={cy} r={radius}
                          stroke={item.color} strokeWidth={strokeWidth}
                          strokeDasharray={`${strokeLength} ${circumference - strokeLength}`}
                          strokeDashoffset={-offset}
                          fill="none"
                        />
                      );
                    })}
                  </Svg>
                );
              })()}
            </View>
            <View style={st.legendContainer}>
              {dashboardData?.spendingMetrics.breakdown.map((item: any, idx: number) => {
                const labels: Record<string, string> = { 
                  Lifestyle: t("ins_cat_lifestyle"), 
                  Essentials: t("ins_cat_essentials"), 
                  Growth: t("ins_cat_growth") 
                };
                return (
                  <View key={idx} style={st.legendItem}>
                    <View style={[st.legendDot, { backgroundColor: item.color }]} />
                    <View>
                      <Text style={st.legendLabel}>{labels[item.label] || item.label}</Text>
                      <Text style={st.legendAmount}>{formatRp(item.amount)}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* AI Insight Card */}
        <View style={st.aiCard}>
          <View style={st.aiHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
              <MaterialIcons name="lightbulb" size={18} color="#88153e" />
              <Text style={st.aiHeaderText}>{t("ins_ai_label")}</Text>
            </View>
            {hasTransactions && (
              <TouchableOpacity onPress={() => generateNewInsight()} disabled={isGenerating} activeOpacity={0.7} style={{ padding: 4 }}>
                <MaterialIcons name="refresh" size={20} color={isGenerating ? "#d4a0b0" : "#88153e"} />
              </TouchableOpacity>
            )}
          </View>
          {isGenerating ? (
            <View style={{ paddingVertical: 20, alignItems: "center", gap: 12 }}>
              <ActivityIndicator size="small" color="#88153e" />
              <Text style={{ fontSize: 13, color: "#88153e", opacity: 0.7 }}>{t("ins_ai_analyzing")}</Text>
            </View>
          ) : latestInsight ? (
            <View>
              <Text style={st.aiMessage}>{latestInsight.message}</Text>
              {latestInsight.suggestedAction !== "none" && (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    if (latestInsight.suggestedAction === "create_budget") router.push("/createBudget");
                    if (latestInsight.suggestedAction === "add_transaction") router.push("/addTransaction");
                    if (latestInsight.suggestedAction === "view_goals") router.push("/(tabs)/goals");
                  }}
                  style={st.aiBtn}
                >
                  <Text style={st.aiBtnText}>{latestInsight.actionLabel}</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View>
              <Text style={st.aiMessage}>
                {hasTransactions ? t("ins_ai_refresh") : t("ins_ai_no_tx")}
              </Text>
              {hasTransactions && (
                <TouchableOpacity activeOpacity={0.8} onPress={() => generateNewInsight()} style={st.aiBtn}>
                  <Text style={st.aiBtnText}>{t("ins_ai_get_btn")}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Quick Stats Grid */}
        <Text style={st.sectionTitle}>{t("ins_metrics_title")}</Text>
        <View style={st.statsGrid}>
          {dashboardData?.quickStats?.map((item: any) => (
            <View key={item.id} style={st.statCard}>
              <View style={st.statCardHeader}>
                <View style={[st.statIconWrap, { backgroundColor: item.iconBg }]}>
                  <MaterialIcons name={item.icon as any} size={20} color={item.iconColor} />
                </View>
              </View>
              <Text style={st.statTitle}>{item.title}</Text>
              <Text style={[st.statValue, item.trend === "warning" && { color: C.error }, item.trend === "good" && { color: C.primary }]}>
                {item.value}
              </Text>
              <Text style={st.statSub}>{item.subtitle}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={st.fab} activeOpacity={0.85} onPress={() => router.push("/addTransaction")}>
        <LinearGradient colors={[C.primary, C.primaryContainer]} style={st.fabGradient}>
          <MaterialIcons name="add" size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 120 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatarWrap: { width: 36, height: 36, borderRadius: 18, overflow: "hidden", backgroundColor: C.surfaceContainerHigh },
  avatar: { width: "100%", height: "100%" },
  headerTitle: { fontSize: 17, fontWeight: "800", color: C.primary, letterSpacing: -0.3 },

  heroSection: { marginTop: 8, marginBottom: 24 },
  badge: { backgroundColor: C.tertiaryFixed, alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginBottom: 16 },
  badgeText: { color: "#3f001c", fontSize: 10, fontWeight: "700", letterSpacing: 1 },
  heroTitle: { fontSize: 38, fontWeight: "800", color: C.primary, lineHeight: 44, letterSpacing: -1, marginBottom: 12 },
  heroSub: { fontSize: 16, color: C.onSurfaceVariant, lineHeight: 24 },
  heroHighlight: { fontWeight: "700", color: C.primary },

  monthCard: { borderRadius: 20, padding: 22, marginBottom: 20 },
  monthCardLabel: { fontSize: 10, fontWeight: "800", color: "rgba(255,255,255,0.7)", letterSpacing: 1.5, marginBottom: 16 },
  monthRow: { flexDirection: "row", alignItems: "center" },
  monthItem: { flex: 1, alignItems: "center" },
  monthValue: { fontSize: 18, fontWeight: "800", color: "#fff" },
  monthLabel: { fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 4 },
  monthDivider: { width: 1, height: 36, backgroundColor: "rgba(255,255,255,0.2)" },

  card: { backgroundColor: C.surface, borderRadius: 20, padding: 22, marginBottom: 16, borderWidth: 1, borderColor: C.surfaceContainerHigh },
  cardTitle: { fontSize: 18, fontWeight: "700", color: C.onSurface, marginBottom: 4 },
  cardSub: { fontSize: 13, color: C.outline, marginBottom: 20 },
  spendingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  donutCircle: { width: 130, height: 130, borderRadius: 65, borderWidth: 12, borderColor: C.surfaceContainerLow, alignItems: "center", justifyContent: "center", position: "relative" },
  donutInner: { alignItems: "center", justifyContent: "center", position: "absolute", zIndex: 10 },
  donutTotal: { fontSize: 14, fontWeight: "800", color: C.onSurface, textAlign: "center" },
  donutLabel: { fontSize: 9, fontWeight: "700", color: C.outline, letterSpacing: 1 },
  legendContainer: { flex: 1, paddingLeft: 20, gap: 14 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 10 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontSize: 13, fontWeight: "700", color: C.onSurface },
  legendAmount: { fontSize: 11, color: C.outline },

  aiCard: { backgroundColor: "#fce4ec", borderRadius: 20, padding: 22, marginBottom: 20 },
  aiHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 14 },
  aiHeaderText: { fontSize: 11, fontWeight: "800", color: "#88153e", letterSpacing: 1.5 },
  aiMessage: { fontSize: 15, color: "#5a0f2a", lineHeight: 22, marginBottom: 16 },
  aiBtn: { backgroundColor: "#fff", paddingVertical: 12, paddingHorizontal: 20, borderRadius: 14, alignSelf: "flex-start" },
  aiBtnText: { fontSize: 14, fontWeight: "800", color: "#5a0f2a" },

  sectionTitle: { fontSize: 18, fontWeight: "800", color: C.onSurface, marginBottom: 14 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 20 },
  statCard: { width: "47%", backgroundColor: C.surface, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: C.surfaceContainerHigh },
  statCardHeader: { marginBottom: 12 },
  statIconWrap: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  statTitle: { fontSize: 12, fontWeight: "600", color: C.outline, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: "800", color: C.onSurface, marginBottom: 4 },
  statSub: { fontSize: 11, color: C.outline },

  fab: { position: "absolute", bottom: Platform.OS === "ios" ? 105 : 85, right: 20, zIndex: 50, borderRadius: 30, shadowColor: C.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 12 },
  fabGradient: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center" },
});
