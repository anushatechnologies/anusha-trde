
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';

import { LineChart } from '../../components/charts/line-chart';
import { ReferralTree } from '../../components/team/referral-tree';
import { TransactionRow } from '../../components/transactions/transaction-row';
import { colors, fontFamily, gradients, radius } from '../../constants/theme';
import { useDashboardQuery, useInvestmentsQuery, useTeamQuery, useWalletQuery } from '../../hooks/use-app-queries';
import { receiptService } from '../../services/receipt.service';
import { ActiveInvestment, Plan, TransactionItem } from '../../types';
import { formatCurrency, formatPercent } from '../../utils/format';
import { ReceiptStatusCard } from '../receipt/receipt-status-card';
import { AppScreen } from '../ui/app-screen';
import { GradientButton } from '../ui/gradient-button';
import { ScreenHeader } from '../ui/screen-header';
import { SectionTitle } from '../ui/section-title';
import { SkeletonBlock } from '../ui/skeleton-block';
import { StatCard } from '../ui/stat-card';
import { SurfaceCard } from '../ui/surface-card';

const ProgressRing = ({ progress }: { progress: number }) => {
  const size = 142;
  const strokeWidth = 12;
  const radiusValue = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radiusValue;
  const clampedProgress = Math.max(0, Math.min(progress, 1));
  const strokeDashoffset = circumference - circumference * clampedProgress;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radiusValue}
        stroke="#DBEAFE"
        strokeWidth={strokeWidth}
        fill="none"
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radiusValue}
        stroke={colors.secondary}
        strokeWidth={strokeWidth}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={strokeDashoffset}
        rotation="-90"
        origin={`${size / 2}, ${size / 2}`}
      />
      <SvgText
        x={size / 2}
        y={size / 2 - 6}
        fontSize="22"
        fontWeight="700"
        fill={colors.text}
        textAnchor="middle"
      >
        {Math.round(clampedProgress * 100)}%
      </SvgText>
      <SvgText
        x={size / 2}
        y={size / 2 + 18}
        fontSize="11"
        fill={colors.muted}
        textAnchor="middle"
      >
        Completed
      </SvgText>
    </Svg>
  );
};

const ReceiptCard = ({
  item,
  index,
  paymentMethod,
}: {
  item: TransactionItem;
  index: number;
  paymentMethod: string;
}) => {
  const reference = `AT-INV-2026-${String(index + 1).padStart(4, '0')}`;
  const positive = item.amount > 0;

  return (
    <SurfaceCard>
      <View style={styles.receiptHeader}>
        <View>
          <Text style={styles.receiptReference}>{reference}</Text>
          <Text style={styles.receiptDate}>{item.timestamp}</Text>
        </View>
        <View style={[styles.receiptBadge, positive ? styles.receiptBadgeSuccess : styles.receiptBadgeDefault]}>
          <Text style={[styles.receiptBadgeText, positive ? styles.receiptBadgeTextSuccess : styles.receiptBadgeTextDefault]}>
            {item.status}
          </Text>
        </View>
      </View>

      <View style={styles.receiptAmountRow}>
        <Text style={styles.receiptTitle}>{item.title}</Text>
        <Text style={[styles.receiptAmount, positive ? styles.amountPositive : styles.amountDefault]}>
          {positive ? '+' : '-'} {formatCurrency(Math.abs(item.amount))}
        </Text>
      </View>

      <View style={styles.receiptMetaGrid}>
        <View style={styles.receiptMetaCell}>
          <Text style={styles.receiptMetaLabel}>Method</Text>
          <Text style={styles.receiptMetaValue}>{paymentMethod || 'Bank Transfer'}</Text>
        </View>
        <View style={styles.receiptMetaCell}>
          <Text style={styles.receiptMetaLabel}>Type</Text>
          <Text style={styles.receiptMetaValue}>{item.type}</Text>
        </View>
      </View>

      <Text style={styles.receiptNote}>{item.note}</Text>

      <GradientButton
        label="View / Download Official Receipt"
        variant="secondary"
        compact
        style={{ marginTop: 10 }}
        icon={<Ionicons name="document-text-outline" size={16} color={colors.primary} />}
        onPress={() => {
          receiptService.viewReceipt({
            receiptNo: reference,
            receiptDate: item.timestamp,
            status: 'PAID / RECEIVED',
            currency: 'INR',
            description: item.title,
            paymentMode: paymentMethod || 'Bank Transfer',
            referenceNo: item.id || `ATREF20260810${index + 1}`,
            amount: Math.abs(item.amount),
          });
        }}
      />
    </SurfaceCard>
  );
};

const getExpectedProfit = (investment: ActiveInvestment) =>
  investment.progress > 0 ? investment.earned / investment.progress : investment.earned;

const getRemainingDays = (investment: ActiveInvestment, plan: Plan | undefined) => {
  if (!plan) {
    return 0;
  }

  return Math.max(Math.round(plan.termDays * (1 - investment.progress)), 0);
};

const formatDateAfterDays = (days: number) =>
  new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(Date.now() + days * 24 * 60 * 60 * 1000));

export const MonthlyInterestScreen = () => {
  const router = useRouter();
  const { data: dashboardData, isLoading: isDashboardLoading } = useDashboardQuery();
  const { data: investmentsData, isLoading: isInvestmentsLoading } = useInvestmentsQuery();

  const activeInvestments = investmentsData?.activeInvestments ?? [];
  const monthlyProjection = activeInvestments.reduce((total, item) => total + getExpectedProfit(item), 0);
  const creditedThisMonth = activeInvestments.reduce((total, item) => total + item.earned, 0);
  const monthlyInterestRate = dashboardData?.metrics.monthlyGrowth ?? 0;

  if (isDashboardLoading || isInvestmentsLoading || !dashboardData || !investmentsData) {
    return (
      <AppScreen>
        <ScreenHeader title="Monthly Interest" subtitle="Track projected monthly returns and credited earnings." onBackPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))} />
        <SkeletonBlock height={170} />
        <View style={styles.dualGrid}>
          <SkeletonBlock height={110} style={styles.flexOne} />
          <SkeletonBlock height={110} style={styles.flexOne} />
        </View>
        <SkeletonBlock height={210} />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <ScreenHeader title="Monthly Interest" subtitle="Track projected monthly returns and credited earnings." onBackPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))} />

      <SurfaceCard gradient={gradients.primary}>
        <Text style={styles.heroTitle}>Monthly Interest Rate</Text>
        <Text style={styles.heroSubtitle}>{formatPercent(monthlyInterestRate)} growth with active plans compounding this cycle.</Text>
        <View style={styles.metricStrip}>
          <View style={styles.metricStripItem}>
            <Text style={styles.metricStripLabel}>Projected Return</Text>
            <Text style={styles.metricStripValue}>{formatCurrency(monthlyProjection)}</Text>
          </View>
          <View style={styles.metricStripItem}>
            <Text style={styles.metricStripLabel}>Credited This Month</Text>
            <Text style={styles.metricStripValue}>{formatCurrency(creditedThisMonth)}</Text>
          </View>
        </View>
      </SurfaceCard>

      <View style={styles.dualGrid}>
        <StatCard
          label="Total Invested"
          value={formatCurrency(dashboardData.metrics.totalInvested)}
          icon={<Ionicons name="trending-up-outline" size={18} color={colors.success} />}
          accent={colors.success}
        />
        <StatCard
          label="Wallet Balance"
          value={formatCurrency(dashboardData.metrics.walletBalance)}
          icon={<Ionicons name="wallet-outline" size={18} color={colors.primary} />}
        />
      </View>

      <SurfaceCard>
        <SectionTitle title="Monthly Trend" />
        <LineChart data={investmentsData.projectionSeries} height={180} />
      </SurfaceCard>

      <SurfaceCard>
        <SectionTitle title="Interest Breakdown" />
        {activeInvestments.map((investment) => (
          <View key={investment.id} style={styles.breakdownRow}>
            <View>
              <Text style={styles.breakdownTitle}>{investment.planName}</Text>
              <Text style={styles.breakdownMeta}>Credited so far {formatCurrency(investment.earned)}</Text>
            </View>
            <Text style={styles.breakdownValue}>{formatCurrency(getExpectedProfit(investment))}</Text>
          </View>
        ))}
      </SurfaceCard>
    </AppScreen>
  );
};

export const ReferralTreeScreen = () => {
  const router = useRouter();
  const { data, isLoading } = useTeamQuery();

  const totalEarnings = useMemo(
    () => (data?.levels ?? []).reduce((total, level) => total + level.earnings, 0),
    [data?.levels]
  );

  if (isLoading || !data) {
    return (
      <AppScreen>
        <ScreenHeader title="Referral Tree" subtitle="Visualize your team hierarchy and earnings by level." onBackPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/team'))} />
        <SkeletonBlock height={170} />
        <SkeletonBlock height={360} />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <ScreenHeader title="Referral Tree" subtitle="Visualize your team hierarchy and earnings by level." onBackPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/team'))} />

      <SurfaceCard gradient={gradients.primary}>
        <Text style={styles.heroTitle}>Referral Earnings</Text>
        <Text style={styles.heroSubtitle}>Monitor direct bonuses, passive income, and level growth across your full structure.</Text>
        <View style={styles.metricStrip}>
          <View style={styles.metricStripItem}>
            <Text style={styles.metricStripLabel}>Total Members</Text>
            <Text style={styles.metricStripValue}>{data.totalMembers}</Text>
          </View>
          <View style={styles.metricStripItem}>
            <Text style={styles.metricStripLabel}>Total Earnings</Text>
            <Text style={styles.metricStripValue}>{formatCurrency(totalEarnings)}</Text>
          </View>
        </View>
      </SurfaceCard>

      <View style={styles.dualGrid}>
        <StatCard
          label="Direct Bonus"
          value={formatCurrency(data.levels[0]?.earnings ?? 0)}
          icon={<Ionicons name="people-outline" size={18} color={colors.primary} />}
        />
        <StatCard
          label="Passive Income"
          value={formatCurrency(totalEarnings - (data.levels[0]?.earnings ?? 0))}
          icon={<Ionicons name="cash-outline" size={18} color={colors.secondary} />}
          accent={colors.secondary}
        />
      </View>

      <SurfaceCard>
        <SectionTitle title="Tree Visualization" />
        <ReferralTree levels={data.tree} />
      </SurfaceCard>

      <SurfaceCard>
        <SectionTitle title="Level Summary" />
        {data.levels.map((level) => (
          <View key={level.level} style={styles.breakdownRow}>
            <View>
              <Text style={styles.breakdownTitle}>Level {level.level}</Text>
              <Text style={styles.breakdownMeta}>{level.members} members at {formatPercent(level.commission)} commission</Text>
            </View>
            <Text style={styles.breakdownValue}>{formatCurrency(level.earnings)}</Text>
          </View>
        ))}
      </SurfaceCard>
    </AppScreen>
  );
};

export const WithdrawalHistoryScreen = () => {
  const router = useRouter();
  const { data, isLoading } = useWalletQuery();

  const withdrawals = useMemo(
    () => (data?.transactions ?? []).filter((item) => item.type === 'withdrawal'),
    [data?.transactions]
  );

  const settledAmount = withdrawals
    .filter((item) => item.status !== 'processing')
    .reduce((total, item) => total + Math.abs(item.amount), 0);
  const pendingAmount = withdrawals
    .filter((item) => item.status === 'processing')
    .reduce((total, item) => total + Math.abs(item.amount), 0);

  if (isLoading || !data) {
    return (
      <AppScreen>
        <ScreenHeader title="Withdrawal History" subtitle="Review requested and processed payouts." onBackPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/wallet'))} />
        <SkeletonBlock height={150} />
        <SkeletonBlock height={240} />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <ScreenHeader title="Withdrawal History" subtitle="Review requested and processed payouts." onBackPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/wallet'))} />

      <SurfaceCard gradient={gradients.primary}>
        <Text style={styles.heroTitle}>Withdrawal History</Text>
        <Text style={styles.heroSubtitle}>Track approved transfers, pending requests, and your most recent payout activity.</Text>
        <View style={styles.metricStrip}>
          <View style={styles.metricStripItem}>
            <Text style={styles.metricStripLabel}>Settled</Text>
            <Text style={styles.metricStripValue}>{formatCurrency(settledAmount)}</Text>
          </View>
          <View style={styles.metricStripItem}>
            <Text style={styles.metricStripLabel}>Pending</Text>
            <Text style={styles.metricStripValue}>{formatCurrency(pendingAmount)}</Text>
          </View>
        </View>
      </SurfaceCard>

      <SurfaceCard>
        <SectionTitle title="Payout Requests" />
        {withdrawals.length ? (
          withdrawals.map((item) => <TransactionRow key={item.id} item={item} />)
        ) : (
          <Text style={styles.emptyText}>No withdrawals have been requested yet.</Text>
        )}
      </SurfaceCard>
    </AppScreen>
  );
};

export const PaymentReceiptsScreen = () => {
  const router = useRouter();
  const { data, isLoading } = useWalletQuery();

  if (isLoading || !data) {
    return (
      <AppScreen>
        <ScreenHeader title="Payment Receipts" subtitle="Reference receipts for deposits, profits, and withdrawals." onBackPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/wallet'))} />
        <SkeletonBlock height={150} />
        <SkeletonBlock height={220} />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <ScreenHeader title="Payment Receipts" subtitle="Reference receipts for deposits, profits, and withdrawals." onBackPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/wallet'))} />

      <SurfaceCard gradient={gradients.primary}>
        <Text style={styles.heroTitle}>Payment Receipts</Text>
        <Text style={styles.heroSubtitle}>Every wallet movement is logged here with reference numbers and receipt details.</Text>
        <View style={styles.metricStrip}>
          <View style={styles.metricStripItem}>
            <Text style={styles.metricStripLabel}>Total Receipts</Text>
            <Text style={styles.metricStripValue}>{data.transactions.length}</Text>
          </View>
          <View style={styles.metricStripItem}>
            <Text style={styles.metricStripLabel}>Available Methods</Text>
            <Text style={styles.metricStripValue}>{data.paymentMethods.length}</Text>
          </View>
        </View>
      </SurfaceCard>

      {data.transactions.length ? (
        data.transactions.map((item, index) => (
          <ReceiptCard
            key={item.id}
            item={item}
            index={index}
            paymentMethod={data.paymentMethods.length ? data.paymentMethods[index % data.paymentMethods.length] : ''}
          />
        ))
      ) : (
        <SurfaceCard>
          <Text style={styles.emptyText}>No payment receipts available yet.</Text>
        </SurfaceCard>
      )}
    </AppScreen>
  );
};

export const InvestmentStatusScreen = () => {
  const router = useRouter();
  const { data, isLoading } = useInvestmentsQuery();

  const featuredInvestment = data?.activeInvestments[0];
  const planMap = useMemo(
    () => new Map((data?.plans ?? []).map((plan) => [plan.id, plan])),
    [data?.plans]
  );

  if (isLoading || !data) {
    return (
      <AppScreen>
        <ScreenHeader title="Investment Status" subtitle="Track progress, expected returns, and maturity details." onBackPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))} />
        <SkeletonBlock height={220} />
        <SkeletonBlock height={220} />
      </AppScreen>
    );
  }

  if (!featuredInvestment) {
    return (
      <AppScreen>
        <ScreenHeader title="Investment Status" subtitle="Track progress, expected returns, and maturity details." onBackPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))} />
        <SurfaceCard gradient={gradients.dark}>
          <Text style={styles.heroTitle}>Investment Status</Text>
          <Text style={styles.heroSubtitle}>No active investments are available yet.</Text>
        </SurfaceCard>
        <SurfaceCard>
          <Text style={styles.emptyText}>Your portfolio progress will appear here after the first investment is created.</Text>
        </SurfaceCard>
        <GradientButton label="Open Invest Screen" onPress={() => router.push('/(tabs)/invest')} />
      </AppScreen>
    );
  }

  const featuredPlan = planMap.get(featuredInvestment.planId);
  const featuredExpectedProfit = getExpectedProfit(featuredInvestment);
  const featuredRemainingDays = getRemainingDays(featuredInvestment, featuredPlan);

  return (
    <AppScreen>
      <ScreenHeader title="Investment Status" subtitle="Track progress, expected returns, and maturity details." onBackPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))} />

      <SurfaceCard gradient={gradients.dark}>
        <Text style={styles.heroTitle}>Investment Status</Text>
        <Text style={styles.heroSubtitle}>View active plan completion, maturity timeline, and projected total return.</Text>
        <View style={styles.statusHeroRow}>
          <ProgressRing progress={featuredInvestment.progress} />
          <View style={styles.statusHeroCopy}>
            <Text style={styles.statusHeroPlan}>{featuredInvestment.planName}</Text>
            <Text style={styles.statusHeroAmount}>{formatCurrency(featuredInvestment.amount)}</Text>
            <Text style={styles.statusHeroMeta}>Next payout: {featuredInvestment.nextPayout}</Text>
          </View>
        </View>
      </SurfaceCard>

      <View style={styles.dualGrid}>
        <StatCard
          label="Expected Return"
          value={formatCurrency(featuredExpectedProfit)}
          icon={<Ionicons name="cash-outline" size={18} color={colors.success} />}
          accent={colors.success}
        />
        <StatCard
          label="Time Remaining"
          value={`${featuredRemainingDays} days`}
          icon={<Ionicons name="time-outline" size={18} color={colors.primary} />}
        />
      </View>

      {data.activeInvestments.map((investment) => {
        const plan = planMap.get(investment.planId);
        const expectedProfit = getExpectedProfit(investment);
        const remainingDays = getRemainingDays(investment, plan);

        return (
          <SurfaceCard key={investment.id}>
            <View style={styles.investmentStatusHeader}>
              <View>
                <Text style={styles.breakdownTitle}>{investment.planName}</Text>
                <Text style={styles.breakdownMeta}>Maturity date {formatDateAfterDays(remainingDays)}</Text>
              </View>
              <View style={styles.investmentStatusChip}>
                <Text style={styles.investmentStatusChipText}>{investment.status}</Text>
              </View>
            </View>

            <View style={styles.statusBarTrack}>
              <View style={[styles.statusBarFill, { width: `${Math.round(investment.progress * 100)}%` }]} />
            </View>

            <View style={styles.investmentStatusGrid}>
              <View style={styles.investmentStatusCell}>
                <Text style={styles.receiptMetaLabel}>Invested</Text>
                <Text style={styles.receiptMetaValue}>{formatCurrency(investment.amount)}</Text>
              </View>
              <View style={styles.investmentStatusCell}>
                <Text style={styles.receiptMetaLabel}>Expected Profit</Text>
                <Text style={styles.receiptMetaValue}>{formatCurrency(expectedProfit)}</Text>
              </View>
              <View style={styles.investmentStatusCell}>
                <Text style={styles.receiptMetaLabel}>Earned</Text>
                <Text style={styles.receiptMetaValue}>{formatCurrency(investment.earned)}</Text>
              </View>
              <View style={styles.investmentStatusCell}>
                <Text style={styles.receiptMetaLabel}>Time Remaining</Text>
                <Text style={styles.receiptMetaValue}>{remainingDays} days</Text>
              </View>
            </View>

            <View style={{ marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
              <ReceiptStatusCard
                receipt={investment.receipt}
                investmentId={investment.id}
                amount={investment.amount}
                compact
              />
            </View>
          </SurfaceCard>
        );
      })}

      <GradientButton label="Open Invest Screen" onPress={() => router.push('/(tabs)/invest')} />
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  flexOne: {
    flex: 1,
  },
  dualGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  heroTitle: {
    fontFamily: fontFamily.heading,
    fontSize: 28,
    lineHeight: 34,
    color: '#FFFFFF',
  },
  heroSubtitle: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.82)',
  },
  metricStrip: {
    flexDirection: 'row',
    gap: 12,
  },
  metricStripItem: {
    flex: 1,
    borderRadius: radius.md,
    padding: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    gap: 4,
  },
  metricStripLabel: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    color: 'rgba(255,255,255,0.72)',
  },
  metricStripValue: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 18,
    color: '#FFFFFF',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  breakdownTitle: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  breakdownMeta: {
    marginTop: 4,
    fontFamily: fontFamily.body,
    fontSize: 12,
    color: colors.textSecondary,
  },
  breakdownValue: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 18,
    color: colors.cyan,
  },
  emptyText: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  receiptHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  receiptReference: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 16,
    color: '#FFFFFF',
  },
  receiptDate: {
    marginTop: 4,
    fontFamily: fontFamily.body,
    fontSize: 12,
    color: colors.textSecondary,
  },
  receiptBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  receiptBadgeSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
  },
  receiptBadgeDefault: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  receiptBadgeText: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 11,
    textTransform: 'capitalize',
  },
  receiptBadgeTextSuccess: {
    color: colors.successLight,
  },
  receiptBadgeTextDefault: {
    color: colors.cyan,
  },
  receiptAmountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  receiptTitle: {
    flex: 1,
    fontFamily: fontFamily.bodyBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  receiptAmount: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 17,
  },
  amountPositive: {
    color: colors.successLight,
  },
  amountDefault: {
    color: '#FFFFFF',
  },
  receiptMetaGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  receiptMetaCell: {
    flex: 1,
    borderRadius: radius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    gap: 4,
  },
  receiptMetaLabel: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11.5,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  receiptMetaValue: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 14,
    color: '#FFFFFF',
    textTransform: 'capitalize',
  },
  receiptNote: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  statusHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  statusHeroCopy: {
    flex: 1,
    gap: 6,
  },
  statusHeroPlan: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 22,
    color: '#FFFFFF',
  },
  statusHeroAmount: {
    fontFamily: fontFamily.heading,
    fontSize: 28,
    color: '#FFFFFF',
  },
  statusHeroMeta: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  investmentStatusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    alignItems: 'flex-start',
  },
  investmentStatusChip: {
    borderRadius: radius.pill,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  investmentStatusChipText: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 11,
    color: colors.cyan,
  },
  statusBarTrack: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  statusBarFill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.cyan,
  },
  investmentStatusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  investmentStatusCell: {
    width: '47%',
    borderRadius: radius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    gap: 4,
  },
});


