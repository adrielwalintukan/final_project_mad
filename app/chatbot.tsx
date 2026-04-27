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
  Clipboard,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
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

  const [currentConversationId, setCurrentConversationId] = useState<Id<"chatbot_conversations"> | null>(null);
  
  const conversations = useQuery(api.chatbot.listConversations, user?._id ? { userId: user._id } : "skip");
  const convexMessages = useQuery(api.chatbot.getMessages, currentConversationId ? { conversationId: currentConversationId } : "skip");
  
  const startConversation = useMutation(api.chatbot.startConversation);
  const saveMessage = useMutation(api.chatbot.saveMessage);
  const deleteConversation = useMutation(api.chatbot.deleteConversation);

  const [localMessages, setLocalMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0]);
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (currentConversationId && convexMessages) {
      const formatted = convexMessages.map((m) => ({
        id: m._id,
        role: m.role as "user" | "model",
        content: m.content,
        timestamp: m.createdAt,
      }));
      setLocalMessages(formatted);
    } else if (!currentConversationId) {
      setLocalMessages([
        {
          id: "welcome",
          role: "model",
          content: "Halo! Saya Atelier Finance AI, penasihat keuangan pribadi Anda. Ada yang bisa saya bantu terkait perencanaan keuangan atau analisis pengeluaran Anda hari ini?",
          timestamp: Date.now(),
        },
      ]);
    }
  }, [convexMessages, currentConversationId]);

  const financialContext = {
    balance: balance || 0,
    totalIncome: totalIncome || 0,
    totalExpense: totalExpense || 0,
    goalsCount: goals?.length || 0,
    recentTransactionsSummary:
      transactions && transactions.length > 0
        ? transactions
            .slice(0, 10)
            .map((tx: any) => tx.category + ": Rp " + tx.amount + " (" + tx.type + ")")
            .join(", ")
        : "Belum ada transaksi",
  };

  const handleSend = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || isLoading || !user?._id) return;

    setIsLoading(true);
    let convId = currentConversationId;

    try {
      if (!convId) {
        convId = await startConversation({
          userId: user._id,
          title: trimmed.length > 40 ? trimmed.substring(0, 37) + "..." : trimmed,
          model: selectedModel.label,
        });
        setCurrentConversationId(convId);
      }

      const userMsg: ChatMessage = {
        id: "temp-" + Date.now(),
        role: "user",
        content: trimmed,
        timestamp: Date.now(),
      };
      setLocalMessages((prev) => [...prev, userMsg]);
      setInputText("");

      await saveMessage({
        userId: user._id,
        conversationId: convId,
        role: "user",
        content: trimmed,
      });

      const historyForAI = localMessages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({ role: m.role, content: m.content }));
      
      historyForAI.push({ role: "user", content: trimmed });

      const aiResponse = await sendMessageToChatbot(historyForAI, financialContext, selectedModel.modelName);

      await saveMessage({
        userId: user._id,
        conversationId: convId,
        role: "model",
        content: aiResponse,
      });

    } catch (error) {
      console.error("Chat Error:", error);
      Alert.alert("Error", "Gagal mengirim pesan. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    Clipboard.setString(text);
    Alert.alert("Berhasil", "Teks telah disalin.");
  };

  const startNewChat = () => {
    setCurrentConversationId(null);
    setLocalMessages([]);
    setShowHistory(false);
  };

  const selectConversation = (id: Id<"chatbot_conversations">) => {
    setCurrentConversationId(id);
    setShowHistory(false);
  };

  const handleDeleteConversation = (id: Id<"chatbot_conversations">) => {
    Alert.alert(
      "Hapus Percakapan",
      "Apakah Anda yakin ingin menghapus percakapan ini?",
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Hapus", 
          style: "destructive", 
          onPress: async () => {
            await deleteConversation({ conversationId: id });
            if (currentConversationId === id) {
              startNewChat();
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
  }, [localMessages, isLoading]);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    const h = d.getHours().toString().padStart(2, "0");
    const m = d.getMinutes().toString().padStart(2, "0");
    return h + ":" + m;
  };

  const RenderMessage = ({ content, isUser }: { content: string; isUser: boolean }) => {
    if (isUser) return <Text style={[styles.bubbleText, styles.textUser]}>{content}</Text>;

    return (
      <View>
        {content.split("\n").map((line, index, arr) => {
          if (line.trim() === "") {
            return <View key={index} style={{ height: 6 }} />;
          }
          if (line.trim().startsWith("🟢")) {
            return (
              <View key={index} style={styles.highlightRow}>
                <View style={styles.highlightBadge}>
                  <MaterialIcons name="check-circle" size={14} color="#fff" />
                </View>
                <Text style={[styles.bubbleText, styles.textModel, { flex: 1 }]}>{line.replace("🟢", "").trim()}</Text>
              </View>
            );
          }
          if (line.trim().startsWith("⚠️")) {
            return (
              <View key={index} style={styles.warningRow}>
                <MaterialIcons name="warning" size={16} color={C.error} />
                <Text style={[styles.bubbleText, { color: C.error, flex: 1, fontWeight: "600" }]}>{line.replace("⚠️", "").trim()}</Text>
              </View>
            );
          }
          return (
            <Text key={index} style={[styles.bubbleText, styles.textModel, { marginBottom: index < arr.length - 1 ? 4 : 0 }]}>
              {line}
            </Text>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color={C.primary} />
            </TouchableOpacity>
            <View style={styles.avatarWrap}>
              <MaterialIcons name="auto-awesome" size={20} color="#fff" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Atelier Finance AI</Text>
              <View style={styles.statusRow}>
                <View style={styles.onlineDot} />
                <Text style={styles.statusLabel}>Online</Text>
              </View>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerAction} onPress={() => setShowHistory(true)}>
              <MaterialIcons name="history" size={24} color={C.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerAction} onPress={startNewChat}>
              <MaterialIcons name="add-comment" size={24} color={C.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView ref={scrollViewRef} style={styles.flex} contentContainerStyle={styles.chatContent}>
          {localMessages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <View key={msg.id} style={[styles.msgRow, isUser ? styles.msgRowUser : styles.msgRowModel]}>
                {!isUser && (
                  <View style={styles.aiAvatar}>
                    <MaterialIcons name="smart-toy" size={14} color={C.primary} />
                  </View>
                )}
                <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleModel]}>
                  <RenderMessage content={msg.content} isUser={isUser} />
                  <View style={styles.bubbleFooter}>
                    <Text style={[styles.timeText, isUser ? styles.timeUser : styles.timeModel]}>{formatTime(msg.timestamp)}</Text>
                    <View style={styles.actionRow}>
                      <TouchableOpacity onPress={() => handleCopy(msg.content)} style={styles.actionBtn}>
                        <MaterialIcons name="content-copy" size={16} color={isUser ? "rgba(255,255,255,0.7)" : C.outline} />
                      </TouchableOpacity>
                      {!isUser && (
                        <>
                          <TouchableOpacity style={styles.actionBtn}><MaterialIcons name="thumb-up-off-alt" size={16} color={C.outline} /></TouchableOpacity>
                          <TouchableOpacity style={styles.actionBtn}><MaterialIcons name="thumb-down-off-alt" size={16} color={C.outline} /></TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
          {isLoading && (
            <View style={[styles.msgRow, styles.msgRowModel]}>
              <View style={styles.aiAvatar}><MaterialIcons name="smart-toy" size={14} color={C.primary} /></View>
              <View style={[styles.bubble, styles.bubbleModel, styles.loadingBubble]}>
                <View style={styles.typingDots}><View style={[styles.dot, styles.dot1]} /><View style={[styles.dot, styles.dot2]} /><View style={[styles.dot, styles.dot3]} /></View>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputBar}>
          <View style={styles.inputWrap}>
            <TextInput style={styles.input} placeholder="Tanya Atelier Finance AI..." value={inputText} onChangeText={setInputText} multiline />
            <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={!inputText.trim() || isLoading}>
              <LinearGradient colors={[C.primary, C.primaryContainer]} style={styles.sendGradient}>
                {isLoading ? <ActivityIndicator size="small" color="#fff" /> : <Ionicons name="send" size={18} color="#fff" />}
              </LinearGradient>
            </TouchableOpacity>
          </View>
          <View style={styles.bottomModelPicker}>
            <TouchableOpacity style={styles.bottomModelDropdown} onPress={() => setShowModelPicker(true)}>
              <MaterialIcons name="auto-awesome" size={14} color={C.primary} />
              <Text style={styles.bottomModelDropdownText}>{selectedModel.label}</Text>
              <MaterialIcons name="keyboard-arrow-down" size={16} color={C.outline} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={showModelPicker} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowModelPicker(false)}>
          <View style={styles.modalContent}>
            <Text style={[styles.modalTitle, { marginBottom: 16 }]}>Pilih Model AI</Text>
            {AVAILABLE_MODELS.map((m) => (
              <TouchableOpacity key={m.id} style={[styles.modelOption, selectedModel.id === m.id && styles.modelOptionActive]} onPress={() => { setSelectedModel(m); setShowModelPicker(false); }}>
                <View style={styles.modelOptionLeft}><MaterialIcons name="auto-awesome" size={20} color={selectedModel.id === m.id ? C.primary : C.outline} /><Text style={[styles.modelOptionText, selectedModel.id === m.id && styles.modelOptionTextActive]}>{m.label}</Text></View>
                {selectedModel.id === m.id && <MaterialIcons name="check-circle" size={20} color={C.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showHistory} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.historyContent}>
            <View style={styles.historyHeader}><Text style={styles.modalTitle}>Riwayat Percakapan</Text><TouchableOpacity onPress={() => setShowHistory(false)}><MaterialIcons name="close" size={24} color={C.onSurface} /></TouchableOpacity></View>
            <ScrollView style={styles.historyList}>
              {conversations?.map((conv) => (
                <View key={conv._id} style={styles.historyItemRow}>
                  <TouchableOpacity style={[styles.historyItem, currentConversationId === conv._id && styles.historyItemActive]} onPress={() => selectConversation(conv._id)}>
                    <MaterialIcons name="chat-bubble-outline" size={20} color={C.primary} />
                    <View style={styles.historyItemInfo}><Text style={styles.historyItemTitle} numberOfLines={1}>{conv.title}</Text><Text style={styles.historyItemMeta}>{conv.model} • {new Date(conv.updatedAt).toLocaleDateString()}</Text></View>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteConversation(conv._id)} style={styles.deleteHistoryBtn}><MaterialIcons name="delete-outline" size={20} color={C.error} /></TouchableOpacity>
                </View>
              ))}
              {(!conversations || conversations.length === 0) && <Text style={styles.emptyHistoryText}>Belum ada riwayat percakapan.</Text>}
            </ScrollView>
            <TouchableOpacity style={styles.newChatBtnLarge} onPress={startNewChat}><MaterialIcons name="add" size={20} color="#fff" /><Text style={styles.newChatBtnText}>Mulai Chat Baru</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.surface },
  flex: { flex: 1, backgroundColor: C.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 12, backgroundColor: C.surface },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  backBtn: { padding: 4 },
  avatarWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.primary, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 17, fontWeight: "800", color: C.onSurface, letterSpacing: -0.3 },
  statusRow: { flexDirection: "row", alignItems: "center", marginTop: 1 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#4caf50", marginRight: 4 },
  statusLabel: { fontSize: 10, fontWeight: "700", color: "#4caf50", textTransform: "uppercase" },
  headerAction: { padding: 6 },
  bottomModelPicker: { flexDirection: "row", justifyContent: "flex-start", marginTop: 8, paddingHorizontal: 4 },
  bottomModelDropdown: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(13, 99, 27, 0.08)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, gap: 4 },
  bottomModelDropdownText: { fontSize: 12, fontWeight: "700", color: C.primary },
  chatContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },
  msgRow: { flexDirection: "row", marginBottom: 20, maxWidth: "85%" },
  msgRowUser: { alignSelf: "flex-end" },
  msgRowModel: { alignSelf: "flex-start" },
  aiAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.primaryFixed, justifyContent: "center", alignItems: "center", marginRight: 8, marginTop: 4 },
  bubble: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12, flexShrink: 1 },
  bubbleUser: { backgroundColor: C.primary, borderBottomRightRadius: 4 },
  bubbleModel: { backgroundColor: C.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: C.surfaceContainerHigh },
  bubbleFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8, paddingTop: 4, borderTopWidth: 0.5, borderTopColor: "rgba(0,0,0,0.05)" },
  actionRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  actionBtn: { padding: 4 },
  loadingBubble: { paddingVertical: 14, paddingHorizontal: 20 },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  textUser: { color: "#fff", fontWeight: "500" },
  textModel: { color: C.onSurface },
  timeText: { fontSize: 10, marginTop: 4, opacity: 0.7 },
  timeUser: { color: "#fff", textAlign: "right" },
  timeModel: { color: C.outline, textAlign: "left" },
  typingDots: { flexDirection: "row", alignItems: "center", gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.primary },
  dot1: { opacity: 0.3 }, dot2: { opacity: 0.6 }, dot3: { opacity: 0.9 },
  inputBar: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: Platform.OS === "ios" ? 24 : 12, backgroundColor: C.surface, borderTopWidth: 1, borderTopColor: C.surfaceContainerHigh },
  inputWrap: { flexDirection: "row", alignItems: "flex-end", backgroundColor: C.background, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 1, borderColor: "transparent" },
  input: { flex: 1, maxHeight: 120, fontSize: 15, color: C.onSurface, paddingTop: 8, paddingBottom: 8 },
  sendBtn: { marginLeft: 10, marginBottom: 2 },
  highlightRow: { flexDirection: "row", alignItems: "flex-start", backgroundColor: "#e8f5e9", padding: 10, borderRadius: 12, marginVertical: 6, gap: 8 },
  highlightBadge: { width: 20, height: 20, borderRadius: 10, backgroundColor: C.primary, justifyContent: "center", alignItems: "center", marginTop: 2 },
  warningRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff5f5", padding: 10, borderRadius: 12, marginVertical: 6, gap: 8, borderWidth: 1, borderColor: "#ffe0e0" },
  sendGradient: { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: C.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingTop: 24, paddingBottom: 40, paddingHorizontal: 24 },
  historyContent: { backgroundColor: C.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingTop: 24, paddingBottom: 40, height: "80%" },
  historyHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24, marginBottom: 20 },
  historyList: { flex: 1, paddingHorizontal: 16 },
  historyItemRow: { flexDirection: "row", alignItems: "center", marginBottom: 8, gap: 8 },
  historyItem: { flex: 1, flexDirection: "row", alignItems: "center", padding: 16, borderRadius: 16, backgroundColor: C.background, gap: 12, borderWidth: 1, borderColor: "transparent" },
  historyItemActive: { backgroundColor: "#e8f5e9", borderColor: C.primary },
  historyItemInfo: { flex: 1 },
  historyItemTitle: { fontSize: 15, fontWeight: "700", color: C.onSurface },
  historyItemMeta: { fontSize: 12, color: C.outline, marginTop: 2 },
  deleteHistoryBtn: { padding: 12 },
  emptyHistoryText: { textAlign: "center", marginTop: 40, color: C.outline, fontSize: 14 },
  newChatBtnLarge: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: C.primary, marginHorizontal: 24, marginTop: 16, paddingVertical: 14, borderRadius: 16, gap: 8 },
  newChatBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  modalTitle: { fontSize: 18, fontWeight: "800", color: C.onSurface, letterSpacing: -0.3 },
  modelOption: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 16, paddingHorizontal: 20, borderRadius: 16, marginBottom: 8, backgroundColor: C.background, borderWidth: 1, borderColor: "transparent" },
  modelOptionActive: { backgroundColor: "#e8f5e9", borderColor: C.primary },
  modelOptionLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  modelOptionText: { fontSize: 15, fontWeight: "600", color: C.onSurfaceVariant },
  modelOptionTextActive: { fontWeight: "800", color: C.primary },
});
