import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Alert,
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
import { useDashboardData } from "../../hooks/useDashboardData";
import { useFinancialSummary } from "../../hooks/useFinancialSummary";
import { generateSmartFinancialInsight } from "../../services/gemini";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";

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

const getCategoryAppearance = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes("grocery") || cat.includes("food")) {
    return { icon: "shopping-bag" as const, iconBg: C.primaryFixed, iconColor: C.primary };
  }
  if (cat.includes("invest") || cat.includes("salary") || cat.includes("income") || cat.includes("deposit")) {
    return { icon: "payments" as const, iconBg: C.secondaryFixed, iconColor: C.secondary };
  }
  if (cat.includes("din") || cat.includes("restaurant") || cat.includes("eat")) {
    return { icon: "restaurant" as const, iconBg: C.tertiaryFixed, iconColor: C.tertiary };
  }
  if (cat.includes("transport") || cat.includes("ride")) {
    return { icon: "directions-car" as const, iconBg: C.surfaceContainerHigh, iconColor: C.onSurfaceVariant };
  }
  return { icon: "receipt" as const, iconBg: C.surfaceContainerLowest, iconColor: C.onSurfaceVariant };
};

function formatCurrency(num: number) {
  // Extract whole and decimal parts
  const parts = num.toFixed(2).split(".");
  const whole = parseInt(parts[0], 10).toLocaleString();
  return { whole, cents: parts[1] };
}

function translateCategory(category: string, t: any) {
  const normalized = category.toLowerCase();
  const key = normalized === "other" ? "other_income" : normalized;
  return t(key) || category;
}

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { balance, totalIncome, totalExpense, transactions, goals, isEmpty, isLoading } = useDashboardData();
  
  const summaryData = useFinancialSummary(transactions);
  
  const aiLogsRaw = useQuery(api.aiLogs.getAiLogs, user?._id ? { userId: user._id as Id<"users">, type: "daily_insight", limit: 1 } : "skip");
  const latestAiLog = aiLogsRaw?.[0];
  const saveAiLog = useMutation(api.aiLogs.saveAiLog);
 
   const [isGeneratingAi, setIsGeneratingAi] = React.useState(false);
   const [aiError, setAiError] = React.useState<string | null>(null);
 
   // Helper inside component to trigger Gemini
   const handleRefreshInsight = async () => {
     if (isEmpty || !user?._id) return;
     setIsGeneratingAi(true);
     setAiError(null);
     try {
       const result = await generateSmartFinancialInsight(summaryData, transactions, language);
       await saveAiLog({
         userId: user._id as Id<"users">,
         type: "daily_insight",
         prompt: "Auto-generated from transaction summary.",
         response: result,
       });
     } catch (error: any) {
       console.warn("Home AI Insight Error:", error);
       setAiError(t("ai_error_busy"));
     } finally {
       setIsGeneratingAi(false);
     }
   };

  // Auto-generate if no log exists and the user has transactions
  React.useEffect(() => {
    if (!isLoading && !isEmpty && user?._id && aiLogsRaw && aiLogsRaw.length === 0) {
      if (!isGeneratingAi) {
         handleRefreshInsight();
      }
    }
  }, [isLoading, isEmpty, user?._id, aiLogsRaw]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: "center", alignItems: "center" }]} edges={["top"]}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={{ marginTop: 12, color: C.onSurfaceVariant, fontWeight: "500" }}>{t("loading_dashboard")}</Text>
      </SafeAreaView>
    );
  }

  // Safely parse AI JSON response
  let aiData = { message: "", suggestedAction: "none", actionLabel: "" };
  if (latestAiLog?.response) {
    try {
      const parsed = JSON.parse(latestAiLog.response);
      aiData = {
        message: parsed.message || latestAiLog.response,
        suggestedAction: parsed.suggestedAction || "none",
        actionLabel: parsed.actionLabel || "",
      };
    } catch {
      // Fallback for older plain text strings
      aiData.message = latestAiLog.response;
    }
  }

  const { whole: balanceWhole, cents: balanceCents } = formatCurrency(Math.abs(balance));
  
  // Handlers for dynamic AI CTAs
  const handleAiAction = () => {
    switch(aiData.suggestedAction) {
      case "create_budget":
        router.push("/createBudget");
        break;
      case "add_transaction":
        router.push("/addTransaction");
        break;
      case "view_goals":
        router.push("/goals");
        break;
      default:
        break;
    }
  };

  // Calculate flow tracks width securely
  const totalFlow = totalIncome + totalExpense || 1;
  const incomeWidth = Math.min(100, Math.max(5, (totalIncome / totalFlow) * 100));
  const expenseWidth = Math.min(100, Math.max(5, (totalExpense / totalFlow) * 100));

  const activeGoal = goals.length > 0 ? goals[0] : null;
  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* ━━━ HEADER ━━━ */}
      <View style={[styles.header, { paddingHorizontal: 20 }]}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarWrap}>
            {user?.photoUrl ? (
              <Image
                source={{ uri: user.photoUrl }}
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, { alignItems: "center", justifyContent: "center", backgroundColor: C.surfaceContainerHigh }]}>
                <MaterialIcons name="person" size={22} color={C.onSurfaceVariant} />
              </View>
            )}
          </View>
          <Text style={styles.brandName}>{user?.name?.split(" ")[0] || "DailyBoost"}</Text>
        </View>
        <TouchableOpacity 
          activeOpacity={0.7} 
          style={styles.headerAction}
          onPress={() => router.push("/chatbot")}
        >
          <MaterialIcons name="auto-awesome" size={24} color={C.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ━━━ HERO BALANCE ━━━ */}
        <View style={styles.heroSection}>
          <View style={styles.statusDot}>
            <View style={styles.dot} />
            <Text style={styles.statusLabel}>{t("home_balance_label" as any)}</Text>
          </View>
          <Text 
            style={styles.heroAmount}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {balance < 0 ? "-" : ""}Rp {balanceWhole}<Text style={styles.heroCents}>.{balanceCents}</Text>
          </Text>
          <View style={styles.incExpRow}>
            <View style={styles.incExpItem}>
              <View style={styles.incIconWrap}>
                <MaterialIcons name="arrow-downward" size={18} color={C.primary} />
              </View>
              <View>
                <Text style={styles.incExpLabel}>{t("home_income" as any)}</Text>
                <Text style={styles.incExpAmount}>{"Rp " + totalIncome.toLocaleString("id-ID")}</Text>
              </View>
            </View>
            <View style={styles.incExpDivider} />
            <View style={styles.incExpItem}>
              <View style={styles.expIconWrap}>
                <MaterialIcons name="arrow-upward" size={18} color={C.tertiary} />
              </View>
              <View>
                <Text style={styles.incExpLabel}>{t("home_expense" as any)}</Text>
                <Text style={styles.incExpAmount}>{"Rp " + totalExpense.toLocaleString("id-ID")}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ━━━ AI INSIGHT CARD ━━━ */}
        <View style={styles.aiCard}>
          <View style={{ backgroundColor: "#fce4ec", borderRadius: 24, padding: 22 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(136,21,62,0.12)", justifyContent: "center", alignItems: "center", marginRight: 10 }}>
                <MaterialIcons name="lightbulb" size={16} color="#88153e" />
              </View>
              <Text style={{ fontSize: 11, fontWeight: "800", color: "#88153e", textTransform: "uppercase", letterSpacing: 1.5 }}>
                {t("home_ai_fragment" as any)}
              </Text>
              {!isEmpty && (
                <TouchableOpacity onPress={handleRefreshInsight} disabled={isGeneratingAi} activeOpacity={0.7} style={{ marginLeft: "auto", padding: 4 }}>
                  <MaterialIcons name="refresh" size={20} color={isGeneratingAi ? "#d4a0b0" : "#88153e"} />
                </TouchableOpacity>
              )}
            </View>

            {isEmpty ? (
              <View>
                <Text style={{ fontSize: 24, fontWeight: "800", color: "#5a0f2a", lineHeight: 30, marginBottom: 12 }}>
                  {t("activity_monitoring" as any)}
                </Text>
                <Text style={{ fontSize: 15, color: "#88153e", lineHeight: 22, marginBottom: 18, opacity: 0.7 }}>
                  {t("no_new_insights" as any)}
                </Text>
                <TouchableOpacity 
                   onPress={() => router.push("/addTransaction")}
                   style={{ backgroundColor: "#ffffff", paddingVertical: 12, paddingHorizontal: 20, borderRadius: 14, alignSelf: "flex-start", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 }}>
                  <Text style={{ color: "#5a0f2a", fontWeight: "800", fontSize: 14 }}>{t("add_transaction" as any)}</Text>
                </TouchableOpacity>
              </View>
            ) : isGeneratingAi ? (
              <View style={{ paddingVertical: 16, alignItems: "center", justifyContent: "center", gap: 12, minHeight: 80 }}>
                 <ActivityIndicator size="small" color="#88153e" />
                 <Text style={{ fontSize: 13, color: "#88153e", opacity: 0.7 }}>{t("home_ai_analyzing" as any)}</Text>
              </View>
            ) : aiError ? (
              <View style={{ paddingVertical: 16, alignItems: "center", justifyContent: "center", gap: 8, minHeight: 80 }}>
                 <MaterialIcons name="cloud-off" size={24} color="#d4a0b0" />
                 <Text style={{ fontSize: 13, color: "#88153e", textAlign: "center", opacity: 0.7 }}>{aiError}</Text>
                 <TouchableOpacity 
                   onPress={handleRefreshInsight}
                   style={{ marginTop: 8, backgroundColor: "#ffffff", paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 }}
                 >
                   <Text style={{ fontSize: 12, fontWeight: "700", color: "#88153e" }}>{t("review_insight" as any)}</Text>
                 </TouchableOpacity>
              </View>
            ) : (
              <View>
                <Text style={{ fontSize: 24, fontWeight: "800", color: "#5a0f2a", lineHeight: 30, marginBottom: 12 }}>
                  {t("intelligence_fragment" as any)}
                </Text>
                <Text style={{ fontSize: 15, color: "#88153e", lineHeight: 22, opacity: 0.7, marginBottom: 18 }}>
                  {aiData.message || "Terus catat anggaran Anda!"}
                </Text>
                
                {aiData.suggestedAction !== "none" && aiData.actionLabel && (
                  <TouchableOpacity 
                    onPress={handleAiAction}
                    activeOpacity={0.7}
                    style={{
                      alignSelf: "flex-start",
                      paddingVertical: 12,
                      paddingHorizontal: 20,
                      borderRadius: 14,
                      backgroundColor: "#ffffff",
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.06,
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: "800", color: "#5a0f2a" }}>
                      {aiData.actionLabel}
                    </Text>
                  </TouchableOpacity>
                )}

                {latestAiLog && (
                  <Text style={{ fontSize: 10, color: "#88153e", marginTop: 14, opacity: 0.5, fontStyle: "italic" }}>
                    Generated on {new Date(latestAiLog.createdAt).toLocaleString()}
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>


        {/* ━━━ RECENT LEDGER ━━━ */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("recent_ledger")}</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.sectionAction}>{t("review_all")}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.ledgerWrap, isEmpty ? {} : styles.elevation]}>
          {isEmpty ? (
            <View style={{ paddingVertical: 20, alignItems: "center" }}>
              <Text style={{ color: C.onSurfaceVariant, fontSize: 13, fontWeight: "500" }}>{t("no_tx_yet")}</Text>
            </View>
          ) : (
            transactions.slice(0, 5).map((tx, idx) => {
              const appearance = getCategoryAppearance(tx.category);
              const txDate = new Date(tx.createdAt).toLocaleDateString();

              return (
                <TouchableOpacity
                  key={tx._id}
                  activeOpacity={0.8}
                  style={[
                    styles.txRow,
                    idx < Math.min(transactions.length, 5) - 1 && styles.txRowBorder,
                  ]}
                >
                  <View style={[styles.txIcon, { backgroundColor: appearance.iconBg }]}>
                    <MaterialIcons name={appearance.icon} size={22} color={appearance.iconColor} />
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txTitle} numberOfLines={1}>
                      {tx.note || translateCategory(tx.category, t)}
                    </Text>
                    <Text style={styles.txMeta}>
                      {translateCategory(tx.category, t)} • {txDate}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.txAmount,
                      { color: tx.type === "income" ? C.primary : C.onSurface },
                    ]}
                  >
                    {tx.type === "income" ? "+" : "-"}Rp {formatCurrency(Math.abs(tx.amount)).whole}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* ━━━ GOAL TRACKING ━━━ */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t("active_quest")}</Text>
        </View>

        {activeGoal ? (
          <TouchableOpacity activeOpacity={0.9} style={[styles.goalCard, styles.elevation]} onPress={() => router.push("/(tabs)/goals")}>
            <Text style={styles.goalLabel}>{t("active_quest_label")}</Text>
            <Text style={styles.goalTitle}>{activeGoal.title}</Text>
            <View style={styles.goalProgressSection}>
              <Text style={styles.goalProgressText}>Rp {formatCurrency(activeGoal.currentAmount).whole} / Rp {formatCurrency(activeGoal.targetAmount).whole}</Text>
              <View style={styles.goalTrack}>
                <LinearGradient
                  colors={[C.primary, C.primaryContainer]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.goalFill, { width: `${Math.min(100, Math.max(0, (activeGoal.currentAmount / activeGoal.targetAmount) * 100))}%` }]}
                />
              </View>
            </View>
          </TouchableOpacity>
        ) : (
          <View style={{ padding: 12, alignItems: "center" }}>
            <Text style={{ color: C.onSurfaceVariant, fontSize: 13, fontWeight: "500" }}>{t("no_goals_yet")}</Text>
          </View>
        )}

        {/* Manifest New Goal */}
        <TouchableOpacity activeOpacity={0.8} style={styles.newGoalCard} onPress={() => router.push("/(tabs)/goals")}>
          <View style={styles.newGoalCircle}>
            <Ionicons name="add" size={28} color={C.primary} />
          </View>
          <Text style={styles.newGoalText}>{t("manifest_goal")}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ━━━ FLOATING ADD BUTTON ━━━ */}
      <TouchableOpacity 
        activeOpacity={0.85} 
        style={styles.fab} 
        onPress={() => router.push("/addTransaction")}
      >
        <LinearGradient
          colors={[C.primary, C.primaryFixedDim]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <MaterialIcons name="add" size={28} color="#fff" />
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
    width: 36,
    height: 36,
    borderRadius: 18,
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
  incExpRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
    paddingVertical: 4,
  },
  incExpItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  incIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.primaryFixed,
    alignItems: "center",
    justifyContent: "center",
  },
  expIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.tertiaryFixed,
    alignItems: "center",
    justifyContent: "center",
  },
  incExpLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: C.onSurfaceVariant,
    marginBottom: 2,
  },
  incExpAmount: {
    fontSize: 16,
    fontWeight: "800",
    color: C.onSurface,
  },
  incExpDivider: {
    width: 1,
    height: 32,
    backgroundColor: C.outlineVariant,
    marginHorizontal: 12,
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

  // Utility
  elevation: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
});
