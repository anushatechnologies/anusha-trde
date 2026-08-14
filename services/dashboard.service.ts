import { Platform } from 'react-native';

import { apiClient } from '../api/client';
import {
  emptyDashboardPayload,
  emptyInvestmentPayload,
  emptyNotificationPayload,
  emptyTeamPayload,
  emptyUserProfile,
  emptyWalletPayload,
} from '../constants/app-defaults';
import {
  ActiveInvestment,
  AppNotification,
  DashboardMetrics,
  DashboardPayload,
  EarningsPoint,
  InvestmentPayload,
  NotificationPayload,
  Plan,
  SessionItem,
  TeamLevel,
  TeamPayload,
  TeamTreeNode,
  TransactionItem,
  UserProfile,
  WalletPayload,
} from '../types';
import { getInitials } from '../utils/format';
import { useAuthStore } from '../store/use-auth-store';

type UnknownRecord = Record<string, unknown>;

const PLAN_ACCENTS = ['#1D4ED8', '#0F766E', '#C2410C', '#7C3AED', '#B91C1C', '#4338CA'];

const asRecord = (value: unknown): UnknownRecord => {
  if (Array.isArray(value)) {
    return value.length > 0 && typeof value[0] === 'object' && value[0] !== null ? (value[0] as UnknownRecord) : {};
  }
  return typeof value === 'object' && value !== null ? (value as UnknownRecord) : {};
};

const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const pickFirst = (source: UnknownRecord, keys: string[]) => {
  for (const key of keys) {
    const value = source[key];

    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }

  const nestedData = asRecord(source.data);
  for (const key of keys) {
    const value = nestedData[key];

    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }

  return undefined;
};

const pickRecord = (source: UnknownRecord, keys: string[]) => {
  for (const key of keys) {
    const value = source[key];

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return value as UnknownRecord;
    }
  }

  const nestedData = asRecord(source.data);
  for (const key of keys) {
    const value = nestedData[key];

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return value as UnknownRecord;
    }
  }

  return {};
};

const pickArray = (source: UnknownRecord, keys: string[]) => {
  for (const key of keys) {
    const value = source[key];

    if (Array.isArray(value)) {
      return value;
    }
  }

  const nestedData = asRecord(source.data);
  for (const key of keys) {
    const value = nestedData[key];

    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
};

const toNumber = (value: unknown, fallback = 0) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = Number(value.replace(/,/g, '').trim());

    if (Number.isFinite(normalized)) {
      return normalized;
    }
  }

  return fallback;
};

const toStringValue = (value: unknown, fallback = '') => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.toLowerCase() === 'null' || trimmed.toLowerCase() === 'undefined') {
      return fallback;
    }
    return trimmed;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return fallback;
};

const clampProgress = (value: number) => Math.max(0, Math.min(value, 1));

const formatDisplayDate = (value: unknown, fallback = 'Not available') => {
  const raw = toStringValue(value);

  if (!raw) {
    return fallback;
  }

  const parsed = new Date(raw);

  if (Number.isNaN(parsed.getTime())) {
    return raw;
  }

  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
};

const maskBankAccount = (value: unknown) => {
  const digits = toStringValue(value).replace(/\D/g, '');
  return digits ? `A/C **** ${digits.slice(-4)}` : '';
};

const maskAadhaar = (value: unknown) => {
  const digits = toStringValue(value).replace(/\D/g, '');

  if (!digits) {
    return '';
  }

  return digits.length <= 4 ? `XXXX XXXX ${digits.padStart(4, '0')}` : `XXXX XXXX ${digits.slice(-4)}`;
};

const normalizeKycStatus = (value: unknown): UserProfile['kycStatus'] => {
  const normalized = toStringValue(value).toUpperCase();
  switch (normalized) {
    case 'APPROVED':
    case 'VERIFIED':
      return 'APPROVED';
    case 'PENDING':
      return 'PENDING';
    case 'REJECTED':
      return 'REJECTED';
    case 'REUPLOAD_REQUIRED':
      return 'REUPLOAD_REQUIRED';
    default:
      return 'NOT_SUBMITTED';
  }
};

const resolveNotificationType = (source: UnknownRecord): AppNotification['type'] => {
  const label = [
    toStringValue(source.type),
    toStringValue(source.category),
    toStringValue(source.title),
    toStringValue(source.message),
  ]
    .join(' ')
    .toLowerCase();

  if (label.includes('security') || label.includes('login') || label.includes('device') || label.includes('biometric')) {
    return 'security';
  }

  if (label.includes('referral') || label.includes('commission') || label.includes('team')) {
    return 'referral';
  }

  if (label.includes('investment') || label.includes('plan') || label.includes('receipt')) {
    return 'investment';
  }

  return 'earning';
};

const resolveTransactionType = (source: UnknownRecord): TransactionItem['type'] => {
  const label = [
    toStringValue(source.type),
    toStringValue(source.transactionType),
    toStringValue(source.category),
    toStringValue(source.title),
    toStringValue(source.note),
    toStringValue(source.description),
  ]
    .join(' ')
    .toLowerCase();

  if (label.includes('withdraw')) {
    return 'withdrawal';
  }

  if (label.includes('commission') || label.includes('referral')) {
    return 'commission';
  }

  if (label.includes('profit') || label.includes('interest') || label.includes('earning')) {
    return 'profit';
  }

  return 'deposit';
};

const resolveTransactionStatus = (source: UnknownRecord, type: TransactionItem['type']): TransactionItem['status'] => {
  const normalized = [
    toStringValue(source.status),
    toStringValue(source.paymentStatus),
    toStringValue(source.reviewStatus),
  ]
    .join(' ')
    .toUpperCase();

  if (
    normalized.includes('PENDING') ||
    normalized.includes('PROCESS') ||
    normalized.includes('RECEIPT') ||
    normalized.includes('REVIEW') ||
    normalized.includes('REQUEST')
  ) {
    return 'processing';
  }

  if (type === 'withdrawal') {
    return 'debited';
  }

  if (normalized.includes('REJECT') || normalized.includes('FAIL') || normalized.includes('CANCEL')) {
    return 'debited';
  }

  return 'credited';
};

const mapTransaction = (value: unknown, index: number): TransactionItem => {
  const source = asRecord(value);
  const type = resolveTransactionType(source);
  const rawAmount = toNumber(
    pickFirst(source, ['signedAmount', 'amount', 'transactionAmount', 'requestedAmount', 'investmentAmount', 'walletAmount'])
  );
  const amount = type === 'withdrawal' ? -Math.abs(rawAmount) : Math.abs(rawAmount);
  const title =
    toStringValue(pickFirst(source, ['title', 'label', 'transactionLabel', 'description'])) ||
    `${type.charAt(0).toUpperCase()}${type.slice(1)} transaction`;

  return {
    id: toStringValue(pickFirst(source, ['id', 'transactionId', 'referenceId']), `txn-${index + 1}`),
    title,
    amount,
    type,
    status: resolveTransactionStatus(source, type),
    timestamp: formatDisplayDate(
      pickFirst(source, ['createdAt', 'updatedAt', 'paymentDate', 'transactionDate', 'creditedAt']),
      'Recent'
    ),
    note:
      toStringValue(pickFirst(source, ['note', 'remarks', 'description', 'reason', 'paymentMode', 'bankReference'])) || 'Recorded activity',
  };
};

const mapAnnouncement = (value: unknown, index: number) => {
  const source = asRecord(value);

  return {
    id: toStringValue(pickFirst(source, ['id', 'announcementId']), `announcement-${index + 1}`),
    title: toStringValue(pickFirst(source, ['title', 'heading']), 'Platform update'),
    message: toStringValue(pickFirst(source, ['message', 'description', 'body']), 'New updates will appear here.'),
    tag: toStringValue(pickFirst(source, ['tag', 'category', 'type']), 'Notice'),
  };
};

const mapSeriesPoint = (value: unknown, index: number): EarningsPoint => {
  const source = asRecord(value);

  return {
    label: toStringValue(pickFirst(source, ['label', 'month', 'name', 'date']), `P${index + 1}`),
    value: toNumber(pickFirst(source, ['value', 'amount', 'total', 'earnings'])),
  };
};

const mapNotification = (value: unknown, index: number): AppNotification => {
  const source = asRecord(value);

  return {
    id: toStringValue(pickFirst(source, ['id', 'notificationId']), `notification-${index + 1}`),
    title: toStringValue(pickFirst(source, ['title', 'heading']), 'Notification'),
    description: toStringValue(pickFirst(source, ['description', 'message', 'body']), 'A new account update is available.'),
    time: formatDisplayDate(pickFirst(source, ['createdAt', 'updatedAt', 'time']), 'Just now'),
    read: Boolean(pickFirst(source, ['read', 'isRead'])),
    type: resolveNotificationType(source),
  };
};

const mapTeamLevel = (value: unknown, index: number): TeamLevel => {
  const source = asRecord(value);
  const level = toNumber(pickFirst(source, ['level', 'levelNumber']), index + 1);

  return {
    level,
    members: toNumber(pickFirst(source, ['members', 'memberCount', 'count', 'totalMembers'])),
    earnings: toNumber(pickFirst(source, ['earnings', 'income', 'commissionEarned', 'amount', 'totalEarnings'])),
    commission: toNumber(pickFirst(source, ['commission', 'commissionRate', 'rate', 'percentage'])),
    growth: toNumber(pickFirst(source, ['growth', 'weeklyGrowth', 'changePercentage'])),
  };
};

const mapTreeNode = (value: unknown, index: number): TeamTreeNode => {
  const source = asRecord(value);

  return {
    id: toStringValue(pickFirst(source, ['id', 'levelId']), `level-${index + 1}`),
    title: toStringValue(pickFirst(source, ['title', 'name', 'label']), `Level ${index + 1}`),
    subtitle: toStringValue(pickFirst(source, ['subtitle', 'description']), 'Referral level'),
    members: toNumber(pickFirst(source, ['members', 'memberCount', 'count', 'totalMembers'])),
    earnings: toNumber(pickFirst(source, ['earnings', 'commissionEarned', 'amount'])),
    commission: toNumber(pickFirst(source, ['commission', 'commissionRate', 'percentage'])),
  };
};

const mapPlan = (value: unknown, index: number): Plan => {
  const source = asRecord(value);
  const lockInMonths = toNumber(pickFirst(source, ['lockInMonths', 'durationMonths']), 0);
  const monthlyInterestRate = toNumber(pickFirst(source, ['monthlyInterestRate', 'roi', 'interestRate']));

  return {
    id: toStringValue(pickFirst(source, ['id', 'planId']), `plan-${index + 1}`),
    name: toStringValue(pickFirst(source, ['planName', 'name']), `Plan ${index + 1}`),
    roi: monthlyInterestRate,
    minInvestment: toNumber(pickFirst(source, ['minimumAmount', 'minInvestment', 'minimumInvestment'])),
    maxInvestment: toNumber(pickFirst(source, ['maximumAmount', 'maxInvestment', 'maximumInvestment'])),
    termDays: toNumber(pickFirst(source, ['termDays', 'durationDays']), lockInMonths > 0 ? lockInMonths * 30 : 0),
    activeInvestors: toNumber(pickFirst(source, ['activeInvestors', 'investorCount', 'totalInvestors'])),
    accent: PLAN_ACCENTS[index % PLAN_ACCENTS.length],
    description: toStringValue(pickFirst(source, ['description', 'summary']), 'Investment plan'),
  };
};

const resolveInvestmentProgress = (source: UnknownRecord) => {
  const directProgress = pickFirst(source, ['progress', 'completion', 'completionRatio']);

  if (directProgress !== undefined) {
    return clampProgress(toNumber(directProgress));
  }

  const percentage = pickFirst(source, ['progressPercentage', 'completionPercentage']);

  if (percentage !== undefined) {
    return clampProgress(toNumber(percentage) / 100);
  }

  const status = toStringValue(pickFirst(source, ['status', 'investmentStatus'])).toUpperCase();

  if (status.includes('MATURED') || status.includes('COMPLETED')) {
    return 1;
  }

  return status.includes('ACTIVE') ? 0.35 : 0;
};

const mapActiveInvestment = (value: unknown, index: number, planLookup: Map<string, Plan>): ActiveInvestment => {
  const source = asRecord(value);
  const planId = toStringValue(pickFirst(source, ['investmentPlanId', 'planId', 'id']), `plan-${index + 1}`);
  const linkedPlan = planLookup.get(planId);
  const statusLabel = toStringValue(pickFirst(source, ['status', 'investmentStatus'])).toUpperCase();

  return {
    id: toStringValue(pickFirst(source, ['id', 'investmentId']), `investment-${index + 1}`),
    planId,
    planName: toStringValue(pickFirst(source, ['planName', 'investmentPlanName']), linkedPlan?.name || `Plan ${index + 1}`),
    amount: toNumber(pickFirst(source, ['investmentAmount', 'amount', 'principalAmount'])),
    roi: toNumber(pickFirst(source, ['monthlyInterestRate', 'roi', 'interestRate']), linkedPlan?.roi || 0),
    progress: resolveInvestmentProgress(source),
    nextPayout: formatDisplayDate(pickFirst(source, ['nextPayoutDate', 'nextInterestDate', 'maturityDate']), 'Pending update'),
    earned: toNumber(pickFirst(source, ['earnedAmount', 'totalEarned', 'interestEarned', 'profitEarned'])),
    status: statusLabel.includes('MATURED') || statusLabel.includes('COMPLETED') ? 'Completed' : 'Running',
  };
};

const buildUserProfile = (dashboardSource: UnknownRecord, bankSource: UnknownRecord): UserProfile => {
  const storedUser = useAuthStore.getState().user ?? emptyUserProfile;
  const userSource = pickRecord(dashboardSource, ['user', 'profile', 'investor']);

  const fullName =
    toStringValue(pickFirst(userSource, ['fullName', 'name'])) ||
    toStringValue(pickFirst(dashboardSource, ['fullName', 'name'])) ||
    storedUser.name;
  const name = (fullName && fullName.toLowerCase() !== 'investor')
    ? fullName
    : (storedUser.name || fullName || 'Investor');

  const emailVal =
    toStringValue(pickFirst(userSource, ['email'])) ||
    toStringValue(pickFirst(dashboardSource, ['email'])) ||
    storedUser.email;
  const email = (emailVal && emailVal.toLowerCase() !== 'email not added' && emailVal.toLowerCase() !== 'no email')
    ? emailVal
    : (storedUser.email || emailVal);

  const mobileVal =
    toStringValue(pickFirst(userSource, ['mobileNumber', 'mobile'])) ||
    toStringValue(pickFirst(dashboardSource, ['mobileNumber', 'mobile'])) ||
    storedUser.mobile;
  const mobile = (mobileVal && mobileVal.toLowerCase() !== 'mobile number not added' && mobileVal.toLowerCase() !== 'no mobile')
    ? mobileVal
    : (storedUser.mobile || mobileVal);

  const bankAccountNumber = pickFirst(bankSource, ['bankAccountNumber', 'accountNumber', 'accountNumberMasked']);
  const bankMaskVal = maskBankAccount(bankAccountNumber) || storedUser.bankMask;
  const bankMask = (bankMaskVal && !bankMaskVal.toLowerCase().includes('no verified bank') && bankMaskVal.toLowerCase() !== 'no verified bank account linked')
    ? bankMaskVal
    : (storedUser.bankMask || bankMaskVal);

  const bankNameVal = toStringValue(pickFirst(bankSource, ['bankName'])) || storedUser.bankName;
  const bankName = (bankNameVal && bankNameVal.toLowerCase() !== 'bank name not added')
    ? bankNameVal
    : (storedUser.bankName || bankNameVal);

  const accountHolderNameVal = toStringValue(pickFirst(bankSource, ['accountHolderName'])) || storedUser.accountHolderName;
  const accountHolderName = (accountHolderNameVal && accountHolderNameVal.toLowerCase() !== 'not added yet')
    ? accountHolderNameVal
    : (storedUser.accountHolderName || accountHolderNameVal);

  const ifscCodeVal = toStringValue(pickFirst(bankSource, ['bankIfscCode', 'ifscCode'])).toUpperCase() || storedUser.ifscCode;
  const ifscCode = (ifscCodeVal && ifscCodeVal.toLowerCase() !== 'not added yet')
    ? ifscCodeVal
    : (storedUser.ifscCode || ifscCodeVal);

  const panNumberVal = toStringValue(pickFirst(userSource, ['panNumber'])) || storedUser.panNumber;
  const panNumber = (panNumberVal && panNumberVal.toLowerCase() !== 'not added yet')
    ? panNumberVal
    : (storedUser.panNumber || panNumberVal);

  const aadhaarMaskedVal = maskAadhaar(pickFirst(userSource, ['aadhaarMasked', 'aadhaarLast4'])) || storedUser.aadhaarMasked;
  const aadhaarMasked = (aadhaarMaskedVal && !aadhaarMaskedVal.toLowerCase().includes('not added yet'))
    ? aadhaarMaskedVal
    : (storedUser.aadhaarMasked || aadhaarMaskedVal);

  const dateOfBirthVal = formatDisplayDate(pickFirst(userSource, ['dateOfBirth']), storedUser.dateOfBirth || '') || storedUser.dateOfBirth;
  const dateOfBirth = (dateOfBirthVal && dateOfBirthVal.toLowerCase() !== 'not available' && dateOfBirthVal !== 'Not available')
    ? dateOfBirthVal
    : (storedUser.dateOfBirth || dateOfBirthVal);

  const addressVal = toStringValue(pickFirst(userSource, ['address'])) || toStringValue(pickFirst(dashboardSource, ['address'])) || storedUser.address;
  const address = (addressVal && addressVal.toLowerCase() !== 'not added yet')
    ? addressVal
    : (storedUser.address || addressVal);

  return {
    ...emptyUserProfile,
    ...storedUser,
    id:
      toStringValue(pickFirst(userSource, ['id', 'userId'])) ||
      toStringValue(pickFirst(dashboardSource, ['userId', 'id'])) ||
      storedUser.id,
    name,
    email,
    mobile,
    referralCode:
      toStringValue(pickFirst(userSource, ['referralCode', 'referredByCode'])) ||
      toStringValue(pickFirst(dashboardSource, ['referralCode', 'referredByCode', 'referralId'])) ||
      storedUser.referralCode,
    memberSince:
      formatDisplayDate(pickFirst(userSource, ['createdAt', 'memberSince', 'joinedAt']), storedUser.memberSince || 'Recently') ||
      storedUser.memberSince,
    kycStatus: normalizeKycStatus(
      pickFirst(userSource, ['kycStatus']) ?? pickFirst(dashboardSource, ['kycStatus']) ?? pickFirst(bankSource, ['kycStatus'])
    ),
    levelTitle:
      toStringValue(pickFirst(userSource, ['levelTitle', 'accountStatus'])) ||
      toStringValue(pickFirst(dashboardSource, ['accountStatus', 'onboardingStatus'])) ||
      storedUser.levelTitle ||
      'Investor',
    dateOfBirth,
    address,
    bankMask,
    accountHolderName,
    bankName,
    ifscCode,
    panNumber,
    aadhaarMasked,
    initials: getInitials(name || 'Investor'),
    bankVerified:
      Boolean(pickFirst(userSource, ['bankVerified'])) ||
      Boolean(pickFirst(dashboardSource, ['bankVerified'])) ||
      Boolean(pickFirst(bankSource, ['bankVerified'])) ||
      storedUser.bankVerified,
    onboardingStatus:
      toStringValue(pickFirst(userSource, ['onboardingStatus', 'accountStatus'])) ||
      toStringValue(pickFirst(dashboardSource, ['onboardingStatus', 'accountStatus'])) ||
      storedUser.onboardingStatus,
  };
};

const buildDashboardMetrics = (
  dashboardSource: UnknownRecord,
  walletSource: UnknownRecord,
  teamLevels: TeamLevel[],
  totalInvestedFallback: number
): DashboardMetrics => {
  const metricsSource = Object.keys(pickRecord(dashboardSource, ['metrics', 'summary'])).length
    ? pickRecord(dashboardSource, ['metrics', 'summary'])
    : dashboardSource;

  const activeTeamCount =
    toNumber(pickFirst(metricsSource, ['activeTeamCount', 'activeMembers', 'activeTeamMembers'])) ||
    teamLevels.reduce((total, level) => total + level.members, 0);
  const referralEarnings =
    toNumber(pickFirst(metricsSource, ['referralEarnings', 'totalCommission', 'commissionEarned'])) ||
    teamLevels.reduce((total, level) => total + level.earnings, 0);

  const walletAvailable =
    toNumber(pickFirst(metricsSource, ['availableBalance'])) ||
    toNumber(pickFirst(walletSource, ['availableBalance']));
  const walletLocked = toNumber(pickFirst(walletSource, ['lockedBalance', 'holdBalance']));

  return {
    walletBalance:
      toNumber(pickFirst(metricsSource, ['walletBalance', 'balance'])) ||
      toNumber(pickFirst(walletSource, ['balance', 'walletBalance'])) ||
      (walletAvailable + walletLocked),
    availableBalance: walletAvailable,
    totalInvested: toNumber(pickFirst(metricsSource, ['totalInvested', 'investedAmount', 'totalInvestment'])) || totalInvestedFallback,
    totalEarnings: toNumber(pickFirst(metricsSource, ['totalEarnings', 'totalProfit', 'totalReturns', 'interestEarned'])),
    referralEarnings,
    activeTeamCount,
    totalTeamInvested: toNumber(pickFirst(metricsSource, ['totalTeamInvested', 'teamInvestment'])),
    monthlyGrowth: toNumber(pickFirst(metricsSource, ['monthlyGrowth', 'monthlyInterestRate', 'growthRate'])),
  };
};

const synthesizeProjectionSeries = (activeInvestments: ActiveInvestment[]): EarningsPoint[] => {
  if (!activeInvestments.length) {
    return [];
  }

  return activeInvestments.slice(0, 6).map((investment, index) => ({
    label: `M${index + 1}`,
    value: investment.earned + investment.amount * (investment.roi / 100),
  }));
};

export const dashboardService = {
  getDashboard: async () => {
    const [dashboardResponse, bankResponse, walletResponse, teamResponse, investmentsResponse] = await Promise.all([
      apiClient.get('/api/dashboard').catch(() => ({ data: {} })),
      apiClient.get('/api/bank/details').catch(() => ({ data: {} })),
      apiClient.get('/api/wallet').catch(() => ({ data: {} })),
      apiClient.get('/api/referrals/tree').catch(() => ({ data: {} })),
      apiClient.get('/api/investments').catch(() => ({ data: [] })),
    ]);
    const dashboardSource = asRecord(dashboardResponse.data);
    const bankSource = asRecord(bankResponse.data);
    const rootWalletSource = asRecord(walletResponse.data);
    const walletSource = rootWalletSource.wallet ? asRecord(rootWalletSource.wallet) : rootWalletSource;

    const teamSource = asRecord(teamResponse.data);
    const teamLevelsRaw = Array.isArray(teamSource.levels) ? teamSource.levels : pickArray(teamSource, ['levels', 'teamLevels', 'tree']);
    const teamLevels = teamLevelsRaw.length ? teamLevelsRaw.map(mapTeamLevel) : pickArray(dashboardSource, ['teamLevels', 'levels', 'commissionLevels']).map(mapTeamLevel);

    const investmentsRaw = Array.isArray(investmentsResponse.data) ? investmentsResponse.data : pickArray(asRecord(investmentsResponse.data), ['investments', 'items', 'data', 'content']);
    const totalInvestedFallback = investmentsRaw.reduce((sum, inv) => sum + toNumber(pickFirst(asRecord(inv), ['amount', 'investedAmount', 'principal'])), 0);

    const user = buildUserProfile(dashboardSource, bankSource);
    const metrics = buildDashboardMetrics(dashboardSource, walletSource, teamLevels, totalInvestedFallback);
    const announcements = pickArray(dashboardSource, ['announcements', 'news', 'updates']).map(mapAnnouncement);
    const earningsSeries = pickArray(dashboardSource, ['earningsSeries', 'chart', 'trend']).map(mapSeriesPoint);
    const recentTransactions = pickArray(dashboardSource, ['recentTransactions', 'transactions', 'history']).map(mapTransaction);
    const recentEarnings = pickArray(dashboardSource, ['recentEarnings', 'earnings', 'profits']).map(mapTransaction);

    return {
      user,
      metrics,
      announcements,
      earningsSeries,
      teamLevels,
      recentTransactions,
      recentEarnings,
      referralLink: `https://anushatrade.com/ref/${user.referralCode || 'ABCD1234'}`,
    } satisfies DashboardPayload;
  },
  getInvestments: async () => {
    const [plansResponse, investmentsResponse] = await Promise.all([
      apiClient.get('/api/plans'),
      apiClient.get('/api/investments'),
    ]);

    const plansRaw = Array.isArray(plansResponse.data) ? plansResponse.data : pickArray(asRecord(plansResponse.data), ['plans', 'items', 'data', 'content']);
    const investmentsSource = asRecord(investmentsResponse.data);
    const plans = plansRaw.map(mapPlan);
    const planLookup = new Map(plans.map((plan) => [plan.id, plan]));
    const investmentItems = pickArray(investmentsSource, ['investments', 'items', 'data', 'content']);
    const activeInvestments = investmentItems
      .filter((item) => {
        const status = toStringValue(pickFirst(asRecord(item), ['status', 'investmentStatus'])).toUpperCase();
        return !status || status.includes('ACTIVE') || status.includes('MATURED') || status.includes('COMPLETED');
      })
      .map((item, index) => mapActiveInvestment(item, index, planLookup));
    const projectionSeries = pickArray(investmentsSource, ['projectionSeries', 'chart', 'earningsSeries']).map(mapSeriesPoint);

    return {
      ...emptyInvestmentPayload,
      plans,
      activeInvestments,
      history: investmentItems.map(mapTransaction),
      projectionSeries: projectionSeries.length ? projectionSeries : synthesizeProjectionSeries(activeInvestments),
    } satisfies InvestmentPayload;
  },
  getWallet: async () => {
    const [walletResponse, transactionResponse, withdrawalResponse] = await Promise.all([
      apiClient.get('/api/wallet'),
      apiClient.get('/api/wallet/transactions').catch(() => ({ data: [] })),
      apiClient.get('/api/withdrawals').catch(() => ({ data: [] })),
    ]);

    const rootWalletSource = asRecord(walletResponse.data);
    const walletSource = rootWalletSource.wallet ? asRecord(rootWalletSource.wallet) : rootWalletSource;
    
    const recentTxns = Array.isArray(rootWalletSource.recentTransactions) ? rootWalletSource.recentTransactions as any[] : pickArray(rootWalletSource, ['recentTransactions', 'transactions']);
    const walletTransactions = Array.isArray(transactionResponse.data) ? transactionResponse.data : pickArray(asRecord(transactionResponse.data), ['transactions', 'items', 'data', 'content']);
    const withdrawalTransactions = Array.isArray(withdrawalResponse.data) ? withdrawalResponse.data : pickArray(asRecord(withdrawalResponse.data), ['withdrawals', 'items', 'data', 'content']);
    
    // Since recentTxns is a subset of walletTransactions, we should only use recentTxns if walletTransactions is empty to avoid duplicates
    const allWalletTransactions = walletTransactions.length > 0 ? walletTransactions : recentTxns;
    
    // Sort transactions by date descending to ensure latest are on top
    const transactions = [...allWalletTransactions, ...withdrawalTransactions]
      .map(mapTransaction)
      .sort((a, b) => {
        // Fallback to string comparison if date parsing fails, otherwise use timestamp
        const timeA = new Date(a.timestamp).getTime();
        const timeB = new Date(b.timestamp).getTime();
        if (!isNaN(timeA) && !isNaN(timeB)) return timeB - timeA;
        return 0; // maintain original order if invalid dates
      });

    const availableBalance = toNumber(pickFirst(walletSource, ['availableBalance']));
    const lockedBalance = toNumber(pickFirst(walletSource, ['lockedBalance', 'holdBalance']));
    const balance = toNumber(pickFirst(walletSource, ['balance', 'walletBalance'])) || (availableBalance + lockedBalance);

    return {
      ...emptyWalletPayload,
      balance,
      availableBalance,
      lockedBalance,
      paymentMethods: pickArray(walletSource, ['paymentMethods', 'methods']).map((item) =>
        toStringValue(pickFirst(asRecord(item), ['label', 'name', 'bankName']), toStringValue(item))
      ),
      analytics: pickArray(walletSource, ['analytics', 'trend', 'series']).map((item, index) => ({
        label: toStringValue(pickFirst(asRecord(item), ['label', 'month', 'name']), `P${index + 1}`),
        value: toNumber(pickFirst(asRecord(item), ['value', 'amount', 'balance'])),
      })),
      transactions,
    } satisfies WalletPayload;
  },
  getTeam: async () => {
    const [treeResponse, commissionResponse] = await Promise.all([
      apiClient.get('/api/referrals/tree').catch(() => ({ data: {} })),
      apiClient.get('/api/referrals/commissions').catch(() => ({ data: [] })),
    ]);

    const treeSource = asRecord(treeResponse.data);
    
    // Parse /api/referrals/tree which can return { levels: [...] } or { tree: { 1: [...], 2: [...] } }
    let levels = pickArray(treeSource, ['levels']).map(mapTeamLevel);
    
    if (levels.length === 0 && treeSource.tree && typeof treeSource.tree === 'object') {
      const treeObj = treeSource.tree as Record<string, any[]>;
      levels = Object.keys(treeObj).map((lvlKey) => {
        const membersList = Array.isArray(treeObj[lvlKey]) ? treeObj[lvlKey] : [];
        const lvlNum = Number(lvlKey) || 1;
        return {
          level: lvlNum,
          members: membersList.length,
          earnings: 0,
          commission: 6 - lvlNum, // 5%, 4%, 3%, 2%, 1%
          growth: 0,
        };
      });
    }

    if (levels.length === 0) {
      levels = [1, 2, 3, 4, 5].map((lvl) => ({
        level: lvl,
        members: 0,
        earnings: 0,
        commission: 6 - lvl,
        growth: 0,
      }));
    }
    
    // Map levels to tree format
    const tree = levels.map((lvl) => ({
      id: `level-${lvl.level}`,
      title: `Level ${lvl.level}`,
      subtitle: 'Referral level',
      members: lvl.members,
      earnings: lvl.earnings,
      commission: lvl.commission,
    }));
    
    const totalMembers =
      toNumber(pickFirst(treeSource, ['totalMembers', 'memberCount'])) ||
      levels.reduce((total, level) => total + level.members, 0);
    const activeMembers =
      toNumber(pickFirst(treeSource, ['activeMembers', 'activeTeamCount'])) ||
      totalMembers;

    return {
      ...emptyTeamPayload,
      totalMembers,
      activeMembers,
      tree,
      levels,
      weeklyGrowthSeries: pickArray(treeSource, ['weeklyGrowthSeries', 'growthSeries', 'chart']).map(mapSeriesPoint),
    } satisfies TeamPayload;
  },
  getNotifications: async () => {
    const response = await apiClient.get('/api/notifications');
    const source = asRecord(response.data);

    return {
      ...emptyNotificationPayload,
      items: pickArray(source, ['notifications', 'items', 'data', 'content']).map(mapNotification),
    } satisfies NotificationPayload;
  },
  getNotificationPreferences: async () => {
    try {
      const response = await apiClient.get<Record<string, any>>('/api/notifications/preferences');
      const d = response.data || {};
      return {
        emailUpdates: Boolean(d.emailUpdates ?? d.email ?? true),
        pushNotifications: Boolean(d.pushNotifications ?? d.push ?? true),
        smsUpdates: Boolean(d.smsUpdates ?? d.sms ?? true),
        marketing: Boolean(d.marketing ?? d.whatsapp ?? false),
        email: Boolean(d.email ?? d.emailUpdates ?? true),
        push: Boolean(d.push ?? d.pushNotifications ?? true),
        sms: Boolean(d.sms ?? d.smsUpdates ?? true),
        whatsapp: Boolean(d.whatsapp ?? d.marketing ?? false),
      };
    } catch {
      return {
        emailUpdates: true,
        pushNotifications: true,
        smsUpdates: true,
        marketing: false,
        email: true,
        push: true,
        sms: true,
        whatsapp: false,
      };
    }
  },
  updateNotificationPreferences: async (preferences: {
    emailUpdates?: boolean;
    pushNotifications?: boolean;
    smsUpdates?: boolean;
    marketing?: boolean;
    email?: boolean;
    push?: boolean;
    sms?: boolean;
    whatsapp?: boolean;
  }) => {
    const payload = {
      email: Boolean(preferences.email ?? preferences.emailUpdates ?? true),
      emailUpdates: Boolean(preferences.emailUpdates ?? preferences.email ?? true),
      push: Boolean(preferences.push ?? preferences.pushNotifications ?? true),
      pushNotifications: Boolean(preferences.pushNotifications ?? preferences.push ?? true),
      sms: Boolean(preferences.sms ?? preferences.smsUpdates ?? true),
      smsUpdates: Boolean(preferences.smsUpdates ?? preferences.sms ?? true),
      whatsapp: Boolean(preferences.whatsapp ?? preferences.marketing ?? false),
      marketing: Boolean(preferences.marketing ?? preferences.whatsapp ?? false),
    };
    const response = await apiClient.put('/api/notifications/preferences', payload);
    return response.data;
  },
  getSessions: async () => {
    const user = useAuthStore.getState().user;

    if (!user) {
      return { sessions: [] };
    }

    const currentSession: SessionItem = {
      id: `${user.id || 'current'}-device`,
      device: Platform.OS === 'android' ? 'Android Device' : Platform.OS === 'ios' ? 'iPhone' : 'Web Session',
      location: 'Current device',
      ipAddress: 'Protected',
      lastActive: formatDisplayDate(new Date().toISOString(), 'Just now'),
      current: true,
      platform: Platform.OS === 'ios' ? 'ios' : Platform.OS === 'web' ? 'web' : 'android',
    };

    return { sessions: [currentSession] };
  },
  markNotificationRead: async (notificationId: string) => {
    if (!notificationId.trim()) {
      return;
    }

    await apiClient.post(`/api/notifications/${notificationId}/read`);
  },
  getWithdrawalSettings: async () => {
    try {
      const response = await apiClient.get<Record<string, any>>('/api/withdrawals/settings');
      const data = response.data || {};
      return {
        minimumWithdrawalAmount: toNumber(data.minimumWithdrawalAmount, 1000),
        maximumWithdrawalAmount: toNumber(data.maximumWithdrawalAmount, 500000),
        withdrawalEnabled: data.withdrawalEnabled !== false,
        feePercentage: toNumber(data.feePercentage, 0),
      };
    } catch {
      return {
        minimumWithdrawalAmount: 1000,
        maximumWithdrawalAmount: 500000,
        withdrawalEnabled: true,
        feePercentage: 0,
      };
    }
  },
  requestWithdrawal: async (requestedAmount: number) => {
    if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
      throw new Error('Enter a valid withdrawal amount.');
    }

    const response = await apiClient.post('/api/withdrawals/request', {
      requestedAmount,
    });

    return response.data;
  },
  getStatements: async (): Promise<any> => {
    const response = await apiClient.get('/api/statements');
    return response.data;
  },
  getSecuritySummary: async (): Promise<any> => {
    const response = await apiClient.get('/api/security/summary');
    return response.data;
  },
  getNotificationSummary: async (): Promise<any> => {
    const response = await apiClient.get('/api/notifications/summary');
    return response.data;
  },
  markAllNotificationsRead: async (): Promise<any> => {
    const response = await apiClient.post('/api/notifications/read-all');
    return response.data;
  },
  deleteNotification: async (notificationId: string): Promise<any> => {
    if (!notificationId.trim()) {
      return;
    }
    const response = await apiClient.delete(`/api/notifications/${notificationId}`);
    return response.data;
  },
};
