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
  Animated,
  PanResponder
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { Id } from "../convex/_generated/dataModel";

const { width } = Dimensions.get("window");

const C = {
  background: "#f8f9fa",
  surface: "#f8f9fa",
  surfaceContainerLow: "#f3f4f5",
  surfaceContainer: "#edeeef",
  surfaceContainerHigh: "#e7e8e9",
  surfaceContainerHighest: "#e1e3e4",
  surfaceContainerLowest: "#ffffff",
  onSurface: "#191c1d",
  onSurfaceVariant: "#40493d",
  outline: "#707a6c",
  outlineVariant: "#bfcaba",
  primary: "#0d631b",
  primaryContainer: "#2e7d32",
  onPrimary: "#ffffff",
  primaryFixed: "#a3f69c",
  primaryFixedDim: "#88d982",
  onPrimaryFixedVariant: "#005312",
  onPrimaryContainer: "#cbffc2",
  secondary: "#4c56af",
  tertiary: "#923357",
  tertiaryFixed: "#ffd9e2",
  onTertiaryFixed: "#3f001c",
  error: "#ba1a1a",
  errorContainer: "#ffdad6",
};

const EXPENSE_CATEGORIES = [
  { id: "food", label: "Food", icon: "restaurant", colorBg: C.surfaceContainerLowest },
  { id: "transport", label: "Transport", icon: "directions-car", colorBg: C.surfaceContainerLowest },
  { id: "shopping", label: "Shopping", icon: "shopping-bag", colorBg: C.surfaceContainerLowest },
  { id: "rent", label: "Rent", icon: "home", colorBg: C.surfaceContainerLowest },
  { id: "fun", label: "Fun", icon: "movie", colorBg: C.surfaceContainerLowest },
  { id: "health", label: "Health", icon: "medical-services", colorBg: C.surfaceContainerLowest },
  { id: "bills", label: "Bills", icon: "receipt", colorBg: C.surfaceContainerLowest },
];

const INCOME_CATEGORIES = [
  { id: "salary", label: "Salary", icon: "account-balance-wallet", colorBg: C.surfaceContainerLowest },
  { id: "bonus", label: "Bonus", icon: "card-giftcard", colorBg: C.surfaceContainerLowest },
  { id: "freelance", label: "Freelance", icon: "work", colorBg: C.surfaceContainerLowest },
  { id: "investment", label: "Investment", icon: "trending-up", colorBg: C.surfaceContainerLowest },
  { id: "business", label: "Business", icon: "business-center", colorBg: C.surfaceContainerLowest },
  { id: "gift", label: "Gift", icon: "redeem", colorBg: C.surfaceContainerLowest },
  { id: "other_income", label: "Other", icon: "add-circle-outline", colorBg: C.surfaceContainerLowest },
];

export default function AddTransactionScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
  const userId = user?._id as Id<"users">;
  
  const addTransaction = useMutation(api.transactions.addTransaction);

  const [txType, setTxType] = useState<"expense" | "income">("expense");
  const [amountStr, setAmountStr] = useState("0");
  const [category, setCategory] = useState("Food");
  const [note, setNote] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showNumpad, setShowNumpad] = useState(true);

  // Dynamic Categories
  const currentCategories = txType === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  React.useEffect(() => {
    // Reset selected category when switching type
    setCategory(txType === "expense" ? "Food" : "Salary");
  }, [txType]);

  // Animations & Gestures
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(30)).current;
  const numpadTranslateY = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    // Screen mount animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  React.useEffect(() => {
    // Toggle Numpad animation
    if (showNumpad) {
      Animated.spring(numpadTranslateY, {
        toValue: 0,
        friction: 9,
        tension: 60,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(numpadTranslateY, {
        toValue: 400, // offscreen distance
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [showNumpad]);

  const numpadPanResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true, // Capture taps on handle
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          numpadTranslateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 50 || gestureState.vy > 1.2) {
          setShowNumpad(false);
        } else {
          Animated.spring(numpadTranslateY, {
            toValue: 0,
            friction: 9,
            tension: 60,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Keypad actions
  const handleKeyPad = (val: string) => {
    if (val === "BACKSPACE") {
      setAmountStr(prev => prev.length > 1 ? prev.slice(0, -1) : "0");
      return;
    }
    
    if (val === ".") {
      if (amountStr.includes(".")) return;
      setAmountStr(prev => prev + ".");
      return;
    }

    if (val === "00") {
      if (amountStr === "0") return;
      setAmountStr(prev => prev + "00");
      return;
    }

    setAmountStr(prev => {
      if (prev === "0") return val;
      return prev + val;
    });
  };

  const handleSave = async () => {
    if (!userId) {
      alert("System Error: No active user session found. Please log in again.");
      return;
    }
    if (isSaving) return;
    
    const amountVal = parseFloat(amountStr);
    if (isNaN(amountVal) || amountVal <= 0) {
      alert(t("alert_valid_amount"));
      return;
    }

    setIsSaving(true);
    try {
      await addTransaction({
        userId,
        type: txType,
        amount: amountVal,
        category: category,
        note: note.trim() !== "" ? note : undefined,
      });
      router.back();
    } catch (e) {
      alert(t("alert_save_failed"));
      console.error(e);
      setIsSaving(false);
    }
  };

  const numpadKeys = [
    ["1", "2", "3", "BACKSPACE"],
    ["4", "5", "6", "+"],
    ["7", "8", "9", "-"],
    [".", "0", "00", "SAVE"]
  ];

  const todayStr = "Today, " + new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.closeBtn} 
            onPress={() => router.back()}
          >
            <MaterialIcons name="close" size={24} color={C.onSurface} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t("add_transaction")}</Text>
        </View>
        <TouchableOpacity activeOpacity={0.8} onPress={handleSave} disabled={isSaving}>
          <LinearGradient
            colors={[C.primary, C.primaryContainer]}
            style={styles.saveBtn}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>{t("save")}</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{flex: 1}}>
        <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          
          {/* Static Top Section (Does not scroll) */}
          <View style={styles.staticTopSection}>
            {/* Minimal Date Row */}
            <View style={styles.dateRowTop}>
               <MaterialIcons name="calendar-today" size={14} color={C.primary} />
               <Text style={styles.dateRowText}>{todayStr}</Text>
            </View>

            {/* Toggle Type */}
            <View style={styles.toggleContainer}>
              <View style={styles.toggleRow}>
                <TouchableOpacity 
                  activeOpacity={0.8}
                  style={[styles.toggleBtn, txType === "expense" && styles.toggleBtnActive]}
                  onPress={() => setTxType("expense")}
                >
                  <Text style={[styles.toggleBtnText, txType === "expense" && styles.toggleBtnTextActive]}>
                    {t("expense")}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  activeOpacity={0.8}
                  style={[styles.toggleBtn, txType === "income" && styles.toggleBtnActive]}
                  onPress={() => setTxType("income")}
                >
                  <Text style={[styles.toggleBtnText, txType === "income" && styles.toggleBtnTextActive]}>
                    {t("income")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Amount Display */}
            <TouchableOpacity style={styles.amountSection} activeOpacity={0.7} onPress={() => setShowNumpad(true)}>
              <Text style={styles.amountLabel}>{t("amount_idr")}</Text>
              <View style={styles.amountDisplay}>
                <Text style={styles.amountSymbol}>Rp</Text>
                <Text 
                  style={[styles.amountValue, amountStr === "0" && styles.amountValuePlaceholder]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                >
                  {parseFloat(amountStr).toLocaleString()}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Scrollable Section */}
          <ScrollView 
            style={{ flex: 1 }} 
            contentContainerStyle={[styles.contentWrap, { paddingBottom: 380 }]}
            showsVerticalScrollIndicator={false}
          >
            {/* Note Input */}
            <View style={styles.noteTopWrap}>
              <MaterialIcons name="edit-note" size={20} color={C.primary} />
              <TextInput 
                style={styles.noteInputMinimal} 
                placeholder={t("add_description")} 
                placeholderTextColor={C.outlineVariant}
                value={note} 
                onChangeText={setNote} 
              />
            </View>

            {/* Category Selector */}
          <View style={styles.categorySection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t("category")}</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>{t("view_all")}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.categoryGrid}>
              {currentCategories.map((cat, idx) => {
                const isActive = category === cat.label;
                return (
                  <TouchableOpacity 
                    key={idx} 
                    style={[styles.catItem, isActive && styles.catItemActive]}
                    onPress={() => setCategory(cat.label)}
                    activeOpacity={0.7}
                  >
                    <View style={[
                      styles.catIconWrap, 
                      isActive && styles.catIconWrapActive
                    ]}>
                      <MaterialIcons 
                        name={cat.icon as any} 
                        size={20}  
                        color={isActive ? C.onPrimaryContainer : C.onSurfaceVariant} 
                      />
                    </View>
                    <Text 
                      style={[styles.catLabel, isActive && styles.catLabelActive]}
                      numberOfLines={1}
                      adjustsFontSizeToFit={true}
                    >
                      {t(cat.id as any)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
              {/* Add Button */}
              <TouchableOpacity style={styles.catItem} activeOpacity={0.7}>
                <View style={styles.catAddBtn}>
                  <MaterialIcons name="add" size={20} color={C.outline} />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* AI Insight Chip */}
          <View style={styles.aiInsightChip}>
            <View style={styles.aiIconWrap}>
              <MaterialIcons name="smart-toy" size={18} color={C.tertiaryFixed} />
            </View>
            <Text style={styles.aiInsightText}>
              {t("insight_spent_more")}
            </Text>
          </View>

          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>

      {/* Numpad Footer (Animated Overlay) */}
      <Animated.View 
        style={[styles.numpadContainer, { transform: [{ translateY: numpadTranslateY }] }]}
        pointerEvents={showNumpad ? 'auto' : 'none'}
      >
        <View style={styles.numpadCloseWrap} {...numpadPanResponder.panHandlers}>
          <View style={styles.numpadHandle} />
        </View>
        <View style={styles.numpadGrid}>
          {numpadKeys.flat().map((key, index) => {
            if (key === "BACKSPACE") {
              return (
                <TouchableOpacity 
                  key={index} 
                  style={[styles.numpadBtn, styles.numpadBtnSpecial]} 
                  onPress={() => handleKeyPad(key)}
                >
                  <MaterialIcons name="backspace" size={20} color={C.onSurfaceVariant} />
                </TouchableOpacity>
              );
            }
            if (key === "SAVE") {
              return (
                <TouchableOpacity 
                  key={index} 
                  style={[styles.numpadBtn, styles.numpadBtnSave]} 
                  onPress={handleSave}
                >
                  <MaterialIcons name="check-circle" size={24} color={C.onPrimary} />
                </TouchableOpacity>
              );
            }
            if (key === "+" || key === "-") {
              return (
                <TouchableOpacity 
                  key={index} 
                  style={[styles.numpadBtn, styles.numpadBtnSpecial]} 
                >
                  <Text style={styles.numpadSpecialText}>{key}</Text>
                </TouchableOpacity>
              );
            }

            return (
              <TouchableOpacity 
                key={index} 
                style={styles.numpadBtn} 
                onPress={() => handleKeyPad(key)}
              >
                <Text style={styles.numpadBtnText}>{key}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "rgba(248, 249, 250, 0.8)", // blur effect would need expo-blur, using color
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  closeBtn: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: C.onSurface,
  },
  saveBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: {
    color: C.onPrimary,
    fontWeight: "700",
    fontSize: 14,
  },
  staticTopSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 0,
  },
  contentWrap: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  toggleContainer: {
    marginBottom: 12,
  },
  toggleRow: {
    flexDirection: "row",
    backgroundColor: C.surfaceContainerLow,
    borderRadius: 12,
    padding: 2,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  toggleBtnActive: {
    backgroundColor: C.surfaceContainerLowest,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: C.onSurfaceVariant,
  },
  toggleBtnTextActive: {
    color: C.primary,
  },
  amountSection: {
    alignItems: "center",
    marginBottom: 8,
  },
  amountLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: C.onSurfaceVariant,
    letterSpacing: 2,
    marginBottom: 8,
  },
  amountDisplay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  amountSymbol: {
    fontSize: 24,
    fontWeight: "800",
    color: C.onSurfaceVariant,
    opacity: 0.5,
  },
  amountValue: {
    fontSize: 42,
    fontWeight: "800",
    color: C.onSurface,
    maxWidth: width - 100, // limit width so dynamic text resizing works
  },
  amountValuePlaceholder: {
    color: C.surfaceContainerHighest,
  },
  categorySection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: C.onSurface,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: "600",
    color: C.primary,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 16,
  },
  catItem: {
    width: "22%",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: C.surfaceContainerLowest,
  },
  catItemActive: {
    backgroundColor: C.primaryFixed,
  },
  catIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.surfaceContainerHigh,
    alignItems: "center",
    justifyContent: "center",
  },
  catIconWrapActive: {
    backgroundColor: C.primaryContainer,
  },
  catLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: C.onSurfaceVariant,
    textAlign: "center",
  },
  catLabelActive: {
    color: C.onPrimaryFixedVariant,
    fontWeight: "800",
  },
  catAddBtn: {
    width: "100%",
    height: 56,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: C.outlineVariant,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  dateRowTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 12,
  },
  dateRowText: {
    fontSize: 12,
    fontWeight: "700",
    color: C.onSurfaceVariant,
  },
  noteTopWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.surfaceContainerLow,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    gap: 12,
  },
  noteInputMinimal: {
    flex: 1,
    fontSize: 13,
    color: C.onSurface,
    padding: 0,
    height: 20,
  },
  aiInsightChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: C.tertiaryFixed,
    padding: 16,
    borderRadius: 16,
    marginBottom: 32,
  },
  aiIconWrap: {
    backgroundColor: C.onTertiaryFixed,
    padding: 8,
    borderRadius: 20,
  },
  aiInsightText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
    color: C.onTertiaryFixed,
    lineHeight: 18,
  },
  numpadContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 24 : 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 40,
    elevation: 20,
  },
  numpadCloseWrap: {
    paddingTop: 8,
    paddingBottom: 12,
    alignItems: "center",
    width: "100%", // to increase un-tappable but draggable area
  },
  numpadHandle: {
    width: 48,
    height: 4,
    backgroundColor: C.surfaceContainerHighest,
    borderRadius: 2,
  },
  numpadGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 6,
  },
  numpadBtn: {
    width: "23%",
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
  },
  numpadBtnText: {
    fontSize: 20,
    fontWeight: "600",
    color: C.onSurface,
  },
  numpadBtnSpecial: {
    backgroundColor: C.surfaceContainerHigh,
  },
  numpadSpecialText: {
    fontSize: 20,
    fontWeight: "800",
    color: C.onSurfaceVariant,
  },
  numpadBtnSave: {
    backgroundColor: C.primary,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
});
