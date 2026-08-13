import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontFamily, radius } from '../../constants/theme';
import { SurfaceCard } from './surface-card';

type StatCardProps = {
  label: string;
  value: string;
  icon: ReactNode;
  accent?: string;
  onPress?: () => void;
  actionLabel?: string;
};

export const StatCard = ({
  label,
  value,
  icon,
  accent = colors.primary,
  onPress,
  actionLabel = 'View details',
}: StatCardProps) => {
  const cardContent = (
    <SurfaceCard style={styles.card}>
      <View style={styles.headerRow}>
        <View style={[styles.iconWrap, { backgroundColor: `${accent}14` }]}>{icon}</View>
        {onPress ? (
          <View style={[styles.chevronWrap, { backgroundColor: `${accent}12` }]}>
            <Ionicons name="arrow-forward" size={14} color={accent} />
          </View>
        ) : null}
      </View>
      <View style={styles.copyBlock}>
        <Text style={styles.label} numberOfLines={2}>
          {label}
        </Text>
        <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78}>
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
};

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    width: '100%',
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  pressablePressed: {
    opacity: 0.92,
  },
  card: {
    flex: 1,
    flexBasis: 0,
    minWidth: 0,
    width: '100%',
    minHeight: 138,
    padding: 16,
    gap: 12,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyBlock: {
    gap: 8,
  },
  label: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    lineHeight: 17,
    color: colors.muted,
  },
  value: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 21,
    color: colors.text,
  },
});
