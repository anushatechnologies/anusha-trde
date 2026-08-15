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
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  active: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  label: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 13,
    color: '#4B5563',
  },
  activeLabel: {
    color: '#2563EB',
    fontFamily: fontFamily.bodyBold,
  },
});


