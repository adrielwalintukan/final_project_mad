import React, { useState, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useDashboardData } from "../../hooks/useDashboardData";
import { useLanguage } from "../../context/LanguageContext";

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

function getDateLabel(timestamp: number, t: any) {
  const d = new Date(timestamp);
  const now = new Date();
  
  const isToday = d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  if (isToday) return t("today") || "Today";
  
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.getDate() === yesterday.getDate() && d.getMonth() === yesterday.getMonth() && d.getFullYear() === yesterday.getFullYear();
  if (isYesterday) return t("yesterday") || "Yesterday";
  
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
}

function translateCategory(category: string, t: any) {
  const normalized = category.toLowerCase();
  const key = normalized === "other" ? "other_income" : normalized;
  return t(key) || category;
}

export default function HistoryScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { balance, totalIncome, totalExpense, transactions, isLoading } = useDashboardData();
  const deleteTransaction = useMutation(api.transactions.deleteTransaction);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");

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

  const groupedTransactions = useMemo(() => {
    const groups: { title: string, data: typeof transactions }[] = [];
    
    filteredTransactions.forEach(tx => {
      const label = getDateLabel(tx.createdAt, t);
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
        <View>
          <Text style={styles.headerTitle}>{t("history") || "Transaction History"}</Text>
          <Text style={styles.headerSubtitle}>{t("track_in_out") || "Track your income and expenses"}</Text>
        </View>
      </View>

      {/* ━━━ SUMMARY CARDS ━━━ */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{t("net_balance") || "Net Balance"}</Text>
          <Text style={[styles.summaryValue, { color: C.onSurface }]} numberOfLines={1} adjustsFontSizeToFit>
            {balance < 0 ? "-" : ""}Rp {formatCurrency(Math.abs(balance)).whole}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{t("inflow") || "Income"}</Text>
          <Text style={[styles.summaryValue, { color: C.primary }]} numberOfLines={1} adjustsFontSizeToFit>
            Rp {formatCurrency(totalIncome).whole}
          </Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>{t("outflow") || "Expense"}</Text>
          <Text style={[styles.summaryValue, { color: C.secondary }]} numberOfLines={1} adjustsFontSizeToFit>
            Rp {formatCurrency(totalExpense).whole}
          </Text>
        </View>
      </View>

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
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
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
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: C.onSurface,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    color: C.onSurfaceVariant,
    marginTop: 4,
  },
  summaryRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
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
  summaryLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: C.onSurfaceVariant,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 16,
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
});
