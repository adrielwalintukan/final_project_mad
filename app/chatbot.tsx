import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../context/AuthContext";
import { useDashboardData } from "../hooks/useDashboardData";
import { sendMessageToChatbot, AVAILABLE_MODELS } from "../services/chatbotService";

const C = {
  primary: "#0d631b",
  onPrimary: "#ffffff",
  primaryContainer: "#2e7d32",
  primaryFixed: "#a3f69c",
  background: "#f8f9fa",
  surface: "#ffffff",
  onSurface: "#191c1d",
  onSurfaceVariant: "#40493d",
  outline: "#707a6c",
  outlineVariant: "#bfcaba",
  surfaceContainerLow: "#f3f4f5",
  surfaceContainerHigh: "#e7e8e9",
  error: "#ba1a1a",
};

interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: number;
}

export default function ChatbotScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { balance, totalIncome, totalExpense, transactions, goals } = useDashboardData();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "model",
      content: "Halo! Saya Atelier Finance AI, penasihat keuangan pribadi Anda. Ada yang bisa saya bantu terkait perencanaan keuangan atau analisis pengeluaran Anda hari ini?",
      timestamp: Date.now(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0]);
  const [showModelPicker, setShowModelPicker] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

  const financialContext = {
    balance: balance || 0,
    totalIncome: totalIncome || 0,
    totalExpense: totalExpense || 0,
    goalsCount: goals?.length || 0,
    recentTransactionsSummary:
      transactions && transactions.length > 0
        ? transactions
            .slice(0, 10)
            .map((tx: any) => `${tx.category}: Rp ${tx.amount} (${tx.type})`)
            .join(", ")
        : "Belum ada transaksi",
  };

  const handleSend = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: trimmed,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);

    try {
      const apiMessages = [...messages, userMsg]
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await sendMessageToChatbot(
        apiMessages,
        financialContext,
        selectedModel.modelName
      );

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "model",
        content: response,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      const errMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "model",
        content: "Maaf, terjadi gangguan koneksi. Mohon coba beberapa saat lagi.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
  }, [messages, isLoading]);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const h = d.getHours().toString().padStart(2, "0");
    const m = d.getMinutes().toString().padStart(2, "0");
    return `${h}:${m}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        {/* ━━━ HEADER ━━━ */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={C.onSurface} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{"Atelier Finance AI"}</Text>
            <View style={styles.statusRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.statusLabel}>{"Online"}</Text>
            </View>
          </View>
          <View style={styles.headerRight} />
        </View>

        {/* ━━━ MODEL SELECTOR ━━━ */}
        <TouchableOpacity
          style={styles.modelSelector}
          activeOpacity={0.7}
          onPress={() => setShowModelPicker(true)}
        >
          <MaterialIcons name="auto-awesome" size={14} color={C.primary} />
          <Text style={styles.modelSelectorText}>{selectedModel.label}</Text>
          <MaterialIcons name="keyboard-arrow-down" size={18} color={C.outline} />
        </TouchableOpacity>

        {/* ━━━ CHAT MESSAGES ━━━ */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.flex}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <View
                key={msg.id}
                style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowModel]}
              >
                {!isUser && (
                  <View style={styles.aiAvatar}>
                    <MaterialIcons name="smart-toy" size={14} color={C.primary} />
                  </View>
                )}
                <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleModel]}>
                  <Text style={[styles.bubbleText, isUser ? styles.textUser : styles.textModel]}>
                    {msg.content}
                  </Text>
                  <Text style={[styles.timeText, isUser ? styles.timeUser : styles.timeModel]}>
                    {formatTime(msg.timestamp)}
                  </Text>
                </View>
              </View>
            );
          })}
          {isLoading && (
            <View style={[styles.msgRow, styles.msgRowModel]}>
              <View style={styles.aiAvatar}>
                <MaterialIcons name="smart-toy" size={14} color={C.primary} />
              </View>
              <View style={[styles.bubble, styles.bubbleModel, styles.loadingBubble]}>
                <View style={styles.typingDots}>
                  <View style={[styles.dot, styles.dot1]} />
                  <View style={[styles.dot, styles.dot2]} />
                  <View style={[styles.dot, styles.dot3]} />
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* ━━━ INPUT BAR ━━━ */}
        <View style={styles.inputBar}>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder="Tanyakan sesuatu..."
              placeholderTextColor={C.outline}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={!inputText.trim() || isLoading}
              activeOpacity={0.7}
              style={styles.sendBtn}
            >
              <LinearGradient
                colors={
                  !inputText.trim() || isLoading
                    ? [C.outlineVariant, C.outlineVariant]
                    : [C.primary, C.primaryContainer]
                }
                style={styles.sendGradient}
              >
                <MaterialIcons name="send" size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* ━━━ MODEL PICKER MODAL ━━━ */}
      <Modal visible={showModelPicker} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowModelPicker(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{"Pilih Model AI"}</Text>
            {AVAILABLE_MODELS.map((model) => {
              const isActive = model.id === selectedModel.id;
              return (
                <TouchableOpacity
                  key={model.id}
                  style={[styles.modelOption, isActive && styles.modelOptionActive]}
                  onPress={() => {
                    setSelectedModel(model);
                    setShowModelPicker(false);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.modelOptionLeft}>
                    <MaterialIcons
                      name="auto-awesome"
                      size={18}
                      color={isActive ? C.primary : C.outline}
                    />
                    <Text
                      style={[styles.modelOptionText, isActive && styles.modelOptionTextActive]}
                    >
                      {model.label}
                    </Text>
                  </View>
                  {isActive && (
                    <MaterialIcons name="check-circle" size={20} color={C.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.background,
  },
  flex: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.surfaceContainerHigh,
  },
  backBtn: {
    width: 40,
    alignItems: "flex-start",
  },
  headerCenter: {
    alignItems: "center",
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: C.onSurface,
    letterSpacing: -0.3,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4caf50",
    marginRight: 4,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: C.outline,
    letterSpacing: 0.5,
  },
  headerRight: {
    width: 40,
  },

  // Model Selector
  modelSelector: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.surfaceContainerHigh,
    marginVertical: 8,
    gap: 6,
  },
  modelSelectorText: {
    fontSize: 12,
    fontWeight: "700",
    color: C.onSurfaceVariant,
  },

  // Chat
  chatContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  msgRow: {
    flexDirection: "row",
    marginBottom: 16,
    maxWidth: "85%",
  },
  msgRowUser: {
    alignSelf: "flex-end",
  },
  msgRowModel: {
    alignSelf: "flex-start",
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: C.primaryFixed,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    marginTop: 4,
  },
  bubble: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexShrink: 1,
  },
  bubbleUser: {
    backgroundColor: C.primary,
    borderTopRightRadius: 4,
  },
  bubbleModel: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  loadingBubble: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 22,
  },
  textUser: {
    color: "#fff",
  },
  textModel: {
    color: C.onSurface,
  },
  timeText: {
    fontSize: 10,
    marginTop: 6,
    alignSelf: "flex-end",
  },
  timeUser: {
    color: "rgba(255,255,255,0.6)",
  },
  timeModel: {
    color: C.outline,
  },
  typingDots: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.outlineVariant,
  },
  dot1: {
    opacity: 0.4,
  },
  dot2: {
    opacity: 0.6,
  },
  dot3: {
    opacity: 0.9,
  },

  // Input
  inputBar: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: C.surfaceContainerHigh,
    backgroundColor: C.background,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: C.surface,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: C.outlineVariant,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    fontSize: 15,
    color: C.onSurface,
    paddingTop: 8,
    paddingBottom: 8,
  },
  sendBtn: {
    marginLeft: 10,
    marginBottom: 4,
  },
  sendGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: C.surface,
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 20,
    width: "85%",
    maxWidth: 360,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: C.onSurface,
    marginBottom: 16,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  modelOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginBottom: 6,
    backgroundColor: C.background,
  },
  modelOptionActive: {
    backgroundColor: "#e8f5e9",
    borderWidth: 1,
    borderColor: C.primary,
  },
  modelOptionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  modelOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: C.onSurfaceVariant,
  },
  modelOptionTextActive: {
    fontWeight: "800",
    color: C.primary,
  },
});
