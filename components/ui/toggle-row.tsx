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
  <SurfaceCard style={styles.card}>
    <View style={styles.copy}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      thumbColor={colors.surface}
      trackColor={{ false: '#CBD5E1', true: colors.primary }}
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
    fontFamily: fontFamily.bodyBold,
    fontSize: 15,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 20,
    color: colors.muted,
  },
});
