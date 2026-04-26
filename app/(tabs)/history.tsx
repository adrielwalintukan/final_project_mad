import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Animated, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useDashboardData } from "../../hooks/useDashboardData";
import { useLanguage } from "../../context/LanguageContext";
import { useAuth } from "../../context/AuthContext";

// ─── Color Tokens (DailyBoost AI matching) ───
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
  const parts = num.toFixed(2).split(".");
  const whole = parseInt(parts[0], 10).toLocaleString();
  return { whole, cents: parts[1] };
}

function getDateLabel(timestamp: number, t: any, language: string) {
  const d = new Date(timestamp);
  const now = new Date();
  
  const isToday = d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  if (isToday) return t("today") || "Today";
  
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.getDate() === yesterday.getDate() && d.getMonth() === yesterday.getMonth() && d.getFullYear() === yesterday.getFullYear();
  if (isYesterday) return t("yesterday") || "Yesterday";
  
  const locale = language === "en" ? "en-US" : "id-ID";
  return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
}

function translateCategory(category: string, t: any) {
  const normalized = category.toLowerCase();
  const key = normalized === "other" ? "other_income" : normalized;
  return t(key) || category;
}

export default function HistoryScreen() {
  const router = useRouter();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { balance, totalIncome, totalExpense, transactions, isLoading } = useDashboardData();
  const deleteTransaction = useMutation(api.transactions.deleteTransaction);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [categoryExpanded, setCategoryExpanded] = useState(false);
  const CATEGORY_PREVIEW_COUNT = 3;

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // Type filter
      if (filterType !== "all" && tx.type !== filterType) return false;
      
      // Search logic (matches category or note)
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase();
        const catMatch = tx.category.toLowerCase().includes(q);
        const noteMatch = tx.note ? tx.note.toLowerCase().includes(q) : false;
        if (!catMatch && !noteMatch) return false;
      }
      return true;
    });
  }, [transactions, filterType, searchQuery]);

  // Compute category totals for the summary card
  const categorySummary = useMemo(() => {
    const map: Record<string, { total: number; type: "income" | "expense" | "mixed"; count: number }> = {};
    
    transactions.forEach(tx => {
      const cat = tx.category;
      if (!map[cat]) {
        map[cat] = { total: 0, type: tx.type, count: 0 };
      }
      if (tx.type === "expense") {
        map[cat].total += tx.amount;
      } else {
        map[cat].total += tx.amount;
      }
      if (map[cat].type !== tx.type) {
        map[cat].type = "mixed";
      }
      map[cat].count += 1;
    });

    return Object.entries(map)
      .map(([category, data]) => ({
        category,
        total: data.total,
        type: data.type,
        count: data.count,
        ...getCategoryAppearance(category),
      }))
      .sort((a, b) => b.total - a.total);
  }, [transactions]);

  const groupedTransactions = useMemo(() => {
    const groups: { title: string, data: typeof transactions }[] = [];
    
    filteredTransactions.forEach(tx => {
      const label = getDateLabel(tx.createdAt, t, language);
      let g = groups.find(x => x.title === label);
      if (!g) {
        g = { title: label, data: [] };
        groups.push(g);
      }
      g.data.push(tx);
    });
    
    return groups;
  }, [filteredTransactions, t]);

  const handleDelete = (id: any) => {
    Alert.alert(
      t("delete_transaction") || "Delete Transaction",
      t("delete_confirm_msg") || "Are you sure you want to delete this transaction? This action cannot be undone.",
      [
        { text: t("cancel") || "Cancel", style: "cancel" },
        { 
          text: t("delete") || "Delete", 
          style: "destructive",
          onPress: () => {
            deleteTransaction({ transactionId: id }).catch(console.error);
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* ━━━ HEADER ━━━ */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarWrap}>
            {user?.photoUrl ? (
              <Image source={{ uri: user.photoUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { alignItems: "center", justifyContent: "center", backgroundColor: C.surfaceContainerHigh }]}>
                <MaterialIcons name="person" size={22} color={C.onSurfaceVariant} />
              </View>
            )}
          </View>
          <Text style={styles.headerTitle}>{user?.name?.split(" ")[0] || t("history")}</Text>
        </View>
        <TouchableOpacity 
          activeOpacity={0.7} 
          onPress={() => router.push("/chatbot")}
          style={{ padding: 6 }}
        >
          <MaterialIcons name="auto-awesome" size={24} color={C.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

      {/* ━━━ SUMMARY CARDS ━━━ */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { borderLeftWidth: 3, borderLeftColor: C.onSurface }]}>
          <View style={styles.summaryCardHeader}>
            <View style={[styles.summaryIconWrap, { backgroundColor: C.surfaceContainerHigh }]}>
              <MaterialIcons name="account-balance-wallet" size={16} color={C.onSurface} />
            </View>
          </View>
          <Text style={styles.summaryLabel} numberOfLines={1}>{t("net_balance")}</Text>
          <Text style={[styles.summaryValue, { color: balance >= 0 ? C.primary : C.error }]} numberOfLines={1} adjustsFontSizeToFit>
            {balance < 0 ? "-" : ""}Rp {formatCurrency(Math.abs(balance)).whole}
          </Text>
        </View>
        <View style={[styles.summaryCard, { borderLeftWidth: 3, borderLeftColor: C.primary }]}>
          <View style={styles.summaryCardHeader}>
            <View style={[styles.summaryIconWrap, { backgroundColor: C.primaryFixed }]}>
              <MaterialIcons name="trending-up" size={16} color={C.primary} />
            </View>
          </View>
          <Text style={styles.summaryLabel} numberOfLines={1}>{t("income")}</Text>
          <Text style={[styles.summaryValue, { color: C.primary }]} numberOfLines={1} adjustsFontSizeToFit>
            Rp {formatCurrency(totalIncome).whole}
          </Text>
        </View>
        <View style={[styles.summaryCard, { borderLeftWidth: 3, borderLeftColor: C.tertiary }]}>
          <View style={styles.summaryCardHeader}>
            <View style={[styles.summaryIconWrap, { backgroundColor: C.tertiaryFixed }]}>
              <MaterialIcons name="trending-down" size={16} color={C.tertiary} />
            </View>
          </View>
          <Text style={styles.summaryLabel} numberOfLines={1}>{t("expense")}</Text>
          <Text style={[styles.summaryValue, { color: C.tertiary }]} numberOfLines={1} adjustsFontSizeToFit>
            Rp {formatCurrency(totalExpense).whole}
          </Text>
        </View>
      </View>

      {/* ━━━ CATEGORY BREAKDOWN CARD ━━━ */}
      {categorySummary.length > 0 && (
        <View style={styles.categoryBreakdownCard}>
          <View style={styles.categoryBreakdownHeader}>
            <MaterialIcons name="pie-chart" size={18} color={C.primary} />
            <Text style={styles.categoryBreakdownTitle}>
              {t("hist_cat_summary")}
            </Text>
            <Text style={styles.categoryBreakdownCount}>
              {categorySummary.length} {t("hist_cat_count")}
            </Text>
          </View>
          <View style={{ overflow: "hidden" }}>
            {(categoryExpanded ? categorySummary : categorySummary.slice(0, CATEGORY_PREVIEW_COUNT)).map((cat, idx) => {
              const visibleItems = categoryExpanded ? categorySummary : categorySummary.slice(0, CATEGORY_PREVIEW_COUNT);
              const isLast = idx === visibleItems.length - 1;
              const isIncome = cat.type === "income";
              const totalAll = categorySummary.reduce((sum, c) => sum + c.total, 0);
              const pct = totalAll > 0 ? (cat.total / totalAll) * 100 : 0;
              return (
                <View key={cat.category} style={[styles.catBreakdownItem, !isLast && styles.catBreakdownItemBorder]}>
                  <View style={[styles.catBreakdownIcon, { backgroundColor: cat.iconBg }]}>
                    <MaterialIcons name={cat.icon} size={18} color={cat.iconColor} />
                  </View>
                  <View style={styles.catBreakdownBody}>
                    <View style={styles.catBreakdownTopRow}>
                      <Text style={styles.catBreakdownName} numberOfLines={1}>
                        {translateCategory(cat.category, t)}
                      </Text>
                      <Text style={[styles.catBreakdownAmount, { color: isIncome ? C.primary : C.onSurface }]}>
                        {isIncome ? "+" : "-"}Rp {formatCurrency(cat.total).whole}
                      </Text>
                    </View>
                    <View style={styles.catBreakdownBarBg}>
                      <View
                        style={[
                          styles.catBreakdownBarFill,
                          {
                            width: `${Math.min(pct, 100)}%`,
                            backgroundColor: isIncome ? C.primaryFixed : C.secondaryContainer,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.catBreakdownMeta}>
                      {cat.count} {t("hist_transactions")} · {pct.toFixed(1)}%
                    </Text>
                  </View>
                </View>
              );
            })}
            {/* Gradient fade overlay when collapsed */}
            {!categoryExpanded && categorySummary.length > CATEGORY_PREVIEW_COUNT && (
              <LinearGradient
                colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.95)", "#ffffff"]}
                style={styles.catGradientOverlay}
                pointerEvents="none"
              />
            )}
          </View>
          {/* Expand / Collapse toggle */}
          {categorySummary.length > CATEGORY_PREVIEW_COUNT && (
            <TouchableOpacity
              style={styles.catExpandBtn}
              onPress={() => setCategoryExpanded(!categoryExpanded)}
              activeOpacity={0.7}
            >
              <Text style={styles.catExpandText}>
                {categoryExpanded ? t("show_less") : `${t("see_all_count")} (${categorySummary.length})`}
              </Text>
              <MaterialIcons
                name={categoryExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"}
                size={20}
                color={C.primary}
              />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ━━━ SEARCH & FILTER ━━━ */}
      <View style={styles.controlsSection}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color={C.outline} />
          <TextInput
            style={styles.searchInput}
            placeholder={t("search") || "Search categories or notes..."}
            placeholderTextColor={C.outlineVariant}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <MaterialIcons name="close" size={20} color={C.onSurfaceVariant} />
            </TouchableOpacity>
          )}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {(["all", "income", "expense"] as const).map(f => (
            <TouchableOpacity 
              key={f}
              style={[styles.filterChip, filterType === f && styles.filterChipActive]}
              onPress={() => setFilterType(f)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, filterType === f && styles.filterChipTextActive]}>
                {t(f) || f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ━━━ TRANSACTIONS LIST ━━━ */}
      <View style={styles.listContent}>
        {isLoading ? (
           <View style={styles.centerWrap}>
             <ActivityIndicator size="large" color={C.primary} />
           </View>
        ) : groupedTransactions.length === 0 ? (
           <View style={styles.emptyState}>
             <View style={styles.emptyIconWrap}>
               <MaterialIcons name="search-off" size={48} color={C.outlineVariant} />
             </View>
             <Text style={styles.emptyTitle}>{t("no_tx_yet") || "No transactions found"}</Text>
             <Text style={styles.emptySub}>{t("start_adding_tx") || "Start adding income or expenses to see them here."}</Text>
             <TouchableOpacity style={styles.addBtn} activeOpacity={0.8} onPress={() => router.push("/addTransaction")}>
               <Text style={styles.addBtnText}>{t("add_transaction") || "Add Transaction"}</Text>
             </TouchableOpacity>
           </View>
        ) : (
          groupedTransactions.map(group => (
            <View key={group.title} style={styles.groupContainer}>
              <Text style={styles.groupHeader}>{group.title}</Text>
              <View style={styles.groupCard}>
                {group.data.map((tx, idx) => {
                  const appearance = getCategoryAppearance(tx.category);
                  const isLast = idx === group.data.length - 1;
                  return (
                    <TouchableOpacity 
                      key={tx._id} 
                      activeOpacity={0.7} 
                      style={[styles.txItem, !isLast && styles.txItemBorder]}
                      onLongPress={() => handleDelete(tx._id)}
                    >
                      <View style={[styles.txIconWrap, { backgroundColor: appearance.iconBg }]}>
                        <MaterialIcons name={appearance.icon} size={22} color={appearance.iconColor} />
                      </View>
                      <View style={styles.txBody}>
                        <Text style={styles.txTitle} numberOfLines={1}>{tx.note || translateCategory(tx.category, t)}</Text>
                        <Text style={styles.txMeta}>{translateCategory(tx.category, t)}</Text>
                      </View>
                      <Text style={[styles.txAmount, { color: tx.type === "income" ? C.primary : C.onSurface }]}>
                        {tx.type === "income" ? "+" : "-"}Rp {formatCurrency(Math.abs(tx.amount)).whole}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
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
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: C.primary,
    letterSpacing: -0.3,
  },
  summaryRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: C.surfaceContainerLowest,
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryCardHeader: {
    marginBottom: 8,
  },
  summaryIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: C.onSurfaceVariant,
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: "800",
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surfaceContainerLowest,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: C.surfaceContainerHigh,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    minWidth: 140,
  },
  categoryIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryName: {
    fontSize: 12,
    fontWeight: "700",
    color: C.onSurfaceVariant,
    marginBottom: 2,
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: "800",
  },
  noCategoryMsg: {
    paddingVertical: 10,
  },
  noCategoryText: {
    fontSize: 13,
    color: C.outline,
    fontStyle: "italic",
  },
  controlsSection: {
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surfaceContainerLowest,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: C.surfaceContainerHigh,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: C.onSurface,
  },
  filterScroll: {
    flexDirection: "row",
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.surfaceContainerHigh,
  },
  filterChipActive: {
    backgroundColor: C.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: C.onSurfaceVariant,
  },
  filterChipTextActive: {
    color: C.onPrimary,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  centerWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 60,
  },
  emptyState: {
    alignItems: "center",
    marginTop: 60,
    paddingHorizontal: 24,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: C.surfaceContainerHigh,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: C.onSurface,
    marginBottom: 8,
  },
  emptySub: {
    fontSize: 14,
    color: C.outline,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  addBtn: {
    backgroundColor: C.primaryContainer,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addBtnText: {
    color: C.onPrimary,
    fontWeight: "700",
    fontSize: 14,
  },
  groupContainer: {
    marginBottom: 24,
  },
  groupHeader: {
    fontSize: 14,
    fontWeight: "700",
    color: C.onSurfaceVariant,
    marginBottom: 12,
    paddingLeft: 4,
  },
  groupCard: {
    backgroundColor: C.surfaceContainerLowest,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  txItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  txItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: C.surfaceContainerHigh,
  },
  txIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  txBody: {
    flex: 1,
    marginRight: 10,
  },
  txTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: C.onSurface,
    marginBottom: 4,
  },
  txMeta: {
    fontSize: 12,
    fontWeight: "500",
    color: C.onSurfaceVariant,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: "800",
  },

  // Category Breakdown Card
  categoryBreakdownCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: C.surfaceContainerLowest,
    borderRadius: 20,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryBreakdownHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  categoryBreakdownTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: C.onSurface,
    letterSpacing: -0.3,
  },
  catBreakdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  catBreakdownItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: C.surfaceContainerHigh,
  },
  catBreakdownIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  catBreakdownBody: {
    flex: 1,
  },
  catBreakdownTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  catBreakdownName: {
    fontSize: 13,
    fontWeight: "700",
    color: C.onSurface,
    flex: 1,
    marginRight: 8,
  },
  catBreakdownAmount: {
    fontSize: 14,
    fontWeight: "800",
  },
  catBreakdownBarBg: {
    height: 4,
    borderRadius: 2,
    backgroundColor: C.surfaceContainerHigh,
    marginBottom: 4,
    overflow: "hidden",
  },
  catBreakdownBarFill: {
    height: 4,
    borderRadius: 2,
  },
  catBreakdownMeta: {
    fontSize: 11,
    fontWeight: "500",
    color: C.outline,
  },
  categoryBreakdownCount: {
    fontSize: 11,
    fontWeight: "600",
    color: C.outline,
    marginLeft: "auto",
    backgroundColor: C.surfaceContainerHigh,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  catGradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
  },
  catExpandBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 12,
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: C.surfaceContainerHigh,
    marginTop: 4,
  },
  catExpandText: {
    fontSize: 13,
    fontWeight: "700",
    color: C.primary,
  },
});
