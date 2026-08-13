import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fontFamily } from '../../constants/theme';
import { Plan } from '../../types';
import { formatCurrency, formatPercent } from '../../utils/format';
import { GradientButton } from '../ui/gradient-button';
import { SurfaceCard } from '../ui/surface-card';

type PlanCardProps = {
  plan: Plan;
  onInvest?: () => void;
};

export const PlanCard = ({ plan, onInvest }: PlanCardProps) => (
  <SurfaceCard>
    <View style={styles.header}>
      <View style={styles.left}>
        <View style={[styles.iconWrap, { backgroundColor: `${plan.accent}18` }]}>
          <Ionicons name="trending-up-outline" size={20} color={plan.accent} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.name}>{plan.name}</Text>
          <Text style={styles.description}>{plan.description}</Text>
        </View>
      </View>
      <Text style={[styles.roi, { color: plan.accent }]}>{formatPercent(plan.roi)}</Text>
    </View>

    <View style={styles.metrics}>
      <View>
        <Text style={styles.metricLabel}>Min Invest</Text>
        <Text style={styles.metricValue}>{formatCurrency(plan.minInvestment)}</Text>
      </View>
      <View>
        <Text style={styles.metricLabel}>Max Invest</Text>
        <Text style={styles.metricValue}>{formatCurrency(plan.maxInvestment)}</Text>
      </View>
      <View>
        <Text style={styles.metricLabel}>Term</Text>
        <Text style={styles.metricValue}>{plan.termDays} days</Text>
      </View>
    </View>

    <GradientButton label="Invest Now" onPress={onInvest} compact />
  </SurfaceCard>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  left: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 18,
    color: colors.text,
  },
  description: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 20,
    color: colors.muted,
  },
  roi: {
    fontFamily: fontFamily.heading,
    fontSize: 28,
  },
  metrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  metricLabel: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    color: colors.muted,
  },
  metricValue: {
    marginTop: 4,
    fontFamily: fontFamily.bodyBold,
    fontSize: 14,
    color: colors.text,
  },
});
