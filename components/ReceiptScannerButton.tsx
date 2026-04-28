import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { extractTransactionFromImage } from '../services/receiptAiService';

const C = {
  primary: "#0d631b",
  onPrimary: "#ffffff",
  error: "#ba1a1a",
};

export default function ReceiptScannerButton() {
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();

  const processImageResult = async (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled || !result.assets || result.assets.length === 0) {
      return;
    }

    setIsProcessing(true);
    try {
      const asset = result.assets[0];
      
      if (!asset.base64) {
         throw new Error("Gagal mengambil data gambar (base64 kosong).");
      }

      const mimeType = asset.mimeType || (asset.uri.endsWith('.png') ? 'image/png' : 'image/jpeg');

      // Panggil AI
      const txData = await extractTransactionFromImage(asset.base64, mimeType);

      // Navigasi ke halaman Tambah Transaksi dengan parameter
      router.push({
        pathname: "/addTransaction",
        params: {
          amount: txData.amount.toString(),
          category: txData.category,
          note: txData.note,
          type: txData.type,
          insight: txData.insight || '',
        }
      });
    } catch (err: any) {
      console.error('Scan Error:', err);
      Alert.alert('Gagal Memproses Struk', err.message || 'Pastikan gambar struk terlihat jelas.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePress = () => {
    if (isProcessing) return;

    Alert.alert(
      "Pindai Struk",
      "Pilih sumber gambar struk belanja Anda",
      [
        {
          text: "Pilih dari Galeri",
          onPress: async () => {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Izin Ditolak', 'Aplikasi butuh akses galeri foto.');
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              quality: 0.5,
              base64: true,
            });
            processImageResult(result);
          }
        },
        {
          text: "Ambil Foto",
          onPress: async () => {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status !== 'granted') {
              Alert.alert('Izin Ditolak', 'Aplikasi butuh akses kamera.');
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              quality: 0.5,
              base64: true,
            });
            processImageResult(result);
          }
        },
        {
          text: "Batal",
          style: "cancel"
        }
      ]
    );
  };

  return (
    <TouchableOpacity
      style={[styles.actionBtn, isProcessing && { opacity: 0.5 }]}
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={isProcessing}
    >
      {isProcessing ? (
        <ActivityIndicator size="small" color={C.primary} />
      ) : (
        <MaterialIcons name="photo-camera" size={24} color={C.primary} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  actionBtn: {
    padding: 6,
    marginRight: 4,
  },
});
