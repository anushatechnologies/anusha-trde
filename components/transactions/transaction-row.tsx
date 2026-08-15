import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fontFamily, radius, shadows } from '../../constants/theme';
import { TransactionItem } from '../../types';
import { formatCurrency } from '../../utils/format';
import { StatusBadge } from '../ui/status-badge';

type TransactionRowProps = {
  item: TransactionItem;
};

const iconMap = {
  deposit: 'arrow-down-circle-outline',
  withdrawal: 'arrow-up-circle-outline',
  commission: 'people-circle-outline',
  profit: 'sparkles-outline',
} as const;

export const TransactionRow = ({ item }: TransactionRowProps) => {
  const positive = item.amount > 0;

  return (
    <View style={styles.row}>
      <View style={styles.left}>
        <View style={[styles.iconWrap, positive ? styles.iconSuccess : styles.iconDefault]}>
          <Ionicons
            name={iconMap[item.type] || 'cash-outline'}
            size={20}
            color={positive ? colors.successLight : colors.cyan}
          />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.meta}>{item.timestamp}</Text>
          {item.note ? <Text style={styles.note} numberOfLines={1}>{item.note}</Text> : null}
        </View>
      </View>
      <View style={styles.amountWrap}>
        <Text style={[styles.amount, positive ? styles.positive : styles.negative]}>
          {positive ? '+' : '-'} {formatCurrency(Math.abs(item.amount))}
        </Text>
        <StatusBadge status={item.status} size="sm" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  left: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    ...shadows.glass,
  },
  iconDefault: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  iconSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 14.5,
    color: '#FFFFFF',
  },
  meta: {
    fontFamily: fontFamily.body,
    fontSize: 11.5,
    color: colors.textSecondary,
  },
  note: {
    fontFamily: fontFamily.body,
    fontSize: 11,
    color: colors.muted,
  },
  amountWrap: {
    alignItems: 'flex-end',
    gap: 6,
  },
  amount: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 15,
  },
  positive: {
    color: colors.successLight,
  },
  negative: {
    color: '#FFFFFF',
  },
});
