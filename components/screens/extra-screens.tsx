import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View, ActivityIndicator } from 'react-native';

import { LineChart } from '../../components/charts/line-chart';
import { ReferralLinkCard } from '../../components/dashboard/referral-link-card';
import { TransactionRow } from '../../components/transactions/transaction-row';
import { colors, fontFamily, gradients, radius } from '../../constants/theme';
import { queryKeys, useDashboardQuery, useNotificationsQuery, useSessionsQuery, useTeamQuery } from '../../hooks/use-app-queries';
import { dashboardService } from '../../services/dashboard.service';
import { bankService } from '../../services/bank.service';
import { getAuthErrorMessage } from '../../services/firebase-auth.service';
import { notificationPermissionsService } from '../../services/notification-permissions.service';
import { useAppStore } from '../../store/use-app-store';
import { useAuthStore } from '../../store/use-auth-store';
import { useNotificationStore } from '../../store/use-notification-store';
import { useWalletStore } from '../../store/use-wallet-store';
import { formatCurrency, formatPercent } from '../../utils/format';
import { AppScreen } from '../ui/app-screen';
import { GradientButton } from '../ui/gradient-button';
import { ListRow } from '../ui/list-row';
import { ProfileAvatar } from '../ui/profile-avatar';
import { ScreenHeader } from '../ui/screen-header';
import { SectionTitle } from '../ui/section-title';
import { SurfaceCard } from '../ui/surface-card';
import { ToggleRow } from '../ui/toggle-row';

const formatProfileValue = (value: string | undefined, fallback: string) => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
};

const joinProfileDetails = (...values: string[]) => {
  const parts = values.map((value) => value.trim()).filter(Boolean);
  return parts.length ? parts.join(' | ') : 'No contact details added yet';
};

const formatStatusValue = (value: boolean, activeLabel: string, inactiveLabel: string) =>
  value ? activeLabel : inactiveLabel;

export const NotificationsScreen = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isLoading } = useNotificationsQuery();
  const items = useNotificationStore((state) => state.items);
  const markAllRead = useNotificationStore((state) => state.markAllRead);
  const markRead = useNotificationStore((state) => state.markRead);
  const unreadIds = items.filter((item) => !item.read).map((item) => item.id);
  const readMutation = useMutation({
    mutationFn: (notificationId: string) => dashboardService.markNotificationRead(notificationId),
    onSuccess: async (_, notificationId) => {
      markRead(notificationId);
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    },
    onError: (error) => {
      Alert.alert('Notification update failed', getAuthErrorMessage(error));
    },
  });
  const readAllMutation = useMutation({
    mutationFn: (notificationIds: string[]) => Promise.all(notificationIds.map((notificationId) => dashboardService.markNotificationRead(notificationId))),
    onSuccess: async () => {
      markAllRead();
      await queryClient.invalidateQueries({ queryKey: queryKeys.notifications });
    },
    onError: (error) => {
      Alert.alert('Notification update failed', getAuthErrorMessage(error));
    },
  });

  const handleMarkAllRead = () => {
    if (!unreadIds.length || readAllMutation.isPending) {
      return;
    }

    readAllMutation.mutate(unreadIds);
  };

  return (
    <AppScreen>
      <ScreenHeader title="Notifications" subtitle="Real-time alerts for earnings, investments, referrals, and security." onBackPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))} />
      <SurfaceCard gradient={gradients.primary}>
        <Text style={styles.heroTitle}>Notification Center</Text>
        <Text style={styles.heroSubtitle}>Unread alerts: {items.filter((item) => !item.read).length}</Text>
        <GradientButton
          label={readAllMutation.isPending ? 'Updating...' : 'Mark All Read'}
          variant="secondary"
          onPress={handleMarkAllRead}
          compact
        />
      </SurfaceCard>

      {isLoading ? (
        <SurfaceCard>
          <Text style={styles.supportingText}>Loading alerts...</Text>
        </SurfaceCard>
      ) : !items.length ? (
        <SurfaceCard>
          <Text style={styles.supportingText}>No notifications yet.</Text>
        </SurfaceCard>
      ) : (
        items.map((item) => (
          <Pressable key={item.id} onPress={() => (!item.read ? readMutation.mutate(item.id) : undefined)}>
            <SurfaceCard>
              <View style={styles.notificationRow}>
                <View style={[styles.notificationDot, item.read && styles.notificationDotRead]} />
                <View style={styles.notificationCopy}>
                  <Text style={styles.notificationTitle}>{item.title}</Text>
                  <Text style={styles.notificationDescription}>{item.description}</Text>
                </View>
                <Text style={styles.notificationTime}>{item.time}</Text>
              </View>
            </SurfaceCard>
          </Pressable>
        ))
      )}
    </AppScreen>
  );
};

export const PersonalInformationScreen = () => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return (
      <AppScreen>
        <ScreenHeader title="Personal Information" subtitle="Review the main identity details linked to this account." onBackPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'))} />
        <SurfaceCard>
          <Text style={styles.supportingText}>No authenticated profile is available right now.</Text>
        </SurfaceCard>
      </AppScreen>
    );
  }

  const displayName = formatProfileValue(user.name, user.mobile || 'Your account');
  const mobile = user.mobile ? `+91 ${user.mobile.replace(/\D/g, '').slice(-10)}` : 'Mobile number not added';
  const dateOfBirth = formatProfileValue(user.dateOfBirth, 'Not added yet');
  const profilePhotoStatus = user.profilePhoto?.trim() ? 'Added to account' : 'Not added yet';
  const referralCode = formatProfileValue(user.referralCode, 'Not generated yet');
  const memberSince = formatProfileValue(user.memberSince, 'Not available yet');
  const accountLevel = formatProfileValue(user.levelTitle, 'Verified Investor');
  const panNumber = formatProfileValue(user.panNumber, 'Not added yet');
  const aadhaarMasked = formatProfileValue(user.aadhaarMasked, 'Not added yet');
  const mpinStatus = formatStatusValue(user.mpinConfigured, 'Active (4-digit MPIN)', 'Not configured');
  const biometricStatus = formatStatusValue(user.biometricEnabled, 'Enabled on this device', 'Not enabled');

  const fields = [
    { label: 'Full Name', value: displayName },
    { label: 'Registered Mobile', value: mobile },
    { label: 'Date of Birth', value: dateOfBirth },
    { label: 'PAN Number', value: panNumber },
    { label: 'Aadhaar (Last 4)', value: aadhaarMasked },
    { label: 'Profile Photo', value: profilePhotoStatus },
    { label: 'Referral Code', value: referralCode },
    { label: 'Member Since', value: memberSince },
    { label: 'Account Tier', value: accountLevel },
    { label: 'MPIN Security', value: mpinStatus },
    { label: 'Biometric Access', value: biometricStatus },
  ];

  return (
    <AppScreen>
      <ScreenHeader title="Personal Information" subtitle="Review your contact details, referral identity, and account profile." onBackPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'))} />

      <SurfaceCard gradient={gradients.primary}>
        <View style={styles.profileHeroRow}>
          <ProfileAvatar name={displayName} photoUrl={user.profilePhoto} size={68} borderRadius={22} />
          <View style={styles.profileHeroCopy}>
            <Text style={styles.heroTitle}>{displayName}</Text>
            <Text style={styles.heroSubtitle}>{mobile}</Text>
          </View>
        </View>
      </SurfaceCard>

      <SurfaceCard>
        {fields.map((field, index) => (
          <View key={field.label} style={[styles.detailField, index === fields.length - 1 && styles.detailFieldLast]}>
            <Text style={styles.detailFieldLabel}>{field.label}</Text>
            <Text style={styles.detailFieldValue}>{field.value}</Text>
          </View>
        ))}
      </SurfaceCard>

      <ListRow icon="shield-checkmark-outline" title="Security Center" subtitle="Protect this account and review sign-in security" onPress={() => router.push('/security-center')} />
      <ListRow icon="notifications-outline" title="Notification Settings" subtitle="Manage alerts linked to this profile" onPress={() => router.push('/settings')} />
    </AppScreen>
  );
};

export const BankDetailsScreen = () => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const bankQuery = useQuery({
    queryKey: ['bank-details'],
    queryFn: bankService.getBankDetails,
    enabled: Boolean(user),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!bankQuery.data) {
      return;
    }

    void updateUser({
      bankMask: bankQuery.data.accountNumberMasked === 'No bank account linked'
        ? user?.bankMask || ''
        : bankQuery.data.accountNumberMasked,
      accountHolderName: bankQuery.data.accountHolderName || user?.accountHolderName || '',
      bankName: bankQuery.data.bankName || user?.bankName || '',
      ifscCode: bankQuery.data.ifscCode || user?.ifscCode || '',
      bankVerified: bankQuery.data.bankVerified ?? user?.bankVerified ?? false,
    });
  }, [bankQuery.data, updateUser, user?.accountHolderName, user?.bankName, user?.bankMask, user?.bankVerified, user?.ifscCode]);

  if (!user) {
    return (
      <AppScreen>
        <ScreenHeader title="Bank Details" subtitle="Review linked bank and verification status for withdrawals." onBackPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'))} />
        <SurfaceCard>
          <Text style={styles.supportingText}>No authenticated profile is available right now.</Text>
        </SurfaceCard>
      </AppScreen>
    );
  }

  const bankMask = formatProfileValue(
    bankQuery.data?.accountNumberMasked === 'No bank account linked' ? user.bankMask : bankQuery.data?.accountNumberMasked || user.bankMask,
    bankQuery.isLoading ? 'Loading bank details...' : 'No verified bank account linked'
  );
  const accountHolderName = formatProfileValue(
    bankQuery.data?.accountHolderName || user.accountHolderName,
    bankQuery.isLoading ? 'Loading bank details...' : 'Not added yet'
  );
  const ifscCode = formatProfileValue(
    bankQuery.data?.ifscCode || user.ifscCode,
    bankQuery.isLoading ? 'Loading bank details...' : 'Not added yet'
  );
  const memberSince = formatProfileValue(user.memberSince, 'Not available yet');
  const kycStatus = user.kycStatus === 'APPROVED' ? 'APPROVED' : 'PENDING';
  const hasLinkedBank = Boolean(bankQuery.data?.accountNumberMasked && bankQuery.data.accountNumberMasked !== 'No bank account linked') || Boolean(user.bankMask.trim());
  const withdrawalAccess = hasLinkedBank && user.kycStatus === 'APPROVED'
    ? 'Ready for withdrawals'
    : 'Unavailable until bank linking and verification are complete';

  const fields = [
    { label: 'Account Holder Name', value: accountHolderName },
    { label: 'Linked Account', value: bankMask },
    { label: 'IFSC Code', value: ifscCode },
    { label: 'KYC Status', value: kycStatus },
    { label: 'Withdrawal Access', value: withdrawalAccess },
    { label: 'Profile Activated', value: memberSince },
  ];

  return (
    <AppScreen>
      <ScreenHeader title="Bank Details" subtitle="Review linked bank and verification status for withdrawals." onBackPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'))} />

      <SurfaceCard gradient={gradients.primary}>
        <Text style={styles.heroTitle}>Bank & Verification</Text>
        <Text style={styles.heroSubtitle}>{bankMask}</Text>
      </SurfaceCard>

      <SurfaceCard>
        {fields.map((field, index) => (
          <View key={field.label} style={[styles.detailField, index === fields.length - 1 && styles.detailFieldLast]}>
            <Text style={styles.detailFieldLabel}>{field.label}</Text>
            <Text style={styles.detailFieldValue}>{field.value}</Text>
          </View>
        ))}
      </SurfaceCard>

      <GradientButton label={hasLinkedBank ? 'Open Withdraw' : 'Open Settings'} onPress={() => router.push(hasLinkedBank ? '/withdraw' : '/settings')} />
      <ListRow icon="shield-checkmark-outline" title="Security Center" subtitle="Review protection and account verification settings" onPress={() => router.push('/security-center')} />
    </AppScreen>
  );
};

export const SecurityCenterScreen = () => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const setBiometricEnabled = useAuthStore((state) => state.setBiometricEnabled);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [autoLogout, setAutoLogout] = useState(true);
  const [isBiometricUpdating, setIsBiometricUpdating] = useState(false);

  const handleBiometricToggle = async (value: boolean) => {
    if (isBiometricUpdating) {
      return;
    }

    if (!value) {
      setIsBiometricUpdating(true);

      try {
        await setBiometricEnabled(false);
        Alert.alert('Biometric disabled', 'Fingerprint or Face ID login has been turned off for this device.');
      } catch (error) {
        Alert.alert('Biometric update failed', getAuthErrorMessage(error));
      } finally {
        setIsBiometricUpdating(false);
      }

      return;
    }

    setIsBiometricUpdating(true);

    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();

      if (!hasHardware) {
        Alert.alert('Biometric unavailable', 'This device does not support fingerprint or Face ID authentication.');
        return;
      }

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!isEnrolled) {
        Alert.alert('Biometric unavailable', 'Set up fingerprint or Face ID in your device settings first.');
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Enable biometric login',
        fallbackLabel: 'Use device passcode',
      });

      if (!result.success) {
        return;
      }

      await setBiometricEnabled(true);
      Alert.alert('Biometric enabled', 'Fingerprint or Face ID login is now ready from the login screen.');
    } catch (error) {
      Alert.alert('Biometric update failed', getAuthErrorMessage(error));
    } finally {
      setIsBiometricUpdating(false);
    }
  };

  return (
    <AppScreen>
      <ScreenHeader title="Security Center" subtitle="Control active sessions, 2FA, biometrics, and account protection." onBackPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'))} />

      <SurfaceCard gradient={gradients.primary}>
        <Text style={styles.heroTitle}>Security shield active</Text>
        <Text style={styles.heroSubtitle}>Face ID, fingerprint login, and session monitoring are ready for this account.</Text>
      </SurfaceCard>

      <ToggleRow
        title="Face ID / Fingerprint Login"
        subtitle="Use local device authentication before opening the dashboard."
        value={Boolean(user?.biometricEnabled)}
        onValueChange={(value) => void handleBiometricToggle(value)}
      />
      <ToggleRow
        title="Two Factor Authentication"
        subtitle="Require secure verification before sensitive actions."
        value={twoFactorEnabled}
        onValueChange={setTwoFactorEnabled}
      />
      <ToggleRow
        title="Login Alerts"
        subtitle="Send an immediate alert whenever a new session is detected."
        value={loginAlerts}
        onValueChange={setLoginAlerts}
      />
      <ToggleRow
        title="Auto Logout"
        subtitle="Automatically end sessions after inactivity to reduce risk."
        value={autoLogout}
        onValueChange={setAutoLogout}
      />

      <ListRow
        icon="key-outline"
        title={user?.mpinConfigured ? 'Reset MPIN' : 'Set MPIN'}
        subtitle={
          user?.mpinConfigured
            ? 'Change the MPIN used before opening the dashboard.'
            : 'Create the MPIN required before opening the dashboard.'
        }
        onPress={() => router.push('/manage-mpin')}
      />
      <ListRow icon="phone-portrait-outline" title="Device Tracking" subtitle="Trusted devices and current logins" onPress={() => router.push('/devices')} />
      <ListRow icon="time-outline" title="Active Sessions" subtitle="Review current and recent activity" onPress={() => router.push('/sessions')} />
      <ListRow icon="lock-closed-outline" title="Change Password" subtitle="Rotate account credentials regularly" onPress={() => router.push('/(auth)/reset-password')} />
    </AppScreen>
  );
};

export const ReferralsScreen = () => {
  const router = useRouter();
  const { data: dashboardData, isLoading: isDashboardLoading } = useDashboardQuery();
  const { data: teamData, isLoading: isTeamLoading } = useTeamQuery();
  const referralLink = dashboardData?.referralLink || '';
  const totalReferrals = teamData?.totalMembers ?? 0;
  const referralEarnings = dashboardData?.metrics.referralEarnings ?? 0;
  const serverLevels = teamData?.levels ?? [];

  const defaultTiers = [
    { level: 1, commission: 10, label: 'Direct Sponsor (Level 1)' },
    { level: 2, commission: 5, label: 'Tier 2 Partner (Level 2)' },
    { level: 3, commission: 3, label: 'Tier 3 Partner (Level 3)' },
    { level: 4, commission: 2, label: 'Tier 4 Network (Level 4)' },
    { level: 5, commission: 1, label: 'Tier 5 Network (Level 5)' },
    { level: 6, commission: 0.5, label: 'Tier 6 Extended (Level 6)' },
  ];

  const levels = defaultTiers.map((tier) => {
    const match = serverLevels.find((l) => l.level === tier.level);
    return {
      level: tier.level,
      label: tier.label,
      commission: match?.commission ?? tier.commission,
      members: match?.members ?? 0,
      earnings: match?.earnings ?? 0,
    };
  });

  return (
    <AppScreen>
      <ScreenHeader title="Referral Center" subtitle="Share your invite code, monitor 6 team tiers, and track commissions." onBackPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/team'))} />

      <SurfaceCard glass="dark">
        <Text style={styles.heroTitle}>Grow Your Wealth Network</Text>
        <Text style={styles.heroSubtitle}>Earn up to 10% direct commissions and multi-level rewards on every active investment in your tree.</Text>
      </SurfaceCard>

      <ReferralLinkCard link={referralLink} />

      <View style={styles.referralMetricRow}>
        <SurfaceCard glass="dark" style={styles.referralMetricCard}>
          <Text style={styles.referralMetricValue}>{totalReferrals}</Text>
          <Text style={styles.referralMetricLabel}>Total Network</Text>
        </SurfaceCard>
        <SurfaceCard glass="dark" style={styles.referralMetricCard}>
          <Text style={[styles.referralMetricValue, { color: colors.successLight }]}>{formatCurrency(referralEarnings)}</Text>
          <Text style={styles.referralMetricLabel}>Total Earnings</Text>
        </SurfaceCard>
      </View>

      <SurfaceCard glass="dark">
        <SectionTitle title="6-Tier Commission Structure" />
        {isDashboardLoading || isTeamLoading ? (
          <Text style={styles.supportingText}>Loading referral levels...</Text>
        ) : (
          levels.map((level) => (
            <View key={level.level} style={styles.levelCardRow}>
              <View>
                <Text style={styles.levelCardTitle}>{level.label}</Text>
                <Text style={styles.levelCardMeta}>{level.members} registered team members</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 2 }}>
                <Text style={styles.levelCardCommission}>{formatPercent(level.commission)}</Text>
                <Text style={{ fontFamily: fontFamily.bodySemi, fontSize: 11, color: colors.textSecondary }}>{formatCurrency(level.earnings)}</Text>
              </View>
            </View>
          ))
        )}
      </SurfaceCard>

      <ListRow icon="git-network-outline" title="Interactive Tree Hierarchy" subtitle="Explore your complete visual member tree" onPress={() => router.push('/referral-tree')} />
      <GradientButton label="Open Team Dashboard" onPress={() => router.push('/(tabs)/team')} />
    </AppScreen>
  );
};

export const SettingsScreen = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [autoLogout, setAutoLogout] = useState(true);
  const permission = useAppStore((state) => state.notificationPermission);
  const setPermission = useAppStore((state) => state.setNotificationPermission);
  
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: () => dashboardService.getNotificationPreferences(),
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: (newPrefs: any) => dashboardService.updateNotificationPreferences(newPrefs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
    },
    onError: () => {
      Alert.alert('Update failed', 'Could not update notification preferences.');
    }
  });

  useEffect(() => {
    void notificationPermissionsService.getStatus().then(setPermission);
  }, [setPermission]);

  const togglePush = async (value: boolean) => {
    // 1. Update OS permission
    if (!value) {
      await setPermission('denied');
    } else {
      const normalized = await notificationPermissionsService.requestStatus();
      await setPermission(normalized);
    }
    
    // 2. Update backend preference
    if (preferences) {
      updatePreferencesMutation.mutate({ ...preferences, pushNotifications: value });
    }
  };

  const handleToggleBackendPref = (key: 'emailUpdates' | 'smsUpdates' | 'marketing', value: boolean) => {
    if (!preferences) return;
    updatePreferencesMutation.mutate({ ...preferences, [key]: value });
  };

  return (
    <AppScreen>
      <ScreenHeader title="Settings" subtitle="Notification preferences, session behavior, and support." onBackPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'))} />

      <SurfaceCard>
        <Text style={styles.supportingText}>Device Push Permission: {permission}</Text>
      </SurfaceCard>

      {isLoading ? (
        <SurfaceCard>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.supportingText}>Loading preferences...</Text>
        </SurfaceCard>
      ) : (
        <>
          <ToggleRow
            title="Push Notifications"
            subtitle="Receive earnings, team, and security alerts on this device."
            value={preferences?.pushNotifications ?? (permission === 'granted')}
            onValueChange={(value) => void togglePush(value)}
          />
          <ToggleRow
            title="Email Updates"
            subtitle="Receive investment and account updates by email."
            value={preferences?.emailUpdates ?? true}
            onValueChange={(val) => handleToggleBackendPref('emailUpdates', val)}
          />
          <ToggleRow
            title="SMS Updates"
            subtitle="Receive important OTPs and alerts via SMS."
            value={preferences?.smsUpdates ?? false}
            onValueChange={(val) => handleToggleBackendPref('smsUpdates', val)}
          />
          <ToggleRow
            title="Marketing & Offers"
            subtitle="Receive promotional content and new plan updates."
            value={preferences?.marketing ?? false}
            onValueChange={(val) => handleToggleBackendPref('marketing', val)}
          />
        </>
      )}

      <ToggleRow
        title="Auto Logout"
        subtitle="Require re-authentication after idle sessions."
        value={autoLogout}
        onValueChange={setAutoLogout}
      />

      <ListRow icon="help-circle-outline" title="Support" subtitle="Contact the help desk or raise a ticket." />
      <ListRow
        icon="document-text-outline"
        title="Terms & Conditions"
        subtitle="Review the investment rules and platform obligations."
        onPress={() =>
          router.push({
            pathname: '/terms-and-conditions',
            params: {
              returnTo: '/settings',
              returnLabel: 'Back to Settings',
            },
          })
        }
      />
      <ListRow
        icon="shield-checkmark-outline"
        title="Privacy Policy"
        subtitle="See how your account, KYC, and transaction data is handled."
        onPress={() =>
          router.push({
            pathname: '/privacy-policy',
            params: {
              returnTo: '/settings',
              returnLabel: 'Back to Settings',
            },
          })
        }
      />
      <ListRow icon="information-circle-outline" title="About Anusha Trade" subtitle="Version, build info, and app details." />
    </AppScreen>
  );
};

export const TransactionsScreen = () => {
  const router = useRouter();
  const transactions = useWalletStore((state) => state.transactions);
  const [filter, setFilter] = useState<'all' | 'credited' | 'debited' | 'processing'>('all');

  const filteredTransactions = useMemo(
    () => (filter === 'all' ? transactions : transactions.filter((item) => item.status === filter)),
    [filter, transactions]
  );

  return (
    <AppScreen>
      <ScreenHeader title="Transactions" subtitle="Deposits, withdrawals, commissions, and profit movements." onBackPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/wallet'))} />
      <SurfaceCard>
        <View style={styles.filterWrap}>
          {(['all', 'credited', 'debited', 'processing'] as const).map((item) => (
            <Pressable key={item} onPress={() => setFilter(item)} style={[styles.filterChip, filter === item && styles.filterChipActive]}>
              <Text style={[styles.filterChipText, filter === item && styles.filterChipTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </View>
      </SurfaceCard>

      <SurfaceCard>
        {filteredTransactions.map((item) => (
          <TransactionRow key={item.id} item={item} />
        ))}
      </SurfaceCard>
    </AppScreen>
  );
};

export const WithdrawScreen = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('');
  const availableBalance = useWalletStore((state) => state.availableBalance);
  const transactions = useWalletStore((state) => state.transactions);
  const user = useAuthStore((state) => state.user);
  const bankMask = user?.bankMask || 'No verified bank account linked';
  const accountHolderName = user?.accountHolderName || user?.name || 'Verified Investor';
  const bankName = user?.bankName || 'Linked Bank';
  const ifscCode = user?.ifscCode || 'ICIC0000102';
  const withdrawals = transactions.filter((item) => item.type === 'withdrawal');

  const QUICK_AMOUNTS = [1000, 2500, 5000, 10000];

  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['withdrawal-settings'],
    queryFn: () => dashboardService.getWithdrawalSettings(),
  });

  const withdrawalMutation = useMutation({
    mutationFn: (requestedAmount: number) => dashboardService.requestWithdrawal(requestedAmount),
    onSuccess: async () => {
      setAmount('');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.wallet }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
      ]);
      Alert.alert('Withdrawal Requested', 'Your bank payout request has been submitted for instant audit clearance.');
      router.push('/withdrawal-history');
    },
    onError: (error) => {
      Alert.alert('Withdrawal Failed', getAuthErrorMessage(error));
    },
  });

  const handleWithdrawalRequest = () => {
    const requestedAmount = Number(amount.replace(/[^0-9.]/g, ''));

    if (!requestedAmount || !Number.isFinite(requestedAmount) || requestedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Enter a valid withdrawal amount to continue.');
      return;
    }

    if (!user?.bankMask.trim()) {
      Alert.alert('Bank Account Required', 'Link and verify your bank account before requesting a withdrawal.');
      return;
    }

    if (requestedAmount > availableBalance) {
      Alert.alert('Insufficient Balance', 'Withdrawal amount cannot be greater than the available balance.');
      return;
    }

    if (settings) {
      if (!settings.withdrawalEnabled) {
        Alert.alert('Withdrawals Disabled', 'Withdrawals are currently disabled by the admin.');
        return;
      }
      if (requestedAmount < settings.minimumWithdrawalAmount) {
        Alert.alert('Amount Too Low', `Minimum withdrawal amount is ${formatCurrency(settings.minimumWithdrawalAmount)}`);
        return;
      }
      if (settings.maximumWithdrawalAmount > 0 && requestedAmount > settings.maximumWithdrawalAmount) {
        Alert.alert('Amount Too High', `Maximum withdrawal amount is ${formatCurrency(settings.maximumWithdrawalAmount)}`);
        return;
      }
    }

    withdrawalMutation.mutate(requestedAmount);
  };

  return (
    <AppScreen>
      <ScreenHeader title="Withdraw Funds" subtitle="Instant payout directly to your verified bank account." onBackPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/wallet'))} />

      {/* Available Balance Hero */}
      <SurfaceCard glass="dark">
        <Text style={{ fontFamily: fontFamily.bodySemi, fontSize: 12, color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6 }}>Available Withdrawable Balance</Text>
        <Text style={{ fontFamily: fontFamily.heading, fontSize: 32, color: '#FFFFFF', marginTop: 4 }}>{formatCurrency(availableBalance)}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
          <Ionicons name="shield-checkmark" size={14} color={colors.successLight} />
          <Text style={{ fontFamily: fontFamily.bodySemi, fontSize: 12, color: colors.successLight }}>Instant 24/7 IMPS / NEFT Settlement</Text>
        </View>
      </SurfaceCard>

      {/* Destination Bank Account Card */}
      <SurfaceCard glass="dark">
        <SectionTitle title="Destination Bank Account" actionLabel="Change" onActionPress={() => router.push('/bank-details')} />
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: radius.md, borderWidth: 1, borderColor: '#DBEAFE', padding: 14, gap: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontFamily: fontFamily.headingSemi, fontSize: 16, color: '#FFFFFF' }}>{bankName}</Text>
            <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', borderWidth: 1, borderColor: 'rgba(52, 211, 153, 0.35)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill }}>
              <Text style={{ fontFamily: fontFamily.bodyBold, fontSize: 10.5, color: colors.successLight }}>VERIFIED</Text>
            </View>
          </View>
          <Text style={{ fontFamily: fontFamily.bodySemi, fontSize: 14, color: colors.cyan }}>{bankMask}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
            <Text style={{ fontFamily: fontFamily.body, fontSize: 12, color: colors.textSecondary }}>Holder: {accountHolderName}</Text>
            <Text style={{ fontFamily: fontFamily.body, fontSize: 12, color: colors.textSecondary }}>IFSC: {ifscCode}</Text>
          </View>
        </View>
      </SurfaceCard>

      {/* Withdrawal Form */}
      <SurfaceCard glass="dark">
        <Text style={styles.fieldLabel}>Enter Withdrawal Amount (₹)</Text>

        {/* Quick Amount Chips */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 6 }}>
          {QUICK_AMOUNTS.map((amt) => (
            <Pressable
              key={amt}
              onPress={() => setAmount(String(amt))}
              style={({ pressed }) => [
                {
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: radius.pill,
                  backgroundColor: amount === String(amt) ? 'rgba(56, 189, 248, 0.2)' : '#F8FAFC',
                  borderWidth: 1,
                  borderColor: amount === String(amt) ? colors.cyan : 'rgba(255, 255, 255, 0.12)',
                },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={{ fontFamily: fontFamily.bodyBold, fontSize: 12, color: amount === String(amt) ? colors.cyan : colors.textSecondary }}>
                ₹{amt.toLocaleString('en-IN')}
              </Text>
            </Pressable>
          ))}
          {availableBalance > 0 ? (
            <Pressable
              onPress={() => setAmount(String(availableBalance))}
              style={({ pressed }) => [
                {
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: radius.pill,
                  backgroundColor: amount === String(availableBalance) ? 'rgba(56, 189, 248, 0.2)' : '#F8FAFC',
                  borderWidth: 1,
                  borderColor: amount === String(availableBalance) ? colors.cyan : 'rgba(255, 255, 255, 0.12)',
                },
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={{ fontFamily: fontFamily.bodyBold, fontSize: 12, color: colors.warningLight }}>
                Max All
              </Text>
            </Pressable>
          ) : null}
        </View>

        <TextInput
          keyboardType="number-pad"
          value={amount}
          onChangeText={(value) => setAmount(value.replace(/[^0-9.]/g, ''))}
          style={styles.amountInput}
          placeholder="Enter ₹ amount"
          placeholderTextColor={colors.textSecondary}
        />

        {settingsLoading ? (
          <Text style={styles.supportingText}>Loading payout guidelines...</Text>
        ) : settings ? (
          <Text style={styles.supportingText}>
            Min withdrawal: {formatCurrency(settings.minimumWithdrawalAmount)} 
            {settings.maximumWithdrawalAmount > 0 ? ` • Max limit: ${formatCurrency(settings.maximumWithdrawalAmount)}` : ''}
            {settings.feePercentage > 0 ? ` • Fee: ${settings.feePercentage}%` : ' • 0% Processing Fee'}
          </Text>
        ) : null}

        <GradientButton
          label={withdrawalMutation.isPending ? 'Processing Payout...' : 'Confirm Bank Withdrawal'}
          icon={<Ionicons name="arrow-up-circle-outline" size={18} color="#FFFFFF" />}
          onPress={handleWithdrawalRequest}
          disabled={!settings?.withdrawalEnabled || withdrawalMutation.isPending}
        />
      </SurfaceCard>

      {/* Recent Payout Requests */}
      <SurfaceCard glass="dark">
        <SectionTitle title="Recent Payout Activity" actionLabel="Passbook" onActionPress={() => router.push('/withdrawal-history')} />
        {withdrawals.length ? withdrawals.slice(0, 4).map((item) => <TransactionRow key={item.id} item={item} />) : <Text style={styles.supportingText}>No payout requests yet.</Text>}
      </SurfaceCard>

      <ListRow icon="time-outline" title="Full Withdrawal History" subtitle="Review every processed and pending payout transaction" onPress={() => router.push('/withdrawal-history')} />
    </AppScreen>
  );
};

export const SessionsScreen = () => {
  const router = useRouter();
  const { data } = useSessionsQuery();

  return (
    <AppScreen>
      <ScreenHeader title="Active Sessions" subtitle="Review the latest sessions and protect account access." onBackPress={() => (router.canGoBack() ? router.back() : router.replace('/security-center'))} />
      {(data?.sessions || []).map((item) => (
        <SurfaceCard key={item.id}>
          <Text style={styles.sessionTitle}>{item.device}</Text>
          <Text style={styles.supportingText}>{item.location}</Text>
          <Text style={styles.supportingText}>IP: {item.ipAddress}</Text>
          <Text style={styles.supportingText}>Last Active: {item.lastActive}</Text>
          {item.current ? <Text style={styles.currentSession}>Current device</Text> : null}
        </SurfaceCard>
      ))}
    </AppScreen>
  );
};

export const DevicesScreen = () => {
  const router = useRouter();
  const { data } = useSessionsQuery();

  return (
    <AppScreen>
      <ScreenHeader title="Device Tracking" subtitle="Trusted device list with session monitoring controls." onBackPress={() => (router.canGoBack() ? router.back() : router.replace('/security-center'))} />
      {(data?.sessions || []).map((item) => (
        <SurfaceCard key={item.id}>
          <Text style={styles.sessionTitle}>{item.device}</Text>
          <Text style={styles.supportingText}>{item.location}</Text>
          <Text style={styles.supportingText}>Status: {item.current ? 'Current device' : 'Tracked session'}</Text>
          <GradientButton label={item.current ? 'Logout This Device' : 'Logout Session'} variant="secondary" compact />
        </SurfaceCard>
      ))}
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  heroTitle: {
    fontFamily: fontFamily.heading,
    fontSize: 28,
    lineHeight: 34,
    color: colors.surface,
  },
  heroSubtitle: {
    marginTop: 6,
    fontFamily: fontFamily.body,
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.82)',
  },
  profileHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileHeroCopy: {
    flex: 1,
    minWidth: 0,
  },
  supportingText: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  notificationRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  notificationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.cyan,
    marginTop: 6,
  },
  notificationDotRead: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  notificationCopy: {
    flex: 1,
    gap: 4,
  },
  notificationTitle: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 15,
    color: '#FFFFFF',
  },
  notificationDescription: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  notificationTime: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    color: colors.muted,
  },
  detailField: {
    minHeight: 62,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  detailFieldLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  detailFieldLabel: {
    flex: 0.9,
    fontFamily: fontFamily.bodySemi,
    fontSize: 11.5,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  detailFieldValue: {
    flex: 1.1,
    fontFamily: fontFamily.bodyBold,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textHeading,
    textAlign: 'right',
  },
  referralMetricRow: {
    flexDirection: 'row',
    gap: 12,
  },
  referralMetricCard: {
    flex: 1,
    alignItems: 'center',
  },
  referralMetricValue: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 24,
    color: '#FFFFFF',
  },
  referralMetricLabel: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    color: colors.textSecondary,
  },
  levelCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    gap: 12,
  },
  levelCardTitle: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  levelCardMeta: {
    marginTop: 4,
    fontFamily: fontFamily.body,
    fontSize: 12,
    color: colors.textSecondary,
  },
  levelCardCommission: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 18,
    color: colors.cyan,
  },
  filterWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterChip: {
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: '#FFFFFF',
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
  fieldLabel: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12.5,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  amountInput: {
    minHeight: 56,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    fontFamily: fontFamily.headingSemi,
    fontSize: 20,
    color: '#FFFFFF',
  },
  sessionTitle: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 17,
    color: '#FFFFFF',
  },
  currentSession: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 12,
    color: colors.cyan,
  },
});



