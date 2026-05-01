import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput,
  Platform,
  Dimensions,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { Id } from "../convex/_generated/dataModel";

const { width } = Dimensions.get("window");

const C = {
  background: "#f8f9fa",
  surface: "#ffffff",
  surfaceContainerLow: "#f3f4f5",
  onSurface: "#191c1d",
  onSurfaceVariant: "#40493d",
  outline: "#707a6c",
  outlineVariant: "#bfcaba",
  primary: "#0d631b",
  primaryContainer: "#2e7d32",
  onPrimary: "#ffffff",
  primaryFixed: "#a3f69c",
  tertiary: "#923357",
  error: "#ba1a1a",
};

const BUDGET_CATEGORIES = [
  { id: "food", label: "Food", icon: "restaurant" },
  { id: "transport", label: "Transport", icon: "directions-car" },
  { id: "shopping", label: "Shopping", icon: "shopping-bag" },
  { id: "entertainment", label: "Fun", icon: "movie" },
  { id: "bills", label: "Bills", icon: "receipt" },
  { id: "health", label: "Health", icon: "medical-services" },
  { id: "other", label: "Other", icon: "more-horiz" },
];

export default function CreateBudgetScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const userId = user?._id as Id<"users">;
  
  const createBudget = useMutation(api.budgets.createBudget);

  const [amount, setAmount] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("food");
  const [customCategory, setCustomCategory] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!userId) {
      Alert.alert(t("error"), "User not found. Please log in again.");
      return;
    }

    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      Alert.alert(t("error"), t("budget_error_amount"));
      return;
    }

    let categoryToSave = selectedCategory;
    if (selectedCategory === "other") {
      if (!customCategory.trim()) {
        Alert.alert(t("error"), t("other_label") + " is required");
        return;
      }
      categoryToSave = customCategory.trim();
    }

    setIsSaving(true);
    try {
      const now = new Date();
      const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      
      await createBudget({
        userId,
        category: categoryToSave,
        monthlyLimit: val,
        month: months[now.getMonth()],
        year: now.getFullYear(),
      });

      Alert.alert(t("success"), t("budget_success"));
      router.back();
    } catch (err: any) {
      console.error(err);
      Alert.alert(t("error"), err.message || t("budget_error_create"));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color={C.onSurface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("budget_title")}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Amount Section */}
          <View style={styles.inputCard}>
            <Text style={styles.inputLabel}>{t("budget_amount")}</Text>
            <View style={styles.amountInputRow}>
              <Text style={styles.currency}>Rp</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                placeholder="0"
                keyboardType="numeric"
                placeholderTextColor={C.outlineVariant}
                autoFocus
              />
            </View>
          </View>

          {/* Category Section */}
          <Text style={styles.sectionLabel}>{t("budget_category")}</Text>
          <View style={styles.categoryGrid}>
            {BUDGET_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryItem,
                  selectedCategory === cat.id && styles.categoryItemActive
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <View style={[
                  styles.categoryIconWrap,
                  selectedCategory === cat.id && { backgroundColor: C.primary }
                ]}>
                  <MaterialIcons 
                    name={cat.icon as any} 
                    size={24} 
                    color={selectedCategory === cat.id ? C.onPrimary : C.primary} 
                  />
                </View>
                <Text style={[
                  styles.categoryLabel,
                  selectedCategory === cat.id && styles.categoryLabelActive
                ]}>
                  {t(cat.id as any) || cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom Category Input (Visible only when "other" is selected) */}
          {selectedCategory === "other" && (
            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>{t("other_label")}</Text>
              <TextInput
                style={styles.customInput}
                value={customCategory}
                onChangeText={setCustomCategory}
                placeholder={t("other_placeholder")}
                placeholderTextColor={C.outlineVariant}
              />
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.saveBtn, isSaving && { opacity: 0.7 }]} 
            onPress={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
               <ActivityIndicator color="#fff" />
            ) : (
               <Text style={styles.saveBtnText}>{t("budget_create_btn")}</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
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
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: C.onSurface,
  },
  scrollContent: {
    padding: 20,
  },
  inputCard: {
    backgroundColor: C.surface,
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: C.primary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
  },
  amountInputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  currency: {
    fontSize: 24,
    fontWeight: "700",
    color: C.onSurface,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: "800",
    color: C.onSurface,
  },
  customInput: {
    fontSize: 18,
    fontWeight: "600",
    color: C.onSurface,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.outlineVariant,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: C.onSurfaceVariant,
    marginBottom: 16,
    marginLeft: 4,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  categoryItem: {
    width: (width - 60) / 3,
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "transparent",
  },
  categoryItemActive: {
    borderColor: C.primary,
    backgroundColor: "#e8f5e9",
  },
  categoryIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f1f8f1",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: C.onSurfaceVariant,
  },
  categoryLabelActive: {
    color: C.primary,
    fontWeight: "700",
  },
  footer: {
    padding: 20,
    backgroundColor: C.background,
  },
  saveBtn: {
    backgroundColor: C.primary,
    height: 56,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#ffffff",
  },
});
