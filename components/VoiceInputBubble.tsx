import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { useRouter } from 'expo-router';
import { extractTransactionFromAudio } from '../services/transactionAiService';

const C = {
  primary: "#0d631b",
  onPrimary: "#ffffff",
  error: "#ba1a1a",
};

export default function VoiceInputBubble() {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, [recording]);

  const startRecording = async () => {
    try {
      if (isProcessing) return;

      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Izin Ditolak', 'Aplikasi butuh akses mikrofon untuk merekam suara.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'Gagal memulai rekaman.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsProcessing(true);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (!uri) {
        throw new Error('URI rekaman tidak ditemukan');
      }

      // Membaca file rekaman sebagai Base64
      const base64Audio = await FileSystem.readAsStringAsync(uri, {
        encoding: 'base64',
      });

      // Menentukan mimeType berdasarkan platform
      const mimeType = Platform.OS === 'ios' ? 'audio/m4a' : 'audio/m4a'; // Expo AV High Quality biasanya menghasilkan m4a di kedua platform

      // Memanggil Gemini AI
      const result = await extractTransactionFromAudio(base64Audio, mimeType);

      // Navigasi ke halaman AddTransaction dengan melempar parameter
      router.push({
        pathname: '/addTransaction',
        params: {
          amount: result.amount.toString(),
          category: result.category,
          note: result.note,
          type: result.type,
          insight: result.insight || '',
        },
      });

    } catch (err) {
      console.error('Failed to stop/process recording', err);
      Alert.alert('Gagal', 'Maaf, suara tidak dapat diproses. Silakan coba lagi.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePress = () => {
    if (recording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.bubble,
          recording && styles.bubbleRecording,
          isProcessing && styles.bubbleProcessing,
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <MaterialIcons name={recording ? "stop" : "mic"} size={28} color="#fff" />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 180 : 160,
    right: 20,
    zIndex: 100,
  },
  bubble: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: C.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  bubbleRecording: {
    backgroundColor: C.error, // Berubah merah saat merekam
  },
  bubbleProcessing: {
    backgroundColor: '#888', // Berubah abu-abu saat memproses
  },
});
