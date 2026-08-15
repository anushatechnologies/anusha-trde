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
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
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
