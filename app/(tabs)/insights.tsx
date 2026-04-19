import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";

export default function InsightsScreen() {

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI Insights</Text>
      </View>

      {/* Coming Soon Content */}
      <View style={styles.content}>
        <View style={styles.iconWrapper}>
          <Ionicons name="bulb" size={48} color="#7f2448" />
        </View>
        <Text style={styles.comingSoonTitle}>Coming Soon</Text>
        <Text style={styles.comingSoonSubtitle}>
          Personalized AI-powered financial insights{'\n'}will appear here.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#191c1d',
    letterSpacing: -0.5,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ffd9e2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  comingSoonTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#191c1d',
    marginBottom: 10,
    textAlign: 'center',
  },
  comingSoonSubtitle: {
    fontSize: 15,
    color: '#707a6c',
    textAlign: 'center',
    lineHeight: 22,
  },
});