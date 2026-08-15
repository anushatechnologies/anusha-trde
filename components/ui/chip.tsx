import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, fontFamily, radius } from '../../constants/theme';

type ChipProps = {
  label: string;
  active?: boolean;
  onPress?: () => void;
};

export const Chip = ({ label, active = false, onPress }: ChipProps) => (
  <Pressable onPress={onPress} style={[styles.chip, active && styles.active]}>
    <Text style={[styles.label, active && styles.activeLabel]}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  chip: {
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundcolor: '#374151',
    borderWidth: 1,
    bordercolor: '#6B7280',
  },
  active: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: colors.cyan,
  },
  label: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 13,
    color: colors.textSecondary,
  },
  activeLabel: {
    color: colors.cyan,
  },
});


