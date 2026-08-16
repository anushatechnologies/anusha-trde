import { Switch, StyleSheet, Text, View } from 'react-native';

import { colors, fontFamily } from '../../constants/theme';
import { SurfaceCard } from './surface-card';

type ToggleRowProps = {
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

export const ToggleRow = ({ title, subtitle, value, onValueChange }: ToggleRowProps) => (
  <SurfaceCard glass="dark" style={styles.card}>
    <View style={styles.copy}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      thumbColor={value ? colors.cyan : '#94A3B8'}
      trackColor={{ false: '#334155', true: colors.primary }}
    />
  </SurfaceCard>
);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontFamily: fontFamily.heading,
    fontSize: 15,
    color: '#0F172A',
  },
  subtitle: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 18,
    color: '#64748B',
  },
});
