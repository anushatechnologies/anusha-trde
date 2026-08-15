import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
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

export const StatCard = ({
  label,
  value,
  icon,
  accent = colors.primary,
  change,
  onPress,
  actionLabel = 'View details',
}: StatCardProps) => {
  const cardContent = (
    <SurfaceCard glass="dark" style={styles.card}>
      <View style={styles.headerRow}>
        <View style={[styles.iconWrap, { backgroundColor: `${accent}22`, borderColor: `${accent}40` }]}>
          {icon}
        </View>

        {change ? (
          <View style={styles.changeBadge}>
            <Ionicons name="trending-up" size={11} color={colors.successLight} />
            <Text style={styles.changeText}>{change}</Text>
          </View>
        ) : onPress ? (
          <View style={[styles.chevronWrap, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]}>
            <Ionicons name="arrow-forward" size={13} color={colors.cyan} />
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
      android_ripple={{ color: `${accent}16` }}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={actionLabel}
    >
      {cardContent}
    </Pressable>
  );
};

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
    borderColor: 'rgba(255, 255, 255, 0.10)',
    ...shadows.glass,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  chevronWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    borderColor: 'rgba(52, 211, 153, 0.35)',
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  changeText: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 11,
    color: colors.successLight,
  },
  copyBlock: {
    gap: 4,
  },
  label: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 21,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
});
