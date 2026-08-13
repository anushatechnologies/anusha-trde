import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
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
import { ReferralTree } from '../../components/team/referral-tree';
import { TransactionRow } from '../../components/transactions/transaction-row';
import { colors, fontFamily, gradients, radius } from '../../constants/theme';
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
  accent = colors.primary,
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
      {onPress ? <Text style={[styles.overviewAction, { color: accent }]}>Open details</Text> : null}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.overviewMetricPressable, pressed && styles.overviewMetricPressed]}
      android_ripple={{ color: `${accent}12` }}
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
  const isCompactHome = !isTablet && width < 380;
  const totalTeamMembers = data?.teamLevels.reduce((sum, level) => sum + level.members, 0) ?? 0;
  const homeMetricGap = 12;
  const homeMetricWidth = Math.max((width - horizontalPadding * 2 - homeMetricGap) / 2, 0);

  return (
    <AppScreen refreshing={isRefetching} onRefresh={() => void refetch()}>
      <ScreenHeader title="Anusha Trade" subtitle="Professional overview of your earning network." onRightPress={() => router.push('/notifications')} />

      {isLoading || !data ? (
        <>
          <SkeletonBlock height={150} />
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
          <FadeInView>
            <SurfaceCard gradient={gradients.primary}>
              <View style={[styles.heroRow, isCompactHome && styles.heroRowCompact]}>
                <View style={styles.heroCopy}>
                  <Text style={styles.heroEyebrow}>Build your wealth</Text>
                  <Text style={styles.heroTitle}>Grow Together</Text>
                  <Text style={styles.heroSubtitle}>Invest today, secure tomorrow, and scale your referral network with confidence.</Text>
                </View>
                <LinearGradient
                  colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.04)']}
                  style={[styles.heroIconBubble, isCompactHome && styles.heroIconBubbleCompact]}
                >
                  <MaterialCommunityIcons name="finance" size={54} color={colors.surface} />
                </LinearGradient>
              </View>
            </SurfaceCard>
          </FadeInView>

          <View style={styles.statsGrid}>
            <View style={[styles.statCardSlot, { width: homeMetricWidth }]}>
              <StatCard label="Wallet Balance" value={formatCurrency(data.metrics.walletBalance)} icon={<Ionicons name="wallet-outline" size={18} color={colors.primary} />} onPress={() => router.push('/(tabs)/wallet')} actionLabel="Open wallet" />
            </View>
            <View style={[styles.statCardSlot, { width: homeMetricWidth }]}>
              <StatCard label="Total Invested" value={formatCurrency(data.metrics.totalInvested)} icon={<Ionicons name="trending-up-outline" size={18} color={colors.success} />} accent={colors.success} onPress={() => router.push('/investment-status')} actionLabel="Track portfolio" />
            </View>
            <View style={[styles.statCardSlot, { width: homeMetricWidth }]}>
              <StatCard label="Referral Earnings" value={formatCurrency(data.metrics.referralEarnings)} icon={<Ionicons name="people-outline" size={18} color={colors.secondary} />} accent={colors.secondary} onPress={() => router.push('/referrals')} actionLabel="View referrals" />
            </View>
            <View style={[styles.statCardSlot, { width: homeMetricWidth }]}>
              <StatCard label="Active Team" value={`${data.metrics.activeTeamCount}`} icon={<Ionicons name="git-network-outline" size={18} color={colors.warning} />} accent={colors.warning} onPress={() => router.push('/(tabs)/team')} actionLabel="Open team" />
            </View>
          </View>

          <View style={styles.quickActions}>
            <View style={styles.quickActionSlot}>
              <GradientButton label="Invest Now" icon={<Ionicons name="add" size={18} color={colors.surface} />} compact onPress={() => router.push('/invest-apply')} />
            </View>
            <View style={styles.quickActionSlot}>
              <GradientButton label="Add Cash" variant="secondary" icon={<MaterialCommunityIcons name="wallet-plus-outline" size={18} color={colors.primary} />} compact onPress={() => router.push('/invest-apply')} />
            </View>
          </View>

          <ReferralLinkCard link={data.referralLink} />

          <SurfaceCard>
            <SectionTitle title="Team Overview" actionLabel="View All" onActionPress={() => router.push('/referrals')} />
            <View style={[styles.overviewRow, isCompactHome && styles.overviewRowCompact]}>
              <OverviewMetric label="Total Team" value={`${totalTeamMembers}`} onPress={() => router.push('/(tabs)/team')} />
              <OverviewMetric label="Active Team" value={`${data.metrics.activeTeamCount}`} onPress={() => router.push('/referral-tree')} accent={colors.warning} />
              <OverviewMetric label="Team Invest" value={formatCompactCurrency(data.metrics.totalTeamInvested)} onPress={() => router.push('/investment-status')} accent={colors.success} />
            </View>
          </SurfaceCard>

          <AnnouncementCarousel items={data.announcements} />

          <SurfaceCard>
            <SectionTitle title="Investment Progress" actionLabel="Status" onActionPress={() => router.push('/investment-status')} />
            <LineChart data={data.earningsSeries} />
            <Text style={styles.supportingText}>Monthly growth: {formatPercent(data.metrics.monthlyGrowth)}</Text>
          </SurfaceCard>

          <SurfaceCard>
            <SectionTitle title="Recent Earnings" actionLabel="Wallet" onActionPress={() => router.push('/transactions')} />
            {data.recentEarnings.slice(0, 3).map((item) => (
              <TransactionRow key={item.id} item={item} />
            ))}
          </SurfaceCard>
        </>
      )}

      {user ? (
        <SurfaceCard gradient={gradients.surface}>
          <View style={styles.profileSummaryRow}>
            <ProfileAvatar name={user.name} photoUrl={user.profilePhoto} size={52} borderRadius={18} />
            <View style={styles.profileSummaryCopy}>
              <Text style={styles.profileSummaryTitle}>{user.name}</Text>
              <Text style={styles.profileSummarySubtitle}>Member since {user.memberSince}</Text>
            </View>
            <GradientButton label="Profile" variant="secondary" compact onPress={() => router.push('/(tabs)/profile')} />
          </View>
        </SurfaceCard>
      ) : null}
    </AppScreen>
  );
};

export const InvestScreen = () => {
  const router = useRouter();
  const { data, isLoading } = useInvestmentsQuery();
  const calculatorAmount = useInvestmentStore((state) => state.calculatorAmount);
  const setCalculatorAmount = useInvestmentStore((state) => state.setCalculatorAmount);

  const selectedPlan = useMemo(() => {
    if (!data?.plans?.length) {
      return null;
    }

    return (
      data.plans.find((plan) => calculatorAmount >= plan.minInvestment && calculatorAmount <= plan.maxInvestment) ||
      data.plans[data.plans.length - 1]
    );
  }, [calculatorAmount, data?.plans]);

  const projectedDaily = selectedPlan ? (calculatorAmount * selectedPlan.roi) / 100 : 0;

  return (
    <AppScreen>
      <ScreenHeader title="Invest" subtitle="Choose premium plans and project your daily earnings." onRightPress={() => router.push('/notifications')} />

      <SurfaceCard gradient={gradients.primary}>
        <View style={styles.heroRow}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>Choose your investment plan</Text>
            <Text style={styles.heroSubtitle}>Grow your wealth with curated ROI plans, active returns, and clean profit forecasting.</Text>
          </View>
          <LinearGradient colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.04)']} style={styles.heroIconBubble}>
            <Ionicons name="trending-up-outline" size={54} color={colors.surface} />
          </LinearGradient>
        </View>
      </SurfaceCard>

      <SectionTitle title="Available Plans" />
      {isLoading || !data ? (
        <>
          <SkeletonBlock height={160} />
          <SkeletonBlock height={160} />
          <SkeletonBlock height={160} />
        </>
      ) : (
        data.plans.map((plan, index) => (
          <FadeInView key={plan.id} delay={index * 80}>
            <PlanCard plan={plan} onInvest={() => router.push({ pathname: '/invest-apply', params: { planId: plan.id } })} />
          </FadeInView>
        ))
      )}

      <SurfaceCard>
        <SectionTitle title="Investment Calculator" />
        <TextInput
          keyboardType="number-pad"
          value={String(calculatorAmount)}
          onChangeText={(value) => setCalculatorAmount(Number(value.replace(/[^0-9]/g, '')) || 0)}
          style={styles.amountInput}
        />
        <View style={styles.gridRow}>
          <View style={styles.calcMetric}>
            <Text style={styles.calcLabel}>Selected Plan</Text>
            <Text style={styles.calcValue}>{selectedPlan?.name || 'No plan selected'}</Text>
          </View>
          <View style={styles.calcMetric}>
            <Text style={styles.calcLabel}>Daily Estimate</Text>
            <Text style={styles.calcValue}>{formatCurrency(projectedDaily)}</Text>
          </View>
        </View>
        <LineChart data={data?.projectionSeries || []} height={150} />
      </SurfaceCard>

      <SurfaceCard>
        <SectionTitle title="Active Investments" />
        {(data?.activeInvestments || []).map((item) => (
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
              <Text style={styles.progressMetaText}>{Math.round(item.progress * 100)}%</Text>
            </View>
          </View>
        ))}
      </SurfaceCard>

      <ListRow icon="pulse-outline" title="Monthly Interest" subtitle="Projected interest and credited returns" onPress={() => router.push('/monthly-interest')} />
      <ListRow icon="pie-chart-outline" title="Investment Status" subtitle="Progress, maturity, and expected returns" onPress={() => router.push('/investment-status')} />
    </AppScreen>
  );
};

export const TeamScreen = () => {
  const router = useRouter();
  const { data, isLoading } = useTeamQuery();
  const [expandedLevel, setExpandedLevel] = useState<number | null>(1);

  return (
    <AppScreen>
      <ScreenHeader title="Team" subtitle="Track your team hierarchy, commissions, and network growth." onRightPress={() => router.push('/notifications')} />

      <SurfaceCard gradient={gradients.primary}>
        <View style={styles.heroRow}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroTitle}>Total Team</Text>
            <Text style={styles.heroSubtitle}>6 levels, active commissions, and leadership visibility at a glance.</Text>
          </View>
          <LinearGradient colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.04)']} style={styles.heroIconBubble}>
            <Ionicons name="git-network-outline" size={50} color={colors.surface} />
          </LinearGradient>
        </View>
      </SurfaceCard>

      <View style={styles.gridRow}>
        <StatCard
          label="Total Members"
          value={`${data?.totalMembers || 0}`}
          icon={<Ionicons name="people-outline" size={18} color={colors.primary} />}
        />
        <StatCard
          label="Active Members"
          value={`${data?.activeMembers || 0}`}
          icon={<Ionicons name="person-add-outline" size={18} color={colors.success} />}
          accent={colors.success}
        />
      </View>

      <SurfaceCard>
        <SectionTitle title="Tree Visualization" />
        {isLoading || !data ? <SkeletonBlock height={360} /> : <ReferralTree levels={data.tree} />}
      </SurfaceCard>

      <SurfaceCard>
        <SectionTitle title="Commission Structure" actionLabel="Referrals" onActionPress={() => router.push('/referrals')} />
        {(data?.levels || []).map((level) => (
          <Pressable key={level.level} onPress={() => setExpandedLevel((value) => (value === level.level ? null : level.level))}>
            <View style={styles.levelRow}>
              <View>
                <Text style={styles.levelTitle}>Level {level.level}</Text>
                <Text style={styles.levelMeta}>{level.members} members</Text>
              </View>
              <View style={styles.levelRight}>
                <Text style={styles.levelAmount}>{formatCurrency(level.earnings)}</Text>
                <Text style={styles.levelCommission}>{formatPercent(level.commission)}</Text>
              </View>
            </View>
            {expandedLevel === level.level ? (
              <Text style={styles.levelDetail}>
                Growth {formatPercent(level.growth)} this week with {level.members} members producing {formatCurrency(level.earnings)} in commissions.
              </Text>
            ) : null}
          </Pressable>
        ))}
      </SurfaceCard>

      <ListRow icon="git-network-outline" title="Referral Tree Screen" subtitle="Open the full hierarchy and earnings view" onPress={() => router.push('/referral-tree')} />
      <GradientButton label="View Referral Center" onPress={() => router.push('/referrals')} />
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

      <SurfaceCard gradient={gradients.primary}>
        <View style={styles.walletHeroRow}>
          <View style={styles.heroCopy}>
            <Text style={styles.heroEyebrow}>Wallet Balance</Text>
            <Text style={styles.walletAmount}>{formatCurrency(data?.balance || 0)}</Text>
            <Text style={styles.heroSubtitle}>Available balance {formatCurrency(data?.availableBalance || 0)}</Text>
          </View>
          <MaterialCommunityIcons name="wallet-outline" size={64} color={colors.surface} />
        </View>
      </SurfaceCard>

      <View style={styles.actionGrid}>
        <Pressable style={styles.walletAction} onPress={() => router.push('/invest-apply')}>
          <View style={styles.walletActionIcon}>
            <Ionicons name="add" size={20} color={colors.surface} />
          </View>
          <Text style={styles.walletActionLabel}>Add Money</Text>
        </Pressable>
        <Pressable style={styles.walletAction} onPress={() => router.push('/withdraw')}>
          <View style={styles.walletActionIcon}>
            <Ionicons name="arrow-up" size={20} color={colors.surface} />
          </View>
          <Text style={styles.walletActionLabel}>Withdraw</Text>
        </Pressable>
        <Pressable style={styles.walletAction} onPress={() => router.push('/transactions')}>
          <View style={styles.walletActionIcon}>
            <Ionicons name="list" size={20} color={colors.surface} />
          </View>
          <Text style={styles.walletActionLabel}>Transactions</Text>
        </Pressable>
      </View>

      <ListRow icon="time-outline" title="Withdrawal History" subtitle="Processed and pending payout requests" onPress={() => router.push('/withdrawal-history')} />
      <ListRow icon="receipt-outline" title="Payment Receipts" subtitle="Download-ready references for every wallet movement" onPress={() => router.push('/payment-receipts')} />
      <ListRow icon="stats-chart-outline" title="Monthly Interest" subtitle="Review wallet-linked earnings trend and return projections" onPress={() => router.push('/monthly-interest')} />

      <SurfaceCard>
        <SectionTitle title="Earnings Analytics" />
        {isLoading || !data ? <SkeletonBlock height={160} /> : <LineChart data={data.analytics} />}
      </SurfaceCard>

      <SurfaceCard>
        <SectionTitle title="Transaction Filters" />
        <View style={styles.filterRow}>
          {(['all', 'credited', 'debited', 'processing'] as const).map((item) => (
            <Pressable key={item} onPress={() => setFilter(item)} style={[styles.filterChip, filter === item && styles.filterChipActive]}>
              <Text style={[styles.filterChipText, filter === item && styles.filterChipTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </View>
      </SurfaceCard>

      <SurfaceCard>
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
        <SurfaceCard>
          <Text style={styles.supportingText}>Profile data becomes available after authentication.</Text>
        </SurfaceCard>
      </AppScreen>
    );
  }

  const displayName = formatProfileValue(user.name, user.email || user.mobile || 'Your account');
  const contactSummary = joinProfileDetails(user.email, user.mobile);
  const memberSince = formatProfileValue(user.memberSince, 'Not available yet');
  const bankSummary = formatProfileValue(user.bankMask, 'No verified bank account linked');
  const referralCode = formatProfileValue(user.referralCode, 'Not generated yet');
  const kycStatusMap: Record<string, { label: string; tag: string }> = {
    APPROVED: { label: 'Verified', tag: 'Approved' },
    PENDING: { label: 'In Review', tag: 'In Review' },
    REUPLOAD_REQUIRED: { label: 'Reupload Requested', tag: 'Reupload' },
    REJECTED: { label: 'Reupload Requested', tag: 'Reupload' },
    NOT_SUBMITTED: { label: 'Pending Upload', tag: 'Pending' },
  };
  const kycInfo = kycStatusMap[user.kycStatus] ?? kycStatusMap.NOT_SUBMITTED;
  const kycStatus = kycInfo.label;
  const kycStatusTag = kycInfo.tag;
  const emailLabel = formatProfileValue(user.email, 'Email not added');
  const mobileLabel = formatProfileValue(user.mobile, 'Mobile number not added');
  const isCompactProfile = width < 420;
  const stackProfileStats = width < 390;

  return (
    <AppScreen>
      <ScreenHeader title="Profile" subtitle="Manage verification, banking, security, and support." onRightPress={() => router.push('/notifications')} />

      <SurfaceCard style={styles.profileCard}>
        <View style={[styles.profileHeaderRow, isCompactProfile && styles.profileHeaderRowCompact]}>
          <View style={styles.profileIdentityGroup}>
            <ProfileAvatar name={displayName} photoUrl={user.profilePhoto} size={52} borderRadius={16} variant="gradient" />
            <View style={styles.profileHeadCopy}>
              <Text style={[styles.profileName, isCompactProfile && styles.profileNameCompact]} numberOfLines={1}>
                {displayName}
              </Text>
              <Text style={styles.profileId} numberOfLines={1}>
                {emailLabel}
              </Text>
              <Text style={styles.profileId} numberOfLines={1}>
                {mobileLabel}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => router.push('/personal-info')}
            style={({ pressed }) => [styles.profileManageChip, pressed && styles.profileManageChipPressed]}
          >
            <Text style={styles.profileManageChipLabel}>Manage</Text>
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
            <Text style={styles.profileMetaValue} numberOfLines={1}>
              {kycStatusTag}
            </Text>
          </View>
        </View>
      </SurfaceCard>

      <View style={[styles.gridRow, stackProfileStats && styles.gridRowCompact]}>
        <Pressable
          onPress={() => router.push('/personal-info')}
          style={({ pressed }) => [styles.flexOne, stackProfileStats && styles.profileMiniPressableCompact, styles.profileMiniPressable, pressed && styles.profileMiniPressed]}
        >
          <SurfaceCard gradient={gradients.dark} style={styles.profileMiniCard}>
            <View style={styles.profileMiniTopRow}>
              <Text style={styles.profileMiniLabel}>Member Since</Text>
              <Ionicons name="arrow-forward" size={14} color="rgba(255,255,255,0.82)" />
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
          <SurfaceCard gradient={gradients.success} style={styles.profileMiniCard}>
            <View style={styles.profileMiniTopRow}>
              <Text style={styles.profileMiniLabel}>KYC Status</Text>
              <Ionicons name="arrow-forward" size={14} color="rgba(255,255,255,0.82)" />
            </View>
            <Text style={styles.profileMiniValue}>{kycStatus}</Text>
            <View style={styles.profileMiniFooter}>
              <Text style={styles.profileMiniHint}>Banking details</Text>
            </View>
          </SurfaceCard>
        </Pressable>
      </View>

      <ListRow icon="person-outline" title="Personal Information" subtitle={contactSummary} onPress={() => router.push('/personal-info')} />
      <ListRow icon="document-text-outline" title="KYC Documents" subtitle="Review uploaded identity and bank proofs" onPress={() => router.push('/kyc-documents')} />
      <ListRow icon="card-outline" title="Bank Details" subtitle={bankSummary} trailing={kycStatusTag} onPress={() => router.push('/bank-details')} />
      <ListRow icon="shield-checkmark-outline" title="Security Center" subtitle="2FA, biometrics, and alerts" onPress={() => router.push('/security-center')} />
      <ListRow icon="notifications-outline" title="Notification Settings" subtitle="Alerts and preferences" onPress={() => router.push('/settings')} />
      <ListRow icon="people-outline" title="Referral System" subtitle="Code, link, and commission summary" onPress={() => router.push('/referrals')} />
      <ListRow icon="git-network-outline" title="Referral Tree" subtitle="See your team structure level by level" onPress={() => router.push('/referral-tree')} />
      <ListRow icon="phone-portrait-outline" title="Device Tracking" subtitle="Trusted devices and sessions" onPress={() => router.push('/devices')} />
      <ListRow icon="time-outline" title="Active Sessions" subtitle="Recent login history" onPress={() => router.push('/sessions')} />
      <ListRow icon="pie-chart-outline" title="Investment Status" subtitle="Monitor active plans, progress, and maturity" onPress={() => router.push('/investment-status')} />
      <ListRow icon="receipt-outline" title="Payment Receipts" subtitle="Review payment and withdrawal proof" onPress={() => router.push('/payment-receipts')} />
      <ListRow icon="information-circle-outline" title="About Anusha Trade" subtitle="Support, policies, and app info" onPress={() => router.push('/settings')} />

      <GradientButton
        label="Logout"
        variant="danger"
        onPress={async () => {
          await signOut();
          router.replace('/(auth)/login');
        }}
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
  tabletGrid: {
    alignItems: 'stretch',
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
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 8,
  },
  quickActionSlot: {
    flex: 1,
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
    fontSize: 12,
    color: 'rgba(255,255,255,0.74)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroTitle: {
    fontFamily: fontFamily.heading,
    fontSize: 28,
    lineHeight: 34,
    color: colors.surface,
  },
  heroSubtitle: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.82)',
  },
  heroIconBubble: {
    width: 96,
    height: 96,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroRowCompact: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  heroIconBubbleCompact: {
    width: 82,
    height: 82,
    borderRadius: 24,
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
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  overviewValue: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 20,
    color: colors.text,
  },
  overviewLabel: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    color: colors.muted,
  },
  overviewAction: {
    marginTop: 4,
    fontFamily: fontFamily.bodyBold,
    fontSize: 11,
  },
  supportingText: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    color: colors.muted,
  },
  profileSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 18,
    color: colors.primary,
  },
  profileSummaryCopy: {
    flex: 1,
    gap: 4,
  },
  profileSummaryTitle: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 18,
    color: colors.text,
  },
  profileSummarySubtitle: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    color: colors.muted,
  },
  amountInput: {
    minHeight: 56,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    fontFamily: fontFamily.headingSemi,
    fontSize: 20,
    color: colors.text,
  },
  calcMetric: {
    flex: 1,
    gap: 6,
  },
  calcLabel: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    color: colors.muted,
  },
  calcValue: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 18,
    color: colors.text,
  },
  activeInvestmentCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    padding: 16,
    gap: 10,
  },
  activeInvestmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  activeInvestmentTitle: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 18,
    color: colors.text,
  },
  activeInvestmentSubtitle: {
    marginTop: 4,
    fontFamily: fontFamily.body,
    fontSize: 12,
    color: colors.muted,
  },
  activeInvestmentAmount: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 18,
    color: colors.primary,
  },
  progressTrack: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: '#DBEAFE',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  progressMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressMetaText: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    color: colors.muted,
  },
  levelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  levelTitle: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 15,
    color: colors.text,
  },
  levelMeta: {
    marginTop: 4,
    fontFamily: fontFamily.body,
    fontSize: 12,
    color: colors.muted,
  },
  levelRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  levelAmount: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 14,
    color: colors.text,
  },
  levelCommission: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 12,
    color: colors.primary,
  },
  levelDetail: {
    paddingBottom: 10,
    fontFamily: fontFamily.body,
    fontSize: 12,
    lineHeight: 18,
    color: colors.muted,
  },
  walletHeroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletAmount: {
    fontFamily: fontFamily.heading,
    fontSize: 32,
    color: colors.surface,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  walletAction: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    gap: 10,
  },
  walletActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletActionLabel: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 12,
    color: colors.text,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterChip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  filterChipActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#DBEAFE',
  },
  filterChipText: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    color: colors.muted,
    textTransform: 'capitalize',
  },
  filterChipTextActive: {
    color: colors.primary,
  },
  profileCard: {
    padding: 12,
    gap: 10,
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
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 20,
    color: colors.surface,
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
    color: colors.text,
  },
  profileNameCompact: {
    fontSize: 16,
    lineHeight: 20,
  },
  profileId: {
    fontFamily: fontFamily.body,
    fontSize: 11,
    lineHeight: 16,
    color: colors.muted,
  },
  profileManageChip: {
    minHeight: 38,
    minWidth: 92,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileManageChipPressed: {
    opacity: 0.92,
  },
  profileManageChipLabel: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 13,
    color: colors.primary,
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
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 2,
  },
  profileMetaLabel: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  profileMetaValue: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 13,
    color: colors.text,
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
    color: colors.surface,
  },
  profileMiniValue: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 14,
    lineHeight: 20,
    color: colors.surface,
  },
  profileMiniFooter: {
    paddingTop: 2,
  },
  profileMiniHint: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 10,
    color: 'rgba(255,255,255,0.82)',
  },
});
