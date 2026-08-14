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

  const bankMask = formatProfileValue(user.bankMask, 'No verified bank account linked');
  const accountHolderName = formatProfileValue(user.accountHolderName, 'Not added yet');
  const ifscCode = formatProfileValue(user.ifscCode, 'Not added yet');
  const memberSince = formatProfileValue(user.memberSince, 'Not available yet');
  const kycStatus = user.kycStatus === 'APPROVED' ? 'APPROVED' : 'PENDING';
  const withdrawalAccess = user.bankMask.trim() && user.kycStatus === 'APPROVED'
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

      <GradientButton label={user.bankMask.trim() ? 'Open Withdraw' : 'Open Settings'} onPress={() => router.push(user.bankMask.trim() ? '/withdraw' : '/settings')} />
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
  const levels = teamData?.levels ?? [];

  return (
    <AppScreen>
      <ScreenHeader title="Referral System" subtitle="Share your invite code, monitor team levels, and track commissions." onBackPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/team'))} />

      <SurfaceCard gradient={gradients.primary}>
        <Text style={styles.heroTitle}>Grow your network</Text>
        <Text style={styles.heroSubtitle}>Direct partners and team leaders can scale recurring earnings through your referral link.</Text>
      </SurfaceCard>

      <ReferralLinkCard link={referralLink} />

      <View style={styles.referralMetricRow}>
        <SurfaceCard style={styles.referralMetricCard}>
          <Text style={styles.referralMetricValue}>{totalReferrals}</Text>
          <Text style={styles.referralMetricLabel}>Total Referrals</Text>
        </SurfaceCard>
        <SurfaceCard style={styles.referralMetricCard}>
          <Text style={styles.referralMetricValue}>{formatCurrency(referralEarnings)}</Text>
          <Text style={styles.referralMetricLabel}>Commission Earned</Text>
        </SurfaceCard>
      </View>

      <SurfaceCard>
        <SectionTitle title="Commission Levels" />
        {isDashboardLoading || isTeamLoading ? (
          <Text style={styles.supportingText}>Loading referral levels...</Text>
        ) : levels.length ? (
          levels.map((level) => (
            <View key={level.level} style={styles.levelCardRow}>
              <View>
                <Text style={styles.levelCardTitle}>Level {level.level}</Text>
                <Text style={styles.levelCardMeta}>{level.members} active members</Text>
              </View>
              <Text style={styles.levelCardCommission}>{formatPercent(level.commission)}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.supportingText}>No referral levels available yet.</Text>
        )}
      </SurfaceCard>

      <ListRow icon="git-network-outline" title="Referral Tree" subtitle="Open the full network hierarchy and level overview" onPress={() => router.push('/referral-tree')} />
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
  const withdrawals = transactions.filter((item) => item.type === 'withdrawal');
  
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
      Alert.alert('Withdrawal requested', 'Your withdrawal request has been submitted successfully.');
      router.push('/withdrawal-history');
    },
    onError: (error) => {
      Alert.alert('Withdrawal failed', getAuthErrorMessage(error));
    },
  });

  const handleWithdrawalRequest = () => {
    const requestedAmount = Number(amount.replace(/[^0-9.]/g, ''));

    if (!requestedAmount || !Number.isFinite(requestedAmount) || requestedAmount <= 0) {
      Alert.alert('Invalid amount', 'Enter a valid withdrawal amount to continue.');
      return;
    }

    if (!user?.bankMask.trim()) {
      Alert.alert('Bank account required', 'Link and verify your bank account before requesting a withdrawal.');
      return;
    }

    if (requestedAmount > availableBalance) {
      Alert.alert('Insufficient balance', 'Withdrawal amount cannot be greater than the available balance.');
      return;
    }

    if (settings) {
      if (!settings.withdrawalEnabled) {
        Alert.alert('Withdrawals Disabled', 'Withdrawals are currently disabled by the admin.');
        return;
      }
      if (requestedAmount < settings.minimumWithdrawalAmount) {
        Alert.alert('Amount too low', `Minimum withdrawal amount is ${formatCurrency(settings.minimumWithdrawalAmount)}`);
        return;
      }
      if (settings.maximumWithdrawalAmount > 0 && requestedAmount > settings.maximumWithdrawalAmount) {
        Alert.alert('Amount too high', `Maximum withdrawal amount is ${formatCurrency(settings.maximumWithdrawalAmount)}`);
        return;
      }
    }

    withdrawalMutation.mutate(requestedAmount);
  };

  return (
    <AppScreen>
      <ScreenHeader title="Withdraw" subtitle="Move available funds to your verified bank account." onBackPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/wallet'))} />
      <SurfaceCard gradient={gradients.primary}>
        <Text style={styles.heroTitle}>Available Balance</Text>
        <Text style={styles.heroSubtitle}>{formatCurrency(availableBalance)}</Text>
      </SurfaceCard>

      <SurfaceCard>
        <Text style={styles.fieldLabel}>Withdrawal Amount</Text>
        <TextInput
          keyboardType="number-pad"
          value={amount}
          onChangeText={(value) => setAmount(value.replace(/[^0-9.]/g, ''))}
          style={styles.amountInput}
          placeholder="0"
          placeholderTextColor="#94A3B8"
        />
        {settingsLoading ? (
          <Text style={styles.supportingText}>Loading settings...</Text>
        ) : settings ? (
          <Text style={styles.supportingText}>
            Min: {formatCurrency(settings.minimumWithdrawalAmount)} 
            {settings.maximumWithdrawalAmount > 0 ? ` • Max: ${formatCurrency(settings.maximumWithdrawalAmount)}` : ''}
            {settings.feePercentage > 0 ? ` • Fee: ${settings.feePercentage}%` : ''}
          </Text>
        ) : null}
        <Text style={styles.supportingText}>{`Bank account: ${bankMask}`}</Text>
        <GradientButton
          label={withdrawalMutation.isPending ? 'Requesting...' : 'Request Withdrawal'}
          onPress={handleWithdrawalRequest}
          disabled={!settings?.withdrawalEnabled || withdrawalMutation.isPending}
        />
      </SurfaceCard>

      <SurfaceCard>
        <SectionTitle title="Recent Payouts" actionLabel="History" onActionPress={() => router.push('/withdrawal-history')} />
        {withdrawals.length ? withdrawals.map((item) => <TransactionRow key={item.id} item={item} />) : <Text style={styles.supportingText}>No payout requests yet.</Text>}
      </SurfaceCard>

      <ListRow icon="time-outline" title="Withdrawal History" subtitle="Review every processed and pending payout request" onPress={() => router.push('/withdrawal-history')} />
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
    color: colors.muted,
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
    backgroundColor: colors.primary,
    marginTop: 6,
  },
  notificationDotRead: {
    backgroundColor: '#CBD5E1',
  },
  notificationCopy: {
    flex: 1,
    gap: 4,
  },
  notificationTitle: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 15,
    color: colors.text,
  },
  notificationDescription: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 20,
    color: colors.muted,
  },
  notificationTime: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    color: colors.muted,
  },
  detailField: {
    paddingVertical: 14,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  detailFieldLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  detailFieldLabel: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  detailFieldValue: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
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
    color: colors.text,
  },
  referralMetricLabel: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    color: colors.muted,
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
    color: colors.text,
  },
  levelCardMeta: {
    marginTop: 4,
    fontFamily: fontFamily.body,
    fontSize: 12,
    color: colors.muted,
  },
  levelCardCommission: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 18,
    color: colors.primary,
  },
  filterWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterChip: {
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: colors.surface,
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
  fieldLabel: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 13,
    color: colors.text,
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
  sessionTitle: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 18,
    color: colors.text,
  },
  currentSession: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 12,
    color: colors.primary,
  },
});

