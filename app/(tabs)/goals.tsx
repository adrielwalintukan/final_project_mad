import React, { useState, useMemo } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal,
  TextInput, Alert, ActivityIndicator, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import { Id } from "../../convex/_generated/dataModel";

const C = {
  primary: "#0d631b", primaryContainer: "#2e7d32", primaryFixed: "#a3f69c",
  primaryFixedDim: "#88d982", onPrimary: "#fff", onPrimaryFixed: "#002204",
  background: "#f8f9fa", surface: "#fff", surfaceContainerLow: "#f3f4f5",
  surfaceContainerHigh: "#e7e8e9", surfaceContainerHighest: "#e1e3e4",
  onSurface: "#191c1d", onSurfaceVariant: "#40493d", outline: "#707a6c",
  outlineVariant: "#bfcaba", error: "#ba1a1a", tertiary: "#923357",
  tertiaryFixed: "#ffd9e2",
};

const ICONS = [
  { id: "savings", icon: "savings", label: "Tabungan" },
  { id: "home", icon: "home", label: "Rumah" },
  { id: "directions-car", icon: "directions-car", label: "Kendaraan" },
  { id: "flight", icon: "flight", label: "Liburan" },
  { id: "school", icon: "school", label: "Pendidikan" },
  { id: "phone-iphone", icon: "phone-iphone", label: "Gadget" },
  { id: "medical-services", icon: "medical-services", label: "Kesehatan" },
  { id: "diamond", icon: "diamond", label: "Investasi" },
  { id: "business-center", icon: "business-center", label: "Bisnis" },
  { id: "favorite", icon: "favorite", label: "Nikah" },
  { id: "shield", icon: "shield", label: "Darurat" },
  { id: "shopping-bag", icon: "shopping-bag", label: "Belanja" },
  { id: "fitness-center", icon: "fitness-center", label: "Olahraga" },
  { id: "headphones", icon: "headphones", label: "Musik" },
  { id: "restaurant", icon: "restaurant", label: "Makanan" },
  { id: "camera-alt", icon: "camera-alt", label: "Kamera" },
  { id: "pets", icon: "pets", label: "Hewan" },
  { id: "redeem", icon: "redeem", label: "Hadiah" },
  { id: "child-care", icon: "child-care", label: "Anak" },
  { id: "laptop", icon: "laptop", label: "Laptop" },
  { id: "two-wheeler", icon: "two-wheeler", label: "Motor" },
];

function formatRp(n: number) {
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}

export default function GoalsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const userId = user?._id as Id<"users">;

  const goalsRaw = useQuery(api.goals.getGoals, userId ? { userId } : "skip");
  const createGoal = useMutation(api.goals.createGoal);
  const addSavingsMut = useMutation(api.goals.addSavings);
  const deleteGoalMut = useMutation(api.goals.deleteGoal);

  const goals = goalsRaw || [];
  const isLoading = goalsRaw === undefined;

  const [showAddModal, setShowAddModal] = useState(false);
  const [showSavingsModal, setShowSavingsModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<any>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newIcon, setNewIcon] = useState("savings");
  const [savingsAmount, setSavingsAmount] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const summary = useMemo(() => {
    const totalTarget = goals.reduce((s: number, g: any) => s + g.targetAmount, 0);
    const totalSaved = goals.reduce((s: number, g: any) => s + g.currentAmount, 0);
    const activeCount = goals.filter((g: any) => (g.status || "active") === "active").length;
    const completedCount = goals.filter((g: any) => g.status === "completed").length;
    return { totalTarget, totalSaved, activeCount, completedCount };
  }, [goals]);

  const handleCreateGoal = async () => {
    if (!newTitle.trim() || !newTarget.trim()) {
      Alert.alert("Error", t("goals_error_fill_fields" as any));
      return;
    }
    const target = parseFloat(newTarget.replace(/[^0-9]/g, ""));
    if (isNaN(target) || target <= 0) {
      Alert.alert("Error", t("goals_error_valid_target" as any));
      return;
    }
    setIsSaving(true);
    try {
      await createGoal({ userId, title: newTitle.trim(), targetAmount: target, icon: newIcon });
      setShowAddModal(false);
      setNewTitle("");
      setNewTarget("");
      setNewIcon("savings");
    } catch (e) { Alert.alert("Error", t("goals_error_create" as any)); }
    finally { setIsSaving(false); }
  };

  const handleAddSavings = async () => {
    if (!selectedGoal || !savingsAmount.trim()) return;
    const amount = parseFloat(savingsAmount.replace(/[^0-9]/g, ""));
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Error", t("goals_error_valid_amount" as any));
      return;
    }
    setIsSaving(true);
    try {
      await addSavingsMut({ goalId: selectedGoal._id, amount });
      setShowSavingsModal(false);
      setSavingsAmount("");
      setSelectedGoal(null);
    } catch (e) { Alert.alert("Error", t("goals_error_add" as any)); }
    finally { setIsSaving(false); }
  };

  const handleDelete = (goal: any) => {
    Alert.alert(t("goals_delete_title" as any), `${t("goals_delete_confirm" as any)} "${goal.title}"?`, [
      { text: t("cancel" as any), style: "cancel" },
      { text: t("delete" as any), style: "destructive", onPress: () => deleteGoalMut({ goalId: goal._id }) },
    ]);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={s.container} edges={["top"]}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={["top"]}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>{t("goals_title" as any)}</Text>
          <Text style={s.headerSub}>{t("goals_subtitle" as any)}</Text>
        </View>
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.push("/chatbot")} style={{ padding: 8 }}>
          <MaterialIcons name="auto-awesome" size={24} color={C.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Summary Card */}
        <LinearGradient colors={[C.primary, C.primaryContainer]} style={s.summaryCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={s.summaryTop}>
            <View style={s.summaryIconWrap}>
              <MaterialIcons name="flag" size={20} color={C.primary} />
            </View>
            <Text style={s.summaryLabel}>{t("goals_summary_label" as any)}</Text>
          </View>
          <Text style={s.summaryTotal}>{formatRp(summary.totalSaved)}</Text>
          <Text style={s.summarySubTotal}>{t("goals_from_target" as any) + " " + formatRp(summary.totalTarget) + " " + t("goals_target_word" as any)}</Text>
          {summary.totalTarget > 0 && (
            <View style={s.summaryBar}>
              <View style={[s.summaryBarFill, { width: `${Math.min(100, (summary.totalSaved / summary.totalTarget) * 100)}%` }]} />
            </View>
          )}
          <View style={s.summaryStats}>
            <View style={s.statItem}>
              <Text style={s.statNum}>{String(summary.activeCount)}</Text>
              <Text style={s.statLabel}>{t("goals_active" as any)}</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={s.statNum}>{String(summary.completedCount)}</Text>
              <Text style={s.statLabel}>{t("goals_completed" as any)}</Text>
            </View>
            <View style={s.statDivider} />
            <View style={s.statItem}>
              <Text style={s.statNum}>{String(goals.length)}</Text>
              <Text style={s.statLabel}>{t("goals_total" as any)}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Goals List */}
        {goals.length === 0 ? (
          <View style={s.emptyState}>
            <View style={s.emptyIcon}>
              <MaterialIcons name="track-changes" size={40} color={C.primary} />
            </View>
            <Text style={s.emptyTitle}>{t("goals_empty_title" as any)}</Text>
            <Text style={s.emptyText}>{t("goals_empty_text" as any)}</Text>
          </View>
        ) : (
          <View style={{ gap: 14 }}>
            <Text style={s.sectionTitle}>{t("goals_your_goals" as any)}</Text>
            {goals.map((goal: any) => {
              const pct = goal.targetAmount > 0 ? Math.min(100, (goal.currentAmount / goal.targetAmount) * 100) : 0;
              const isCompleted = goal.status === "completed";
              const iconName = goal.icon || "savings";
              return (
                <View key={goal._id} style={s.goalCard}>
                  <View style={s.goalTop}>
                    <View style={[s.goalIconWrap, isCompleted && { backgroundColor: "#e8f5e9" }]}>
                      <MaterialIcons name={iconName as any} size={22} color={isCompleted ? C.primary : C.onSurfaceVariant} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={s.goalTitle} numberOfLines={1}>{goal.title}</Text>
                      <Text style={s.goalSub}>{formatRp(goal.currentAmount) + " / " + formatRp(goal.targetAmount)}</Text>
                    </View>
                    <TouchableOpacity onPress={() => handleDelete(goal)} style={{ padding: 4 }}>
                      <MaterialIcons name="delete-outline" size={20} color={C.outline} />
                    </TouchableOpacity>
                  </View>
                  <View style={s.progressBarBg}>
                    <LinearGradient
                      colors={isCompleted ? ["#4caf50", "#81c784"] : [C.primary, C.primaryFixedDim]}
                      style={[s.progressBarFill, { width: `${pct}%` }]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    />
                  </View>
                  <View style={s.goalBottom}>
                    <Text style={[s.goalPct, isCompleted && { color: "#4caf50" }]}>
                      {isCompleted ? t("goals_achieved" as any) : `${pct.toFixed(0)}%`}
                    </Text>
                    {!isCompleted && (
                      <TouchableOpacity
                        style={s.addSavingsBtn}
                        activeOpacity={0.7}
                        onPress={() => { setSelectedGoal(goal); setShowSavingsModal(true); }}
                      >
                        <MaterialIcons name="add" size={16} color={C.primary} />
                        <Text style={s.addSavingsText}>{t("goals_add_savings" as any)}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={s.fab} activeOpacity={0.85} onPress={() => setShowAddModal(true)}>
        <LinearGradient colors={[C.primary, C.primaryContainer]} style={s.fabGradient}>
          <MaterialIcons name="add" size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Add Goal Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{t("goals_create_new" as any)}</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}><MaterialIcons name="close" size={24} color={C.onSurface} /></TouchableOpacity>
            </View>
            <Text style={s.inputLabel}>{t("goals_goal_name" as any)}</Text>
            <TextInput style={s.input} placeholder={t("goals_goal_name_placeholder" as any)} placeholderTextColor={C.outline} value={newTitle} onChangeText={setNewTitle} />
            <Text style={s.inputLabel}>{t("goals_target_amount" as any)}</Text>
            <TextInput style={s.input} placeholder={t("goals_target_placeholder" as any)} placeholderTextColor={C.outline} value={newTarget} onChangeText={setNewTarget} keyboardType="numeric" />
            <Text style={s.inputLabel}>{t("goals_icon" as any)}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: "row", gap: 10 }}>
                {ICONS.map((ic) => (
                  <TouchableOpacity key={ic.id} style={[s.iconOption, newIcon === ic.id && s.iconOptionActive]} onPress={() => setNewIcon(ic.id)}>
                    <MaterialIcons name={ic.icon as any} size={22} color={newIcon === ic.id ? C.primary : C.outline} />
                    <Text style={[s.iconOptionLabel, newIcon === ic.id && { color: C.primary, fontWeight: "700" }]}>{ic.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <TouchableOpacity style={s.modalBtn} activeOpacity={0.8} onPress={handleCreateGoal} disabled={isSaving}>
              <LinearGradient colors={[C.primary, C.primaryContainer]} style={s.modalBtnGradient}>
                {isSaving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.modalBtnText}>{t("goals_create_btn" as any)}</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Savings Modal */}
      <Modal visible={showSavingsModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{t("goals_add_savings_title" as any)}</Text>
              <TouchableOpacity onPress={() => { setShowSavingsModal(false); setSavingsAmount(""); }}><MaterialIcons name="close" size={24} color={C.onSurface} /></TouchableOpacity>
            </View>
            {selectedGoal && (
              <View style={s.savingsGoalInfo}>
                <MaterialIcons name={(selectedGoal.icon || "savings") as any} size={20} color={C.primary} />
                <Text style={s.savingsGoalName}>{selectedGoal.title}</Text>
              </View>
            )}
            <Text style={s.inputLabel}>{t("goals_amount_label" as any)}</Text>
            <TextInput style={s.input} placeholder={t("goals_amount_placeholder" as any)} placeholderTextColor={C.outline} value={savingsAmount} onChangeText={setSavingsAmount} keyboardType="numeric" />
            <TouchableOpacity style={s.modalBtn} activeOpacity={0.8} onPress={handleAddSavings} disabled={isSaving}>
              <LinearGradient colors={[C.primary, C.primaryContainer]} style={s.modalBtnGradient}>
                {isSaving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.modalBtnText}>{t("goals_add_btn" as any)}</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  headerTitle: { fontSize: 26, fontWeight: "800", color: C.onSurface, letterSpacing: -0.5 },
  headerSub: { fontSize: 14, fontWeight: "500", color: C.onSurfaceVariant, marginTop: 2 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 120 },

  // Summary
  summaryCard: { borderRadius: 24, padding: 22, marginBottom: 24 },
  summaryTop: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  summaryIconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.9)", justifyContent: "center", alignItems: "center", marginRight: 10 },
  summaryLabel: { fontSize: 11, fontWeight: "800", color: "rgba(255,255,255,0.8)", letterSpacing: 1.5 },
  summaryTotal: { fontSize: 28, fontWeight: "800", color: "#fff", marginBottom: 4 },
  summarySubTotal: { fontSize: 14, color: "rgba(255,255,255,0.7)", marginBottom: 16 },
  summaryBar: { height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.25)", marginBottom: 16 },
  summaryBarFill: { height: 6, borderRadius: 3, backgroundColor: "#fff" },
  summaryStats: { flexDirection: "row", justifyContent: "space-around", alignItems: "center" },
  statItem: { alignItems: "center" },
  statNum: { fontSize: 20, fontWeight: "800", color: "#fff" },
  statLabel: { fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: "rgba(255,255,255,0.2)" },

  // Empty
  emptyState: { alignItems: "center", paddingTop: 60, paddingBottom: 40 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: C.primaryFixed, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: C.onSurface, marginBottom: 8 },
  emptyText: { fontSize: 14, color: C.outline, textAlign: "center", paddingHorizontal: 40 },

  // Goals
  sectionTitle: { fontSize: 18, fontWeight: "800", color: C.onSurface, marginBottom: 12 },
  goalCard: { backgroundColor: C.surface, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: C.surfaceContainerHigh },
  goalTop: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  goalIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.surfaceContainerLow, alignItems: "center", justifyContent: "center" },
  goalTitle: { fontSize: 16, fontWeight: "700", color: C.onSurface },
  goalSub: { fontSize: 13, color: C.onSurfaceVariant, marginTop: 2 },
  progressBarBg: { height: 8, borderRadius: 4, backgroundColor: C.surfaceContainerHigh, marginBottom: 12 },
  progressBarFill: { height: 8, borderRadius: 4 },
  goalBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  goalPct: { fontSize: 13, fontWeight: "700", color: C.primary },
  addSavingsBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: C.primaryFixed, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  addSavingsText: { fontSize: 13, fontWeight: "700", color: C.primary },

  // FAB
  fab: { position: "absolute", bottom: Platform.OS === "ios" ? 105 : 85, right: 20, zIndex: 50, borderRadius: 30, shadowColor: C.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 12 },
  fabGradient: { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center" },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: C.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: Platform.OS === "ios" ? 40 : 24 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: "800", color: C.onSurface },
  inputLabel: { fontSize: 12, fontWeight: "700", color: C.onSurfaceVariant, marginBottom: 6, letterSpacing: 0.5 },
  input: { backgroundColor: C.surfaceContainerLow, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: C.onSurface, marginBottom: 16, borderWidth: 1, borderColor: C.surfaceContainerHigh },
  iconOption: { alignItems: "center", gap: 4, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 14, backgroundColor: C.surfaceContainerLow, borderWidth: 1, borderColor: C.surfaceContainerHigh },
  iconOptionActive: { backgroundColor: "#e8f5e9", borderColor: C.primary },
  iconOptionLabel: { fontSize: 10, color: C.outline, fontWeight: "600" },
  modalBtn: { marginTop: 4 },
  modalBtnGradient: { paddingVertical: 16, borderRadius: 16, alignItems: "center" },
  modalBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  savingsGoalInfo: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: C.surfaceContainerLow, padding: 14, borderRadius: 14, marginBottom: 16 },
  savingsGoalName: { fontSize: 15, fontWeight: "700", color: C.onSurface },
});
