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

  let badgeColor = '#475569';
  let badgeBg = '#F1F5F9';
  let badgeBorder = '#E2E8F0';
  let displayLabel = label || status;
  let iconName: keyof typeof Ionicons.glyphMap = 'ellipse';

  if (normalized === 'active' || normalized === 'approved' || normalized === 'verified' || normalized === 'completed' || normalized === 'success') {
    badgeColor = '#166534';
    badgeBg = '#DCFCE7';
    badgeBorder = '#BBF7D0';
    iconName = 'checkmark-circle';
  } else if (normalized === 'pending' || normalized === 'processing' || normalized === 'in_progress' || normalized === 'submitted' || normalized === 'pending_approval' || normalized === 'under_review') {
    badgeColor = '#92400E';
    badgeBg = '#FEF3C7';
    badgeBorder = '#FDE68A';
    iconName = 'time-outline';
  } else if (normalized === 'rejected' || normalized === 'failed' || normalized === 'locked' || normalized === 'error' || normalized === 'cancelled' || normalized === 'suspended') {
    badgeColor = '#991B1B';
    badgeBg = '#FEE2E2';
    badgeBorder = '#FECACA';
    iconName = 'close-circle';
  } else if (normalized === 'info' || normalized === 'initiated') {
    badgeColor = '#1E40AF';
    badgeBg = '#DBEAFE';
    badgeBorder = '#BFDBFE';
    iconName = 'information-circle';
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
