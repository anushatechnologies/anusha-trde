import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fontFamily, radius, shadows } from '../../constants/theme';
import { Plan } from '../../types';
import { formatCurrency, formatPercent } from '../../utils/format';
import { GradientButton } from '../ui/gradient-button';
import { SurfaceCard } from '../ui/surface-card';

type PlanCardProps = {
  plan: Plan;
  onInvest?: () => void;
};

export const PlanCard = ({ plan, onInvest }: PlanCardProps) => {
  const accentColor = plan.accent || colors.cyan;

  return (
    <SurfaceCard glass="dark" style={styles.card}>
      <View style={styles.header}>
        <View style={styles.left}>
          <View style={[styles.iconWrap, { backgroundColor: `${accentColor}20`, borderColor: `${accentColor}40` }]}>
            <Ionicons name="trending-up-outline" size={22} color={accentColor} />
          </View>
          <View style={styles.copy}>
            <Text style={styles.name}>{plan.name}</Text>
            <Text style={styles.description}>{plan.description}</Text>
          </View>
        </View>
        <View style={styles.roiWrap}>
          <Text style={[styles.roi, { color: accentColor }]}>{formatPercent(plan.roi)}</Text>
          <Text style={styles.roiSub}>ROI / DAY</Text>
        </View>
      </View>

      <View style={styles.metricsContainer}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Min Invest</Text>
          <Text style={styles.metricValue}>{formatCurrency(plan.minInvestment)}</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Max Invest</Text>
          <Text style={styles.metricValue}>{formatCurrency(plan.maxInvestment)}</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Term</Text>
          <Text style={styles.metricValue}>{plan.termDays} Days</Text>
        </View>
      </View>

      <GradientButton label="Invest in this Plan" onPress={onInvest} compact />
    </SurfaceCard>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 18,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  left: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
    alignItems: 'center',
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glass,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 18,
    color: '#FFFFFF',
  },
  description: {
    fontFamily: fontFamily.body,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  roiWrap: {
    alignItems: 'flex-end',
  },
  roi: {
    fontFamily: fontFamily.heading,
    fontSize: 26,
    letterSpacing: -0.5,
  },
  roiSub: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 10,
    letterSpacing: 0.8,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  metricsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  metricLabel: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 14,
    color: '#FFFFFF',
  },
});
