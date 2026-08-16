import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontFamily, radius, shadows } from '../../constants/theme';
import { SurfaceCard } from './surface-card';

type ListRowProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  trailing?: string;
  onPress?: () => void;
  danger?: boolean;
};

export const ListRow = ({
  icon,
  title,
  subtitle,
  trailing,
  onPress,
  danger = false,
}: ListRowProps) => (
  <Pressable
    onPress={onPress}
    disabled={!onPress}
    style={({ pressed }) => [pressed && onPress ? styles.pressed : null]}
  >
    <SurfaceCard glass="dark" style={styles.card}>
      <View style={styles.left}>
        <View style={[styles.iconWrap, danger && styles.iconWrapDanger]}>
          <Ionicons
            name={icon}
            size={18}
            color={danger ? colors.dangerLight : colors.cyan}
          />
        </View>
        <View style={styles.copy}>
          <Text style={[styles.title, danger && styles.danger]}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {trailing || onPress ? (
        <View style={styles.right}>
          {trailing ? <Text style={styles.trailing}>{trailing}</Text> : null}
          {onPress ? <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} /> : null}
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
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: radius.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.985 }],
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
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapDanger: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 15,
    color: '#0F172A',
  },
  subtitle: {
    fontFamily: fontFamily.body,
    fontSize: 12.5,
    color: '#64748B',
  },
  trailing: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 13,
    color: colors.primary,
  },
  danger: {
    color: '#DC2626',
  },
});
