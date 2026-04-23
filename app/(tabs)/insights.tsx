import { useQuery } from "convex/react";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { useInsights } from "../../hooks/useInsights";
import { MaterialIcons } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function InsightsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const userId = user?._id as Id<"users">;

  const dashboardData = useQuery(
    api.insights.getInsightsDashboardData,
    userId ? { userId } : "skip"
  );
  
  const { 
    latestInsight, 
    isGenerating, 
    generateNewInsight, 
    hasTransactions 
  } = useInsights();

  // Generate insight on first load if none exists
  useEffect(() => {
    if (hasTransactions && !latestInsight && !isGenerating) {
      generateNewInsight();
    }
  }, [hasTransactions, latestInsight]);

  if (dashboardData === undefined) {
    return (
      <SafeAreaView
        style={[styles.container, { justifyContent: "center", alignItems: "center" }]}
        edges={["top"]}
      >
        <ActivityIndicator size="large" color="#0d631b" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarWrap}>
              {user?.photoUrl ? (
                <Image source={{ uri: user.photoUrl }} style={styles.avatar} />
              ) : (
                <View
                  style={[
                    styles.avatar,
                    { alignItems: "center", justifyContent: "center", backgroundColor: "#e7e8e9" },
                  ]}
                >
                  <MaterialIcons name="person" size={22} color="#40493d" />
                </View>
              )}
            </View>
            <Text style={styles.headerTitle}>
              {user?.name?.split(" ")[0] || "Editorial Intelligence"}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity 
              activeOpacity={0.7} 
              style={[styles.headerRightBtn, { marginRight: 8 }]}
              onPress={() => router.push("/chatbot")}
            >
              <MaterialIcons name="auto-awesome" size={24} color="#0d631b" />
            </TouchableOpacity>
            <TouchableOpacity 
              activeOpacity={0.7} 
              style={styles.headerRightBtn}
              onPress={() => generateNewInsight()}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <ActivityIndicator size="small" color="#0d631b" />
              ) : (
                <MaterialIcons name="refresh" size={24} color="#0d631b" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{t("atelier_insight")}</Text>
          </View>
          <Text style={styles.heroTitle}>{t("wealth_breathing")}</Text>
          <Text style={styles.heroSubtitle}>
            {t("intelligence_reveals")}
            <Text style={styles.heroSubtitleHighlight}>{dashboardData?.performancePercentage}%</Text>
            {t("this_month")}
          </Text>
        </View>

        {/* Spending Analysis Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t("spending_analysis")}</Text>
          <Text style={styles.cardSubtitle}>{t("curated_allocation")}</Text>

          <View style={styles.spendingRow}>
            {/* Donut representation */}
            <View style={styles.donutCircle}>
              <View style={styles.donutInner}>
                <Text style={styles.donutTotal}>
                  Rp {dashboardData?.spendingMetrics.total.toLocaleString("id-ID")}
                </Text>
                <Text style={styles.donutLabel}>{t("total")}</Text>
              </View>
              {/* Pseudo arcs using CSS rotated semi-circles */}
              <View style={[styles.arc, styles.arcLifestyle]} />
              <View style={[styles.arc, styles.arcEssentials]} />
              <View style={[styles.arc, styles.arcGrowth]} />
            </View>

            {/* Legend */}
            <View style={styles.legendContainer}>
              {dashboardData?.spendingMetrics.breakdown.map((item: any, idx: number) => {
                let transKey = item.label.toLowerCase() as any;
                if (transKey.includes("essential")) transKey = "essentials";

                return (
                  <LegendItem
                    key={idx}
                    color={item.color}
                    label={t(transKey)}
                    amount={`Rp ${item.amount.toLocaleString("id-ID")}`}
                  />
                );
              })}
            </View>
          </View>
        </View>

        {/* AI Insight Card - Replaced static with dynamic */}
        <View style={[styles.card, styles.aiInsightCard]}>
          <View style={styles.aiHeader}>
            <MaterialIcons name="auto-awesome" size={24} color="#0d631b" />
            <Text style={styles.aiHeaderText}>{t("intelligence_fragment")}</Text>
          </View>
          
          {isGenerating ? (
            <View style={styles.aiLoadingContainer}>
              <ActivityIndicator size="small" color="#0d631b" />
              <Text style={styles.aiLoadingText}>Menganalisis data finansial Anda...</Text>
            </View>
          ) : latestInsight ? (
            <>
              <Text style={styles.aiMessage}>{latestInsight.message}</Text>
              {latestInsight.suggestedAction !== "none" && (
                <TouchableOpacity 
                  activeOpacity={0.8}
                  onPress={() => {
                    if (latestInsight.suggestedAction === "create_budget") router.push("/(tabs)/home");
                    if (latestInsight.suggestedAction === "add_transaction") router.push("/addTransaction");
                    if (latestInsight.suggestedAction === "view_goals") router.push("/(tabs)/goals");
                  }}
                >
                  <LinearGradient colors={["#0d631b", "#2e7d32"]} style={styles.optimizeBtn}>
                    <Text style={styles.optimizeBtnText}>{latestInsight.actionLabel}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </>
          ) : (
            <>
              <Text style={styles.aiMessage}>
                {hasTransactions 
                  ? "Klik tombol di bawah untuk mendapatkan wawasan cerdas dari AI." 
                  : t("start_adding_tx")}
              </Text>
              {hasTransactions && (
                <TouchableOpacity activeOpacity={0.8} onPress={() => generateNewInsight()}>
                  <LinearGradient colors={["#0d631b", "#2e7d32"]} style={styles.optimizeBtn}>
                    <Text style={styles.optimizeBtnText}>Dapatkan Wawasan AI</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        {/* Micro-Income Cards */}
        <View style={styles.microIncomeGrid}>
          {dashboardData?.microIncomes.map((item: any) => {
            const getTitle = (id: string) => {
              if (id === "tail") return t("affiliate_tail");
              if (id === "staking") return t("staking_rewards");
              if (id === "reit") return t("fractional_reit");
              return item.title;
            };
            const getSubtitle = (id: string) => {
              if (id === "tail") return t("passive_micro_income");
              if (id === "staking") return t("automated_yield");
              if (id === "reit") return t("digital_property");
              return item.subtitle;
            };

            return (
              <MicroCard
                key={item.id}
                icon={item.icon}
                iconBg={item.iconBg}
                iconColor={item.iconColor}
                percent={item.percent === "Stable" ? t("stable" as any) : item.percent}
                percentColor={item.percentColor}
                title={getTitle(item.id)}
                subtitle={getSubtitle(item.id)}
                amount={`Rp ${item.amount.toLocaleString("id-ID")}`}
              />
            );
          })}
        </View>

        {/* Spacer for bottom tab and fab */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Floating Add Transaction Button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => router.push("/addTransaction")}
      >
        <LinearGradient
          colors={["#0d631b", "#88d982"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <MaterialIcons name="add" size={28} color="#ffffff" />
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// Subcomponents
function LegendItem({ color, label, amount }: { color: string; label: string; amount: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <View>
        <Text style={styles.legendLabel}>{label}</Text>
        <Text style={styles.legendAmount}>{amount}</Text>
      </View>
    </View>
  );
}

function MicroCard({
  icon,
  iconBg,
  iconColor,
  percent,
  percentColor,
  title,
  subtitle,
  amount,
}: any) {
  return (
    <View style={[styles.card, styles.microCard]}>
      <View style={styles.microCardHeader}>
        <View style={[styles.microIconWrap, { backgroundColor: iconBg }]}>
          <MaterialIcons name={icon} size={24} color={iconColor} />
        </View>
        <Text style={[styles.microPercent, { color: percentColor }]}>{percent}</Text>
      </View>
      <Text style={styles.microTitle}>{title}</Text>
      <Text style={styles.microSubtitle}>{subtitle}</Text>
      <Text style={styles.microAmount}>
        {amount} <Text style={styles.microAmountMo}>/bln</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 20,
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
    backgroundColor: "#e7e8e9",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#0d631b",
    letterSpacing: -0.3,
  },
  headerRightBtn: {
    padding: 6,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 110,
  },
  heroSection: {
    marginTop: 8,
    marginBottom: 24,
  },
  badge: {
    backgroundColor: "#ffd9e2",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  badgeText: {
    color: "#3f001c",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  heroTitle: {
    fontSize: 42,
    fontWeight: "800",
    color: "#0d631b",
    lineHeight: 48,
    letterSpacing: -1,
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    color: "#40493d",
    lineHeight: 24,
  },
  heroSubtitleHighlight: {
    fontWeight: "700",
    color: "#0d631b",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: "#191c1d",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#191c1d",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#707a6c",
    marginBottom: 24,
  },
  spendingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  donutCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 12,
    borderColor: "#f3f4f5",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  donutInner: {
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    zIndex: 10,
  },
  donutTotal: {
    fontSize: 16,
    fontWeight: "800",
    color: "#191c1d",
    textAlign: "center",
  },
  donutLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#707a6c",
    letterSpacing: 1,
  },
  // Fake donut arcs using border trick
  arc: {
    position: "absolute",
    top: -12,
    left: -12,
    right: -12,
    bottom: -12,
    borderRadius: 70,
    borderWidth: 12,
    borderColor: "transparent",
  },
  arcLifestyle: {
    borderTopColor: "#0d631b",
    borderRightColor: "#0d631b",
    transform: [{ rotate: "-45deg" }],
  },
  arcEssentials: {
    borderLeftColor: "#4c56af",
    transform: [{ rotate: "15deg" }],
  },
  arcGrowth: {
    borderBottomColor: "#923357",
    transform: [{ rotate: "45deg" }],
  },
  legendContainer: {
    flex: 1,
    paddingLeft: 24,
    gap: 16,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#191c1d",
    marginBottom: 2,
  },
  legendAmount: {
    fontSize: 11,
    color: "#707a6c",
  },
  aiInsightCard: {
    backgroundColor: "#f1f8f1",
    borderColor: "#d5ebd5",
    borderWidth: 1,
  },
  aiHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  aiHeaderText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0d631b",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  aiMessage: {
    fontSize: 16,
    color: "#191c1d",
    lineHeight: 24,
    marginBottom: 20,
    fontWeight: "500",
  },
  aiLoadingContainer: {
    paddingVertical: 20,
    alignItems: "center",
    gap: 12,
  },
  aiLoadingText: {
    fontSize: 14,
    color: "#40493d",
    fontWeight: "500",
  },
  optimizeBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  optimizeBtnText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 14,
  },
  microIncomeGrid: {
    gap: 16,
  },
  microCard: {
    padding: 20,
    marginBottom: 0,
  },
  microCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  microIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  microPercent: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 8,
  },
  microTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#191c1d",
    marginBottom: 4,
  },
  microSubtitle: {
    fontSize: 10,
    fontWeight: "700",
    color: "#707a6c",
    letterSpacing: 1,
    marginBottom: 12,
  },
  microAmount: {
    fontSize: 24,
    fontWeight: "800",
    color: "#191c1d",
  },
  microAmountMo: {
    fontSize: 14,
    fontWeight: "400",
    color: "#707a6c",
  },
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
  addFab: {
    bottom: Platform.OS === "ios" ? 180 : 160,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
});
