import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
};

const SUGGESTION_CHIPS = [
  {
    icon: 'wallet-outline' as const,
    label: 'How can I save more?',
    sub: 'Based on recent spending',
    color: '#0d631b',
  },
  {
    icon: 'stats-chart-outline' as const,
    label: 'Analyze last week',
    sub: 'Cashflow and trends',
    color: '#4c56af',
  },
  {
    icon: 'airplane-outline' as const,
    label: 'Plan for vacation',
    sub: 'Set a new goal budget',
    color: '#923357',
  },
];

export default function AiChatScreen() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const scrollRef = useRef<ScrollView>(null);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    // Scroll to bottom
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#0d631b" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.aiAvatar}>
            <Ionicons name="hardware-chip-outline" size={18} color="#005312" />
          </View>
          <Text style={styles.headerTitle}>AI Assistant</Text>
        </View>
        <TouchableOpacity style={styles.headerAction}>
          <Ionicons name="ellipsis-vertical" size={20} color="#40493d" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Welcome block — shown only when no messages */}
          {messages.length === 0 && (
            <View style={styles.welcomeBlock}>
              <Text style={styles.welcomeDate}>
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
              </Text>
              <Text style={styles.welcomeTitle}>Halo! 👋</Text>
              <Text style={styles.welcomeSub}>
                Lanskap keuangan Anda terus berkembang.{'\n'}Ada yang bisa saya bantu hari ini?
              </Text>

              {/* Suggestion chips */}
              <View style={styles.chips}>
                {SUGGESTION_CHIPS.map((chip) => (
                  <TouchableOpacity
                    key={chip.label}
                    style={styles.chip}
                    activeOpacity={0.75}
                    onPress={() => sendMessage(chip.label)}
                  >
                    <Ionicons name={chip.icon} size={22} color={chip.color} style={{ marginBottom: 8 }} />
                    <Text style={styles.chipLabel}>{chip.label}</Text>
                    <Text style={styles.chipSub}>{chip.sub}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <View
              key={msg.id}
              style={[
                styles.messageBubbleRow,
                msg.role === 'user' ? styles.userRow : styles.assistantRow,
              ]}
            >
              {msg.role === 'assistant' && (
                <View style={styles.assistantAvatarSmall}>
                  <Ionicons name="hardware-chip-outline" size={14} color="#005312" />
                </View>
              )}
              <View
                style={[
                  styles.bubble,
                  msg.role === 'user' ? styles.userBubble : styles.assistantBubble,
                ]}
              >
                <Text
                  style={[
                    styles.bubbleText,
                    msg.role === 'user' ? styles.userBubbleText : styles.assistantBubbleText,
                  ]}
                >
                  {msg.text}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Input bar */}
        <View style={styles.inputBar}>
          <View style={styles.inputInner}>
            <TouchableOpacity style={styles.inputAction}>
              <Ionicons name="add-circle-outline" size={24} color="#0d631b" />
            </TouchableOpacity>
            <TextInput
              style={styles.textInput}
              placeholder="Tanya apa saja tentang keuanganmu..."
              placeholderTextColor="#707a6c"
              value={input}
              onChangeText={setInput}
              multiline
              returnKeyType="send"
              onSubmitEditing={() => sendMessage(input)}
            />
            <View style={styles.inputActions}>
              <TouchableOpacity style={styles.micBtn}>
                <Ionicons name="mic-outline" size={20} color="#343d96" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
                onPress={() => sendMessage(input)}
                disabled={!input.trim()}
              >
                <Ionicons name="arrow-up" size={18} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f3f4f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e7e8e9',
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  aiAvatar: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#a3f69c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#191c1d',
  },
  headerAction: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: 16,
    paddingBottom: 8,
    gap: 12,
  },
  welcomeBlock: {
    paddingTop: 8,
    paddingBottom: 20,
  },
  welcomeDate: {
    fontSize: 13,
    color: '#707a6c',
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0d631b',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  welcomeSub: {
    fontSize: 15,
    color: '#40493d',
    lineHeight: 22,
    marginBottom: 20,
  },
  chips: {
    flexDirection: 'row',
    gap: 10,
  },
  chip: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#191c1d',
    marginBottom: 2,
  },
  chipSub: {
    fontSize: 10,
    color: '#707a6c',
  },
  messageBubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  assistantRow: {
    justifyContent: 'flex-start',
  },
  assistantAvatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#a3f69c',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: '#2e7d32',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: '#f3f4f5',
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 14,
    lineHeight: 20,
  },
  userBubbleText: {
    color: '#cbffc2',
  },
  assistantBubbleText: {
    color: '#191c1d',
  },
  inputBar: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e7e8e9',
  },
  inputInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    gap: 6,
  },
  inputAction: {
    padding: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#191c1d',
    maxHeight: 80,
    paddingVertical: 4,
  },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  micBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#e0e0ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#0d631b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#bfcaba',
  },
});