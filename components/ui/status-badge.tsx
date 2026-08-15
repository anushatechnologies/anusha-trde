import { Ionicons } from '@expo/vector-icons';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors, fontFamily, radius } from '../../constants/theme';

export type StatusType =
  | 'active'
  | 'approved'
  | 'pending'
  | 'processing'
  | 'rejected'
  | 'failed'
  | 'completed'
  | 'verified';

type StatusBadgeProps = {
  status: StatusType | string;
  label?: string;
  size?: 'sm' | 'md';
  style?: StyleProp<ViewStyle>;
};

export const StatusBadge = ({
  status,
  label,
  size = 'md',
  style,
}: StatusBadgeProps) => {
  const normalized = (status || '').toLowerCase().trim();

  let badgeColor = colors.muted;
  let badgeBg = 'rgba(100, 116, 139, 0.15)';
  let badgeBorder = 'rgba(100, 116, 139, 0.3)';
  let displayLabel = label || status;
  let iconName: keyof typeof Ionicons.glyphMap = 'ellipse';

  if (normalized === 'active' || normalized === 'approved' || normalized === 'verified' || normalized === 'completed' || normalized === 'success') {
    badgeColor = colors.successLight;
    badgeBg = 'rgba(16, 185, 129, 0.16)';
    badgeBorder = 'rgba(52, 211, 153, 0.35)';
    iconName = 'checkmark-circle';
  } else if (normalized === 'pending' || normalized === 'processing' || normalized === 'in_progress' || normalized === 'submitted') {
    badgeColor = colors.warningLight;
    badgeBg = 'rgba(245, 158, 11, 0.16)';
    badgeBorder = 'rgba(251, 191, 36, 0.35)';
    iconName = 'time-outline';
  } else if (normalized === 'rejected' || normalized === 'failed' || normalized === 'locked' || normalized === 'error') {
    badgeColor = colors.dangerLight;
    badgeBg = 'rgba(239, 68, 68, 0.16)';
    badgeBorder = 'rgba(248, 113, 113, 0.35)';
    iconName = 'close-circle';
  }

  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: badgeBg, borderColor: badgeBorder },
        isSmall && styles.badgeSmall,
        style,
      ]}
    >
      <Ionicons name={iconName} size={isSmall ? 10 : 12} color={badgeColor} />
      <Text style={[styles.label, { color: badgeColor }, isSmall && styles.labelSmall]}>
        {displayLabel}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  label: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    letterSpacing: 0.2,
    textTransform: 'capitalize',
  },
  labelSmall: {
    fontSize: 10.5,
  },
});
