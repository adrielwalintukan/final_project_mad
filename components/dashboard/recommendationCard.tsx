import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type RecommendationCardProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  ctaLabel?: string;
  onPressCta?: () => void;
  /** Accent colour used for icon, CTA button, and subtle bg tint */
  accentColor?: string;
};

export default function RecommendationCard({
  icon = 'bulb',
  title,
  body,
  ctaLabel,
  onPressCta,
  accentColor = '#0d631b',
}: RecommendationCardProps) {
  return (
    <View style={[styles.card, { borderLeftColor: accentColor }]}>
      {/* Top row */}
      <View style={styles.topRow}>
        <View style={[styles.iconCircle, { backgroundColor: accentColor + '22' }]}>
          <Ionicons name={icon} size={20} color={accentColor} />
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
      </View>

      {/* Body */}
      <Text style={styles.body}>{body}</Text>

      {/* CTA */}
      {ctaLabel && onPressCta && (
        <TouchableOpacity
          style={[styles.ctaBtn, { backgroundColor: accentColor }]}
          activeOpacity={0.8}
          onPress={onPressCta}
        >
          <Text style={styles.ctaText}>{ctaLabel}</Text>
          <Ionicons name="arrow-forward" size={14} color="#ffffff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#191c1d',
    lineHeight: 20,
  },
  body: {
    fontSize: 13,
    color: '#40493d',
    lineHeight: 19,
    marginBottom: 14,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  ctaText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});