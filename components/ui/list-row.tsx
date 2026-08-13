import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontFamily } from '../../constants/theme';
import { SurfaceCard } from './surface-card';

type ListRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  trailing?: string;
  onPress?: () => void;
  danger?: boolean;
};

export const ListRow = ({ icon, title, subtitle, trailing, onPress, danger = false }: ListRowProps) => (
  <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [pressed && onPress ? styles.pressed : null]}>
    <SurfaceCard style={styles.card}>
      <View style={styles.left}>
        <View style={[styles.iconWrap, danger && styles.iconWrapDanger]}>
          <Ionicons name={icon} size={18} color={danger ? colors.danger : colors.primary} />
        </View>
        <View style={styles.copy}>
          <Text style={[styles.title, danger && styles.danger]}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {trailing || onPress ? (
        <View style={styles.right}>
          {trailing ? <Text style={styles.trailing}>{trailing}</Text> : null}
          {onPress ? <Ionicons name="chevron-forward" size={18} color={colors.muted} /> : null}
        </View>
      ) : null}
    </SurfaceCard>
  </Pressable>
);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pressed: {
    opacity: 0.96,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapDanger: {
    backgroundColor: '#FEF2F2',
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
    color: colors.muted,
  },
  trailing: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    color: colors.primary,
  },
  danger: {
    color: colors.danger,
  },
});
