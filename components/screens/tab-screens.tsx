import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { FadeInView } from '../../animations/fade-in-view';
import { LineChart } from '../../components/charts/line-chart';
import { AnnouncementCarousel } from '../../components/dashboard/announcement-carousel';
import { ReferralLinkCard } from '../../components/dashboard/referral-link-card';
import { PlanCard } from '../../components/investments/plan-card';
import { KycGateModal } from '../../components/kyc/kyc-gate-modal';
import { ReferralTree } from '../../components/team/referral-tree';
import { TransactionRow } from '../../components/transactions/transaction-row';
import { colors, fontFamily, gradients, radius, shadows } from '../../constants/theme';
import { useDashboardQuery, useInvestmentsQuery, useTeamQuery, useWalletQuery } from '../../hooks/use-app-queries';
import { useAuthStore } from '../../store/use-auth-store';
import { useInvestmentStore } from '../../store/use-investment-store';
import { useWalletStore } from '../../store/use-wallet-store';
import { formatCompactCurrency, formatCurrency, formatPercent } from '../../utils/format';
import { useResponsive } from '../../utils/responsive';
import { AppScreen } from '../ui/app-screen';
import { GradientButton } from '../ui/gradient-button';
import { ListRow } from '../ui/list-row';
import { ProfileAvatar } from '../ui/profile-avatar';
import { ScreenHeader } from '../ui/screen-header';
import { SectionTitle } from '../ui/section-title';
import { SkeletonBlock } from '../ui/skeleton-block';
import { StatCard } from '../ui/stat-card';
import { SurfaceCard } from '../ui/surface-card';

const OverviewMetric = ({
  label,
  value,
  onPress,
  accent = colors.cyan,
}: {
  label: string;
  value: string;
  onPress?: () => void;
  accent?: string;
}) => {
  const content = (
    <View style={[styles.overviewMetric, onPress && styles.overviewMetricInteractive]}>
      <Text style={styles.overviewValue}>{value}</Text>
      <Text style={styles.overviewLabel}>{label}</Text>
      {onPress ? <Text style={[styles.overviewAction, { color: accent }]}>View &gt;</Text> : null}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.overviewMetricPressable, pressed && styles.overviewMetricPressed]}
      android_ripple={{ color: `${accent}18` }}
    >
      {content}
    </Pressable>
  );
};

const formatProfileValue = (value: string | undefined, fallback: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
};

const joinProfileDetails = (...values: string[]) => {
  const parts = values.map((value) => value.trim()).filter(Boolean);
  return parts.length ? parts.join(' | ') : 'No contact details added yet';
};

export const HomeScreen = () => {
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useDashboardQuery();
  const { isTablet, width, horizontalPadding } = useResponsive();
  const user = useAuthStore((state) => state.user);
  const [showBalance, setShowBalance] = useState(true);
  const [kycGateVisible, setKycGateVisible] = useState(false);

  const handleInvestPress = () => {
    if (user?.kycStatus === 'APPROVED') {
      router.push('/invest-apply');
    } else {
      setKycGateVisible(true);
    }
  };

  const totalTeamMembers = data?.teamLevels?.reduce((sum, level) => sum + level.members, 0) ?? 0;
  const homeMetricGap = 12;
  const homeMetricWidth = Math.max((width - horizontalPadding * 2 - homeMetricGap) / 2, 0);
  const isCompactHome = !isTablet && width < 380;

  return (
    <AppScreen refreshing={isRefetching} onRefresh={() => void refetch()}>
      {/* Top Greeting & User Profile Bar */}
      <View style={styles.dashboardHeaderRow}>
        <View style={styles.dashboardUserLead}>
          <ProfileAvatar name={user?.name || 'Investor'} photoUrl={user?.profilePhoto} size={46} borderRadius={16} variant="gradient" />
          <View style={styles.dashboardUserCopy}>
            <Text style={styles.dashboardGreeting}>Welcome back,</Text>
            <Text style={styles.dashboardUserName}>{user?.name || 'Investor'}</Text>
          </View>
        </View>
        <Pressable
          onPress={() => router.push('/notifications')}
          style={({ pressed }) => [styles.notificationBtn, pressed && styles.notificationBtnPressed]}
        >
          <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
          <View style={styles.notificationDot} />
        </Pressable>
      </View>

      {isLoading || !data ? (
        <>
          <SkeletonBlock height={180} />
          <View style={styles.statsGrid}>
            <SkeletonBlock height={138} style={{ width: homeMetricWidth }} />
            <SkeletonBlock height={138} style={{ width: homeMetricWidth }} />
            <SkeletonBlock height={138} style={{ width: homeMetricWidth }} />
            <SkeletonBlock height={138} style={{ width: homeMetricWidth }} />
          </View>
          <SkeletonBlock height={120} />
          <SkeletonBlock height={210} />
        </>
      ) : (
        <>
          {/* Glassmorphic Portfolio Hero Card */}
          <FadeInView>
            <SurfaceCard glass="dark" style={styles.portfolioHeroCard}>
              <LinearGradient
                colors={['#1E293B', '#0F172A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.portfolioGlowOrb} />

              <View style={styles.portfolioTopRow}>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.portfolioLabel}>TOTAL PORTFOLIO & WALLET</Text>
                    <Pressable onPress={() => setShowBalance(!showBalance)} hitSlop={8}>
                      <Ionicons
                        name={showBalance ? 'eye-outline' : 'eye-off-outline'}
                        size={15}
                        color={colors.cyan}
                      />
                    </Pressable>
                  </View>
                  <Text style={styles.portfolioBalance}>
                    {showBalance ? formatCurrency(data.metrics.walletBalance) : '••••••••'}
                  </Text>
                </View>
                <View style={styles.growthBadge}>
                  <Ionicons name="trending-up" size={13} color={colors.successLight} />
                  <Text style={styles.growthBadgeText}>+{formatPercent(data.metrics.monthlyGrowth || 12.5)}</Text>
                </View>
              </View>

              <View style={styles.portfolioMetricsDivider} />

              {/* 4 Fast Action Pills */}
              <View style={styles.quickActionPillRow}>
                <Pressable onPress={handleInvestPress} style={styles.actionPill}>
                  <View style={[styles.actionPillIconWrap, { backgroundColor: 'rgba(56, 189, 248, 0.18)', borderColor: 'rgba(56, 189, 248, 0.35)' }]}>
                    <Ionicons name="rocket-outline" size={20} color={colors.cyan} />
                  </View>
                  <Text style={styles.actionPillText}>Invest</Text>
                </Pressable>

                <Pressable onPress={handleInvestPress} style={styles.actionPill}>
                  <View style={[styles.actionPillIconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.18)', borderColor: 'rgba(52, 211, 153, 0.35)' }]}>
                    <Ionicons name="wallet-outline" size={20} color={colors.successLight} />
                  </View>
                  <Text style={styles.actionPillText}>Add Cash</Text>
                </Pressable>

                <Pressable onPress={() => router.push('/withdraw')} style={styles.actionPill}>
                  <View style={[styles.actionPillIconWrap, { backgroundColor: 'rgba(245, 158, 11, 0.18)', borderColor: 'rgba(251, 191, 36, 0.35)' }]}>
                    <Ionicons name="arrow-up-outline" size={20} color={colors.warningLight} />
                  </View>
                  <Text style={styles.actionPillText}>Withdraw</Text>
                </Pressable>

                <Pressable onPress={() => router.push('/referrals')} style={styles.actionPill}>
                  <View style={[styles.actionPillIconWrap, { backgroundColor: 'rgba(168, 85, 247, 0.18)', borderColor: 'rgba(192, 132, 252, 0.35)' }]}>
                    <Ionicons name="people-outline" size={20} color="#C084FC" />
                  </View>
                  <Text style={styles.actionPillText}>Refer</Text>
                </Pressable>
              </View>
            </SurfaceCard>
          </FadeInView>

          {/* 2x2 Stat Cards Grid */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCardSlot, { width: homeMetricWidth }]}>
              <StatCard
                label="Total Invested"
                value={formatCurrency(data.metrics.totalInvested)}
                icon={<Ionicons name="trending-up-outline" size={18} color={colors.cyan} />}
                onPress={() => router.push('/investment-status')}
                actionLabel="Track portfolio"
              />
            </View>
            <View style={[styles.statCardSlot, { width: homeMetricWidth }]}>
              <StatCard
                label="Referral Earnings"
                value={formatCurrency(data.metrics.referralEarnings)}
                icon={<Ionicons name="gift-outline" size={18} color={colors.successLight} />}
                accent={colors.successLight}
                onPress={() => router.push('/referrals')}
                actionLabel="View referrals"
              />
            </View>
            <View style={[styles.statCardSlot, { width: homeMetricWidth }]}>
              <StatCard
                label="Active Team"
                value={`${data.metrics.activeTeamCount}`}
                icon={<Ionicons name="people-outline" size={18} color="#C084FC" />}
                accent="#C084FC"
                onPress={() => router.push('/(tabs)/team')}
                actionLabel="Open team"
              />
            </View>
            <View style={[styles.statCardSlot, { width: homeMetricWidth }]}>
              <StatCard
                label="Monthly Growth"
                value={formatPercent(data.metrics.monthlyGrowth || 12.5)}
                icon={<Ionicons name="pie-chart-outline" size={18} color={colors.warningLight} />}
                accent={colors.warningLight}
                onPress={() => router.push('/monthly-interest')}
                actionLabel="View interest"
              />
            </View>
          </View>

          {/* Referral Card */}
          <ReferralLinkCard link={data.referralLink} />

          {/* Team Overview Card */}
          <SurfaceCard glass="dark">
            <SectionTitle title="Team Network" actionLabel="View All" onActionPress={() => router.push('/referrals')} />
            <View style={[styles.overviewRow, isCompactHome && styles.overviewRowCompact]}>
              <OverviewMetric label="Total Team" value={`${totalTeamMembers}`} onPress={() => router.push('/(tabs)/team')} />
              <OverviewMetric label="Active Team" value={`${data.metrics.activeTeamCount}`} onPress={() => router.push('/referral-tree')} accent={colors.warningLight} />
              <OverviewMetric label="Team Invest" value={formatCompactCurrency(data.metrics.totalTeamInvested)} onPress={() => router.push('/investment-status')} accent={colors.successLight} />
            </View>
          </SurfaceCard>

          {/* Announcements */}
          <AnnouncementCarousel items={data.announcements} />

          {/* Earnings Analytics Line Chart */}
          <SurfaceCard glass="dark">
            <SectionTitle title="Portfolio Growth" actionLabel="Status" onActionPress={() => router.push('/investment-status')} />
            <LineChart data={data.earningsSeries} />
            <Text style={styles.supportingText}>Live yield calculated on daily active investments.</Text>
          </SurfaceCard>

          {/* Recent Activity */}
          <SurfaceCard glass="dark">
            <SectionTitle title="Recent Earnings" actionLabel="History" onActionPress={() => router.push('/transactions')} />
            {data.recentEarnings.slice(0, 4).map((item) => (
              <TransactionRow key={item.id} item={item} />
            ))}
          </SurfaceCard>
        </>
      )}

      <KycGateModal
        visible={kycGateVisible}
        onClose={() => setKycGateVisible(false)}
        kycStatus={user?.kycStatus}
        onProceedInvest={() => router.push('/invest-apply')}
      />
    </AppScreen>
  );
};

export const InvestScreen = () => {
  const router = useRouter();
  const { data, isLoading } = useInvestmentsQuery();
  const user = useAuthStore((state) => state.user);
  const calculatorAmount = useInvestmentStore((state) => state.calculatorAmount);
  const setCalculatorAmount = useInvestmentStore((state) => state.setCalculatorAmount);

  const [kycGateVisible, setKycGateVisible] = useState(false);
  const [selectedInvestPlanId, setSelectedInvestPlanId] = useState<string | undefined>();
  const [selectedInvestPlanName, setSelectedInvestPlanName] = useState<string | undefined>();

  const PRESET_AMOUNTS = [5000, 10000, 25000, 50000, 100000];

  const selectedPlan = useMemo(() => {
    if (!data?.plans?.length) {
      return null;
    }

    return (
      data.plans.find((plan) => calculatorAmount >= plan.minInvestment && calculatorAmount <= plan.maxInvestment) ||
      data.plans[data.plans.length - 1]
    );
  }, [calculatorAmount, data?.plans]);

  const planRoi = selectedPlan?.roi || 1.5;
  const planDuration = selectedPlan?.termDays || 180;
  const projectedDaily = (calculatorAmount * planRoi) / 100;
  const projectedWeekly = projectedDaily * 7;
  const projectedMonthly = projectedDaily * 30;
  const totalMaturityProfit = projectedDaily * planDuration;
  const totalMaturityPayout = totalMaturityProfit + calculatorAmount;

  const openPlanWithKycStatus = (planId?: string, planName?: string) => {
    setSelectedInvestPlanId(planId);
    setSelectedInvestPlanName(planName);
    if (user?.kycStatus === 'APPROVED') {
      router.push({ pathname: '/invest-apply', params: { planId: planId || '' } });
    } else {
      setKycGateVisible(true);
    }
  };

  return (
    <AppScreen>
      <ScreenHeader title="Invest" subtitle="Choose premium plans and project your daily earnings." onRightPress={() => router.push('/notifications')} />

      {/* Hero Banner */}
      <SurfaceCard glass="dark" style={styles.investHeroCard}>
        <LinearGradient
          colors={['#1E293B', '#0F172A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.heroRow}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>Premium Yield Plans</Text>
            <Text style={styles.heroSubtitle}>Grow your wealth with curated daily ROI plans, automated wallet payouts, and 100% capital security.</Text>
          </View>
          <View style={styles.heroIconBubble}>
            <Ionicons name="trending-up-outline" size={40} color={colors.cyan} />
          </View>
        </View>
      </SurfaceCard>

      {/* Available Plans */}
      <SectionTitle title="Available Investment Plans" />
      {isLoading || !data ? (
        <>
          <SkeletonBlock height={160} />
          <SkeletonBlock height={160} />
          <SkeletonBlock height={160} />
        </>
      ) : (
        data.plans.map((plan, index) => (
          <FadeInView key={plan.id} delay={index * 80}>
            <PlanCard
              plan={plan}
              onInvest={() => openPlanWithKycStatus(plan.id, plan.name)}
            />
          </FadeInView>
        ))
      )}

      {/* Interactive ROI Calculator */}
      <SurfaceCard glass="dark">
        <SectionTitle title="Interactive ROI Calculator" />
        <Text style={styles.calcHelper}>Select or enter investment amount (₹):</Text>

        {/* Quick Amount Chips */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 8 }}>
          {PRESET_AMOUNTS.map((amt) => {
            const isSelected = calculatorAmount === amt;
            return (
              <Pressable
                key={amt}
                onPress={() => setCalculatorAmount(amt)}
                style={({ pressed }) => [
                  {
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: radius.pill,
                    backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.2)' : '#0F172A',
                    borderWidth: 1,
                    borderColor: isSelected ? colors.cyan : 'rgba(255, 255, 255, 0.12)',
                  },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text
                  style={{
                    fontFamily: fontFamily.bodyBold,
                    fontSize: 12,
                    color: isSelected ? colors.cyan : colors.textSecondary,
                  }}
                >
                  ₹{amt.toLocaleString('en-IN')}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Amount Input */}
        <TextInput
          keyboardType="number-pad"
          value={String(calculatorAmount || '')}
          onChangeText={(value) => setCalculatorAmount(Number(value.replace(/[^0-9]/g, '')) || 0)}
          style={styles.amountInput}
          placeholder="5000"
          placeholderTextColor={colors.textSecondary}
        />

        {/* 4-Metric Projection Matrix */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginVertical: 10 }}>
          <View style={{ width: '48%', flexGrow: 1, backgroundColor: '#0F172A', borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)', padding: 12 }}>
            <Text style={styles.calcLabel}>Daily Profit ({planRoi}%)</Text>
            <Text style={[styles.calcValue, { color: colors.successLight }]}>+{formatCurrency(projectedDaily)}</Text>
          </View>

          <View style={{ width: '48%', flexGrow: 1, backgroundColor: '#0F172A', borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)', padding: 12 }}>
            <Text style={styles.calcLabel}>Weekly Profit</Text>
            <Text style={[styles.calcValue, { color: colors.cyan }]}>+{formatCurrency(projectedWeekly)}</Text>
          </View>

          <View style={{ width: '48%', flexGrow: 1, backgroundColor: '#0F172A', borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)', padding: 12 }}>
            <Text style={styles.calcLabel}>Monthly Profit</Text>
            <Text style={[styles.calcValue, { color: colors.warningLight }]}>+{formatCurrency(projectedMonthly)}</Text>
          </View>

          <View style={{ width: '48%', flexGrow: 1, backgroundColor: '#0F172A', borderRadius: radius.md, borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.3)', padding: 12 }}>
            <Text style={styles.calcLabel}>Total at Maturity</Text>
            <Text style={[styles.calcValue, { color: '#FFFFFF' }]}>{formatCurrency(totalMaturityPayout)}</Text>
          </View>
        </View>

        {/* Projected Growth Curve */}
        <LineChart data={data?.projectionSeries || []} height={150} />

        {/* Instant Invest Button */}
        <GradientButton
          label={`Invest ${formatCurrency(calculatorAmount || 0)} Now`}
          icon={<Ionicons name="rocket-outline" size={18} color="#FFFFFF" />}
          onPress={() => openPlanWithKycStatus(selectedPlan?.id, selectedPlan?.name)}
        />
      </SurfaceCard>

      <KycGateModal
        visible={kycGateVisible}
        onClose={() => setKycGateVisible(false)}
        kycStatus={user?.kycStatus}
        planName={selectedInvestPlanName}
        onProceedInvest={() => {
          if (selectedInvestPlanId) {
            router.push({ pathname: '/invest-apply', params: { planId: selectedInvestPlanId } });
          }
        }}
      />

      {/* Active Investments */}
      <SurfaceCard glass="dark">
        <SectionTitle title="Active Investments" />
        {(data?.activeInvestments || []).length ? (
          (data?.activeInvestments || []).map((item) => (
            <View key={item.id} style={styles.activeInvestmentCard}>
              <View style={styles.activeInvestmentHeader}>
                <View>
                  <Text style={styles.activeInvestmentTitle}>{item.planName}</Text>
                  <Text style={styles.activeInvestmentSubtitle}>Next payout: {item.nextPayout}</Text>
                </View>
                <Text style={styles.activeInvestmentAmount}>{formatCurrency(item.amount)}</Text>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${item.progress * 100}%` }]} />
              </View>
              <View style={styles.progressMetaRow}>
                <Text style={styles.progressMetaText}>Earned {formatCurrency(item.earned)}</Text>
                <Text style={[styles.progressMetaText, { color: colors.cyan }]}>{Math.round(item.progress * 100)}%</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.supportingText}>No active investments currently running.</Text>
        )}
      </SurfaceCard>

      <ListRow icon="pulse-outline" title="Monthly Interest" subtitle="Projected interest and credited returns" onPress={() => router.push('/monthly-interest')} />
      <ListRow icon="pie-chart-outline" title="Investment Status" subtitle="Progress, maturity, and expected returns" onPress={() => router.push('/investment-status')} />
    </AppScreen>
  );
};

const DEFAULT_6_LEVEL_RATES: { level: number; commission: number; label: string }[] = [
  { level: 1, commission: 10, label: 'Direct Sponsor' },
  { level: 2, commission: 5, label: 'Tier 2 Partner' },
  { level: 3, commission: 3, label: 'Tier 3 Partner' },
  { level: 4, commission: 2, label: 'Tier 4 Network' },
  { level: 5, commission: 1, label: 'Tier 5 Network' },
  { level: 6, commission: 0.5, label: 'Tier 6 Extended' },
];

export const TeamScreen = () => {
  const router = useRouter();
  const { data, isLoading } = useTeamQuery();
  const { data: dashboardData } = useDashboardQuery();
  const [expandedLevel, setExpandedLevel] = useState<number | null>(1);

  const displayLevels = useMemo(() => {
    const serverLevels = data?.levels || [];
    return DEFAULT_6_LEVEL_RATES.map((def) => {
      const match = serverLevels.find((l) => l.level === def.level);
      return {
        level: def.level,
        label: def.label,
        commission: match?.commission ?? def.commission,
        members: match?.members ?? 0,
        earnings: match?.earnings ?? 0,
        growth: match?.growth ?? 0,
      };
    });
  }, [data?.levels]);

  const totalTeamInvested = dashboardData?.metrics?.totalTeamInvested || 0;

  return (
    <AppScreen>
      <ScreenHeader title="Team Network" subtitle="Track your 6-level team hierarchy, commissions, and network growth." onRightPress={() => router.push('/notifications')} />

      {/* Hero Card */}
      <SurfaceCard glass="dark" style={styles.teamHeroCard}>
        <LinearGradient
          colors={['#1E293B', '#0F172A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.heroRow}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>6-Level Referral Network</Text>
            <Text style={styles.heroSubtitle}>Multi-tier commission tracking up to 10% direct sponsor bonus and daily team volume overrides.</Text>
          </View>
          <View style={styles.heroIconBubble}>
            <Ionicons name="git-network-outline" size={40} color="#C084FC" />
          </View>
        </View>
      </SurfaceCard>

      {/* 3-Metric Stat Strip */}
      <View style={styles.gridRow}>
        <StatCard
          label="Total Members"
          value={`${data?.totalMembers || 0}`}
          icon={<Ionicons name="people-outline" size={18} color={colors.cyan} />}
        />
        <StatCard
          label="Active Directs"
          value={`${data?.activeMembers || 0}`}
          icon={<Ionicons name="person-add-outline" size={18} color={colors.successLight} />}
          accent={colors.successLight}
        />
      </View>

      {totalTeamInvested > 0 ? (
        <SurfaceCard glass="dark">
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={{ fontFamily: fontFamily.bodySemi, fontSize: 12, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>Total Team Investment Volume</Text>
              <Text style={{ fontFamily: fontFamily.heading, fontSize: 22, color: '#FFFFFF', marginTop: 2 }}>{formatCurrency(totalTeamInvested)}</Text>
            </View>
            <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(56, 189, 248, 0.15)', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="shield-checkmark-outline" size={22} color={colors.cyan} />
            </View>
          </View>
        </SurfaceCard>
      ) : null}

      {/* Referral Link & Share Card */}
      {dashboardData?.referralLink ? (
        <ReferralLinkCard link={dashboardData.referralLink} />
      ) : null}

      {/* Tree Visualization */}
      <SurfaceCard glass="dark">
        <SectionTitle title="Network Tree Hierarchy" actionLabel="Full Tree" onActionPress={() => router.push('/referral-tree')} />
        {isLoading || !data ? <SkeletonBlock height={360} /> : <ReferralTree levels={data.tree} />}
      </SurfaceCard>

      {/* 6-Level Commission Breakdown */}
      <SurfaceCard glass="dark">
        <SectionTitle title="6-Level Commission Structure" actionLabel="Referrals" onActionPress={() => router.push('/referrals')} />
        {displayLevels.map((level) => {
          const isExpanded = expandedLevel === level.level;
          return (
            <Pressable
              key={level.level}
              onPress={() => setExpandedLevel((value) => (value === level.level ? null : level.level))}
              style={({ pressed }) => [{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.06)' }, pressed && { opacity: 0.8 }]}
            >
              <View style={styles.levelRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(56, 189, 248, 0.12)', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontFamily: fontFamily.headingSemi, fontSize: 14, color: colors.cyan }}>L{level.level}</Text>
                  </View>
                  <View>
                    <Text style={styles.levelTitle}>{level.label}</Text>
                    <Text style={styles.levelMeta}>{level.members} registered members</Text>
                  </View>
                </View>
                <View style={styles.levelRight}>
                  <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', borderWidth: 1, borderColor: 'rgba(52, 211, 153, 0.35)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill }}>
                    <Text style={{ fontFamily: fontFamily.bodyBold, fontSize: 12, color: colors.successLight }}>{formatPercent(level.commission)}</Text>
                  </View>
                  <Text style={[styles.levelAmount, { fontSize: 12, color: colors.textSecondary }]}>{formatCurrency(level.earnings)} earned</Text>
                </View>
              </View>
              {isExpanded ? (
                <View style={{ marginTop: 8, padding: 10, borderRadius: radius.sm, backgroundColor: '#0F172A', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.06)' }}>
                  <Text style={styles.levelDetail}>
                    Level {level.level} generates a recurring {formatPercent(level.commission)} commission payout on every investment created by team members in this tier.
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </SurfaceCard>

      <ListRow icon="git-network-outline" title="Full Tree Screen" subtitle="Open the pan-and-zoom hierarchy view" onPress={() => router.push('/referral-tree')} />
      <GradientButton label="Open Referral Center" onPress={() => router.push('/referrals')} />
    </AppScreen>
  );
};

export const WalletScreen = () => {
  const router = useRouter();
  const { data, isLoading } = useWalletQuery();
  const filter = useWalletStore((state) => state.filter);
  const setFilter = useWalletStore((state) => state.setFilter);

  const filteredTransactions = useMemo(() => {
    const source = data?.transactions || [];
    if (filter === 'all') {
      return source;
    }

    return source.filter((item) => item.status === filter);
  }, [data?.transactions, filter]);

  return (
    <AppScreen>
      <ScreenHeader title="Wallet" subtitle="Balance, payment methods, and recent transaction activity." onRightPress={() => router.push('/notifications')} />

      <SurfaceCard glass="dark" style={styles.walletHeroCard}>
        <LinearGradient
          colors={['#1E293B', '#0F172A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.walletHeroRow}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>WALLET BALANCE</Text>
            <Text style={styles.walletAmount}>{formatCurrency(data?.balance || 0)}</Text>
            <Text style={styles.heroSubtitle}>Available to withdraw: {formatCurrency(data?.availableBalance || 0)}</Text>
          </View>
          <MaterialCommunityIcons name="wallet-outline" size={56} color={colors.cyan} />
        </View>
      </SurfaceCard>

      <View style={styles.actionGrid}>
        <Pressable style={styles.walletAction} onPress={() => router.push('/invest-apply')}>
          <View style={[styles.walletActionIcon, { backgroundColor: 'rgba(56, 189, 248, 0.18)' }]}>
            <Ionicons name="add" size={22} color={colors.cyan} />
          </View>
          <Text style={styles.walletActionLabel}>Add Money</Text>
        </Pressable>
        <Pressable style={styles.walletAction} onPress={() => router.push('/withdraw')}>
          <View style={[styles.walletActionIcon, { backgroundColor: 'rgba(245, 158, 11, 0.18)' }]}>
            <Ionicons name="arrow-up" size={22} color={colors.warningLight} />
          </View>
          <Text style={styles.walletActionLabel}>Withdraw</Text>
        </Pressable>
        <Pressable style={styles.walletAction} onPress={() => router.push('/transactions')}>
          <View style={[styles.walletActionIcon, { backgroundColor: 'rgba(168, 85, 247, 0.18)' }]}>
            <Ionicons name="list" size={22} color="#C084FC" />
          </View>
          <Text style={styles.walletActionLabel}>Passbook</Text>
        </Pressable>
      </View>

      <ListRow icon="time-outline" title="Withdrawal History" subtitle="Processed and pending payout requests" onPress={() => router.push('/withdrawal-history')} />
      <ListRow icon="receipt-outline" title="Payment Receipts" subtitle="Download-ready references for every wallet movement" onPress={() => router.push('/payment-receipts')} />
      <ListRow icon="stats-chart-outline" title="Monthly Interest" subtitle="Review wallet-linked earnings trend and return projections" onPress={() => router.push('/monthly-interest')} />

      <SurfaceCard glass="dark">
        <SectionTitle title="Earnings Analytics" />
        {isLoading || !data ? <SkeletonBlock height={160} /> : <LineChart data={data.analytics} />}
      </SurfaceCard>

      <SurfaceCard glass="dark">
        <SectionTitle title="Transaction Filters" />
        <View style={styles.filterRow}>
          {(['all', 'credited', 'debited', 'processing'] as const).map((item) => (
            <Pressable key={item} onPress={() => setFilter(item)} style={[styles.filterChip, filter === item && styles.filterChipActive]}>
              <Text style={[styles.filterChipText, filter === item && styles.filterChipTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </View>
      </SurfaceCard>

      <SurfaceCard glass="dark">
        <SectionTitle title="Recent Transactions" actionLabel="View All" onActionPress={() => router.push('/transactions')} />
        {filteredTransactions.map((item) => (
          <TransactionRow key={item.id} item={item} />
        ))}
      </SurfaceCard>
    </AppScreen>
  );
};

export const ProfileScreen = () => {
  const router = useRouter();
  const { width } = useResponsive();
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);

  if (!user) {
    return (
      <AppScreen>
        <SurfaceCard glass="dark">
          <Text style={styles.supportingText}>Profile data becomes available after authentication.</Text>
        </SurfaceCard>
      </AppScreen>
    );
  }

  const displayName = formatProfileValue(user.name, user.email || user.mobile || 'Investor');
  const contactSummary = joinProfileDetails(user.email, user.mobile);
  const memberSince = formatProfileValue(user.memberSince, '2026');
  const bankSummary = formatProfileValue(user.bankMask, 'No bank linked');
  const referralCode = formatProfileValue(user.referralCode, 'ANUSHA01');
  const kycStatusMap: Record<string, { label: string; tag: string }> = {
    APPROVED: { label: 'Verified', tag: 'Approved' },
    PENDING: { label: 'In Review', tag: 'In Review' },
    REUPLOAD_REQUIRED: { label: 'Reupload Required', tag: 'Reupload' },
    REJECTED: { label: 'Reupload Required', tag: 'Reupload' },
    NOT_SUBMITTED: { label: 'Pending Upload', tag: 'Pending' },
  };
  const kycInfo = kycStatusMap[user.kycStatus] ?? kycStatusMap.NOT_SUBMITTED;
  const kycStatus = kycInfo.label;
  const kycStatusTag = kycInfo.tag;
  const isCompactProfile = width < 420;
  const stackProfileStats = width < 390;

  const handleWhatsAppSupport = () => {
    try {
      void Linking.openURL('https://wa.me/919999999999?text=Hello%20Anusha%20Trade%20Support,%20I%20need%20assistance.');
    } catch {
      Alert.alert('Support', 'Please contact support at support@anushatrade.com');
    }
  };

  const handleConfirmLogout = () => {
    Alert.alert(
      'Confirm Logout',
      'Are you sure you want to securely log out from Anusha Trade on this device?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  return (
    <AppScreen>
      <ScreenHeader title="Profile" subtitle="Manage verification, banking, security, and VIP support." onRightPress={() => router.push('/notifications')} />

      {/* Main Profile Identity Card */}
      <SurfaceCard glass="dark" style={styles.profileCard}>
        <View style={[styles.profileHeaderRow, isCompactProfile && styles.profileHeaderRowCompact]}>
          <View style={styles.profileIdentityGroup}>
            <ProfileAvatar name={displayName} photoUrl={user.profilePhoto} size={56} borderRadius={18} variant="gradient" />
            <View style={styles.profileHeadCopy}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.profileName, isCompactProfile && styles.profileNameCompact]} numberOfLines={1}>
                  {displayName}
                </Text>
                {user.kycStatus === 'APPROVED' ? (
                  <Ionicons name="checkmark-circle" size={16} color={colors.successLight} />
                ) : null}
              </View>
              <Text style={styles.profileId} numberOfLines={1}>
                {user.mobile ? `+91 ${user.mobile.replace(/\D/g, '').slice(-10)}` : 'Mobile verified'}
              </Text>
              <Text style={[styles.profileId, { color: colors.cyan, fontFamily: fontFamily.bodySemi }]} numberOfLines={1}>
                {user.levelTitle || 'Platinum Verified Investor'}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => router.push('/personal-info')}
            style={({ pressed }) => [styles.profileManageChip, pressed && styles.profileManageChipPressed]}
          >
            <Text style={styles.profileManageChipLabel}>Edit</Text>
          </Pressable>
        </View>
        <View style={[styles.profileMetaRow, isCompactProfile && styles.profileMetaRowCompact]}>
          <View style={styles.profileMetaChip}>
            <Text style={styles.profileMetaLabel}>Referral Code</Text>
            <Text style={styles.profileMetaValue} numberOfLines={1}>
              {referralCode}
            </Text>
          </View>
          <View style={styles.profileMetaChip}>
            <Text style={styles.profileMetaLabel}>KYC Status</Text>
            <Text style={[styles.profileMetaValue, { color: user.kycStatus === 'APPROVED' ? colors.successLight : colors.warningLight }]} numberOfLines={1}>
              {kycStatusTag}
            </Text>
          </View>
        </View>
      </SurfaceCard>

      {/* Quick Summary Strip */}
      <View style={[styles.gridRow, stackProfileStats && styles.gridRowCompact]}>
        <Pressable
          onPress={() => router.push('/personal-info')}
          style={({ pressed }) => [styles.flexOne, stackProfileStats && styles.profileMiniPressableCompact, styles.profileMiniPressable, pressed && styles.profileMiniPressed]}
        >
          <SurfaceCard glass="dark" style={styles.profileMiniCard}>
            <View style={styles.profileMiniTopRow}>
              <Text style={styles.profileMiniLabel}>Member Since</Text>
              <Ionicons name="arrow-forward" size={14} color="rgba(255,255,255,0.7)" />
            </View>
            <Text style={styles.profileMiniValue}>{memberSince}</Text>
            <View style={styles.profileMiniFooter}>
              <Text style={styles.profileMiniHint}>Personal details</Text>
            </View>
          </SurfaceCard>
        </Pressable>
        <Pressable
          onPress={() => router.push('/bank-details')}
          style={({ pressed }) => [styles.flexOne, stackProfileStats && styles.profileMiniPressableCompact, styles.profileMiniPressable, pressed && styles.profileMiniPressed]}
        >
          <SurfaceCard glass="dark" style={styles.profileMiniCard}>
            <View style={styles.profileMiniTopRow}>
              <Text style={styles.profileMiniLabel}>Bank & KYC</Text>
              <Ionicons name="arrow-forward" size={14} color="rgba(255,255,255,0.7)" />
            </View>
            <Text style={[styles.profileMiniValue, { color: user.kycStatus === 'APPROVED' ? colors.successLight : colors.warningLight }]}>{kycStatus}</Text>
            <View style={styles.profileMiniFooter}>
              <Text style={styles.profileMiniHint}>Banking details</Text>
            </View>
          </SurfaceCard>
        </Pressable>
      </View>

      {/* Financials & Identity Section */}
      <SectionTitle title="Financials & KYC" />
      <ListRow icon="person-outline" title="Personal Information" subtitle={contactSummary} onPress={() => router.push('/personal-info')} />
      <ListRow icon="document-text-outline" title="KYC Verification Documents" subtitle="Government identity proofs and verification status" trailing={kycStatusTag} onPress={() => router.push('/kyc-documents')} />
      <ListRow icon="card-outline" title="Linked Bank Accounts" subtitle={bankSummary} onPress={() => router.push('/bank-details')} />
      <ListRow icon="pie-chart-outline" title="Investment Portfolio Status" subtitle="Active plan progress, maturity dates, and returns" onPress={() => router.push('/investment-status')} />
      <ListRow icon="receipt-outline" title="Payment Receipts & Passbook" subtitle="Official receipts and deposit audit records" onPress={() => router.push('/payment-receipts')} />

      {/* Security & Access Section */}
      <SectionTitle title="Security & Authentication" />
      <ListRow icon="shield-checkmark-outline" title="Security Center" subtitle="Biometric Face ID, 2FA, and device monitoring" onPress={() => router.push('/security-center')} />
      <ListRow icon="key-outline" title="Manage MPIN" subtitle="Configure the 4-digit quick security PIN" onPress={() => router.push('/manage-mpin')} />
      <ListRow icon="notifications-outline" title="Notification Preferences" subtitle="Push alerts and earnings notifications" onPress={() => router.push('/settings')} />
      <ListRow icon="phone-portrait-outline" title="Active Devices & Sessions" subtitle="Review trusted hardware and active logins" onPress={() => router.push('/sessions')} />

      {/* Support & Legal Section */}
      <SectionTitle title="Support & Legal" />
      <ListRow icon="logo-whatsapp" title="24/7 VIP WhatsApp Support" subtitle="Chat live with dedicated wealth concierge" onPress={handleWhatsAppSupport} />
      <ListRow icon="shield-outline" title="Terms & Conditions" subtitle="Platform rules and investment agreements" onPress={() => router.push('/terms')} />
      <ListRow icon="lock-closed-outline" title="Privacy Policy" subtitle="Data encryption and investor protection policy" onPress={() => router.push('/privacy')} />

      {/* Danger Logout Button */}
      <GradientButton
        label="Logout Securely"
        variant="danger"
        icon={<Ionicons name="log-out-outline" size={18} color="#FFFFFF" />}
        onPress={handleConfirmLogout}
      />
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  gridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  gridRowCompact: {
    flexDirection: 'column',
  },
  flexOne: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCardSlot: {
    minWidth: 0,
  },
  dashboardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    marginBottom: 4,
  },
  dashboardUserLead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dashboardUserCopy: {
    gap: 2,
  },
  dashboardGreeting: {
    fontFamily: fontFamily.body,
    fontSize: 12.5,
    color: colors.cyan,
  },
  dashboardUserName: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 18,
    color: '#FFFFFF',
  },
  notificationBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glass,
  },
  notificationBtnPressed: {
    backgroundColor: '#1E293B',
    transform: [{ scale: 0.96 }],
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.cyan,
  },
  portfolioHeroCard: {
    padding: 20,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    backgroundColor: '#0F172A',
    ...shadows.card,
  },
  investHeroCard: {
    padding: 20,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    backgroundColor: '#0F172A',
    ...shadows.card,
  },
  teamHeroCard: {
    padding: 20,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    backgroundColor: '#0F172A',
    ...shadows.card,
  },
  walletHeroCard: {
    padding: 20,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    backgroundColor: '#0F172A',
    ...shadows.card,
  },
  portfolioGlowOrb: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
  },
  portfolioTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  portfolioLabel: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.cyan,
    textTransform: 'uppercase',
  },
  portfolioBalance: {
    marginTop: 4,
    fontFamily: fontFamily.heading,
    fontSize: 32,
    lineHeight: 38,
    color: '#FFFFFF',
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  growthBadgeText: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 12,
    color: colors.successLight,
  },
  portfolioMetricsDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 18,
  },
  quickActionPillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  actionPill: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  actionPillIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    ...shadows.glass,
  },
  actionPillText: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    color: '#E2E8F0',
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  heroCopy: {
    flex: 1,
    gap: 6,
  },
  heroEyebrow: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 11,
    color: colors.cyan,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  heroTitle: {
    fontFamily: fontFamily.heading,
    fontSize: 24,
    lineHeight: 30,
    color: '#FFFFFF',
  },
  heroSubtitle: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  heroIconBubble: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glow,
  },
  overviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'stretch',
    gap: 10,
  },
  overviewRowCompact: {
    flexWrap: 'wrap',
  },
  overviewMetricPressable: {
    flex: 1,
    minWidth: 0,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  overviewMetricPressed: {
    opacity: 0.9,
  },
  overviewMetric: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  overviewMetricInteractive: {
    minHeight: 94,
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 12,
    ...shadows.glass,
  },
  overviewValue: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 20,
    color: '#FFFFFF',
  },
  overviewLabel: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    color: colors.textSecondary,
  },
  overviewAction: {
    marginTop: 4,
    fontFamily: fontFamily.bodyBold,
    fontSize: 11,
  },
  supportingText: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 6,
  },
  calcHelper: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  amountInput: {
    minHeight: 56,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    fontFamily: fontFamily.headingSemi,
    fontSize: 20,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  calcMetric: {
    flex: 1,
    gap: 4,
    backgroundColor: '#0F172A',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    marginBottom: 12,
  },
  calcLabel: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  calcValue: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 17,
    color: '#FFFFFF',
  },
  activeInvestmentCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#0F172A',
    padding: 16,
    gap: 10,
    marginBottom: 10,
    ...shadows.glass,
  },
  activeInvestmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  activeInvestmentTitle: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 17,
    color: '#FFFFFF',
  },
  activeInvestmentSubtitle: {
    marginTop: 4,
    fontFamily: fontFamily.body,
    fontSize: 12,
    color: colors.textSecondary,
  },
  activeInvestmentAmount: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 18,
    color: colors.cyan,
  },
  progressTrack: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.cyan,
  },
  progressMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressMetaText: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    color: colors.textSecondary,
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  levelTitle: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  levelMeta: {
    marginTop: 3,
    fontFamily: fontFamily.body,
    fontSize: 12,
    color: colors.textSecondary,
  },
  levelRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  levelAmount: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  levelCommission: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 12,
    color: colors.cyan,
  },
  levelDetail: {
    paddingVertical: 8,
    fontFamily: fontFamily.body,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  },
  walletHeroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletAmount: {
    fontFamily: fontFamily.heading,
    fontSize: 32,
    color: '#FFFFFF',
    marginTop: 4,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  walletAction: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    gap: 10,
    ...shadows.glass,
  },
  walletActionIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  walletActionLabel: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: '#0F172A',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  filterChipActive: {
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
    borderColor: colors.cyan,
  },
  filterChipText: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  filterChipTextActive: {
    color: colors.cyan,
  },
  profileCard: {
    padding: 16,
    gap: 12,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  profileHeaderRowCompact: {
    alignItems: 'stretch',
  },
  profileIdentityGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },
  profileHeadCopy: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  profileName: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 18,
    lineHeight: 22,
    color: '#FFFFFF',
  },
  profileNameCompact: {
    fontSize: 16,
    lineHeight: 20,
  },
  profileId: {
    fontFamily: fontFamily.body,
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.textSecondary,
  },
  profileManageChip: {
    minHeight: 36,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileManageChipPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  profileManageChipLabel: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 12.5,
    color: colors.cyan,
  },
  profileMetaRow: {
    flexDirection: 'row',
    gap: 10,
  },
  profileMetaRowCompact: {
    flexDirection: 'column',
  },
  profileMetaChip: {
    flex: 1,
    minWidth: 0,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#080D1A',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 2,
  },
  profileMetaLabel: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 10.5,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  profileMetaValue: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  profileMiniPressable: {
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  profileMiniPressableCompact: {
    width: '100%',
  },
  profileMiniPressed: {
    opacity: 0.94,
  },
  profileMiniCard: {
    flex: 1,
    minHeight: 102,
    padding: 14,
    gap: 6,
    justifyContent: 'space-between',
  },
  profileMiniTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  profileMiniLabel: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  profileMiniValue: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 15,
    lineHeight: 20,
    color: '#FFFFFF',
  },
  profileMiniFooter: {
    paddingTop: 2,
  },
  profileMiniHint: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    color: colors.cyan,
  },
});
