import { Ionicons } from '@expo/vector-icons';
import React, { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontFamily, radius, shadows } from '../../constants/theme';
import { SurfaceCard } from './surface-card';

type StatCardProps = {
  label: string;
  value: string;
  icon: ReactNode;
  accent?: string;
  change?: string;
  onPress?: () => void;
  actionLabel?: string;
};

export const StatCard = React.memo(({
  label,
  value,
  icon,
  accent = colors.primary,
  change,
  onPress,
  actionLabel = 'View details',
}: StatCardProps) => {
  const cardContent = (
    <SurfaceCard style={styles.card}>
      <View style={styles.headerRow}>
        <View style={[styles.iconWrap, { backgroundColor: `${accent}14`, borderColor: `${accent}28` }]}>
          {icon}
        </View>

        {change ? (
          <View style={styles.changeBadge}>
            <Ionicons name="trending-up" size={11} color={colors.success} />
            <Text style={styles.changeText}>{change}</Text>
          </View>
        ) : onPress ? (
          <View style={styles.chevronWrap}>
            <Ionicons name="arrow-forward" size={13} color={colors.primary} />
          </View>
        ) : null}
      </View>

      <View style={styles.copyBlock}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
          {value}
        </Text>
      </View>
    </SurfaceCard>
  );

  if (!onPress) {
    return cardContent;
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressablePressed]}
      android_ripple={{ color: `${accent}12` }}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={actionLabel}
    >
      {cardContent}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    width: '100%',
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  pressablePressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  card: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    width: '100%',
    minHeight: 136,
    padding: 16,
    gap: 14,
    justifyContent: 'space-between',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    ...shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  changeText: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 11,
    color: '#15803D',
  },
  chevronWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyBlock: {
    gap: 4,
  },
  label: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    color: '#64748B',
  },
  value: {
    fontFamily: fontFamily.heading,
    fontSize: 18,
    color: '#0F172A',
  },
});
