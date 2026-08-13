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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  active: {
    backgroundColor: '#EEF2FF',
    borderColor: '#DBEAFE',
  },
  label: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 13,
    color: colors.muted,
  },
  activeLabel: {
    color: colors.primary,
  },
});
