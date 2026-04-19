import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type InsightCardProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBg?: string;
  title: string;
  description: string;
  badge?: string;
  badgeColor?: string;
  onPress?: () => void;
};

export default function InsightCard({
  icon = 'bulb-outline',
  iconColor = '#0d631b',
  iconBg = '#a3f69c',
  title,
  description,
  badge,
  badgeColor = '#0d631b',
  onPress,
}: InsightCardProps) {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={onPress ? 0.75 : 1}
      onPress={onPress}
    >
      <View style={[styles.iconWrapper, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>

      <View style={styles.textBlock}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>
      </View>

      {badge && (
        <View style={[styles.badge, { backgroundColor: badgeColor + '1A' }]}>
          <Text style={[styles.badgeText, { color: badgeColor }]}>{badge}</Text>
        </View>
      )}

      {onPress && (
        <Ionicons name="chevron-forward" size={16} color="#707a6c" style={styles.chevron} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 10,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#191c1d',
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
    color: '#707a6c',
    lineHeight: 17,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    flexShrink: 0,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  chevron: {
    flexShrink: 0,
  },
});