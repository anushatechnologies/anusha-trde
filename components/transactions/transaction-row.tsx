import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fontFamily } from '../../constants/theme';
import { TransactionItem } from '../../types';
import { formatCurrency } from '../../utils/format';

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
          <Ionicons name={iconMap[item.type]} size={20} color={positive ? colors.success : colors.primary} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.meta}>{item.timestamp}</Text>
          <Text style={styles.note}>{item.note}</Text>
        </View>
      </View>
      <View style={styles.amountWrap}>
        <Text style={[styles.amount, positive ? styles.positive : styles.negative]}>
          {positive ? '+' : '-'} {formatCurrency(Math.abs(item.amount))}
        </Text>
        <View style={styles.statusRow}>
          <MaterialCommunityIcons name="circle-medium" size={16} color={positive ? colors.success : colors.warning} />
          <Text style={styles.status}>{item.status}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  left: {
    flexDirection: 'row',
    flex: 1,
    gap: 12,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconDefault: {
    backgroundColor: '#EEF2FF',
  },
  iconSuccess: {
    backgroundColor: '#ECFDF5',
  },
  copy: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 15,
    color: colors.text,
  },
  meta: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    color: colors.muted,
  },
  note: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    color: colors.muted,
  },
  amountWrap: {
    alignItems: 'flex-end',
    gap: 4,
  },
  amount: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 14,
  },
  positive: {
    color: colors.success,
  },
  negative: {
    color: colors.text,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  status: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    color: colors.muted,
    textTransform: 'capitalize',
  },
});
