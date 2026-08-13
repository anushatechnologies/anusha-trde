import {
  ActiveInvestment,
  Announcement,
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
  WalletAnalyticsPoint,
  WalletPayload,
} from '../types';

const defaultProfilePhoto = '';

export const emptyUserProfile: UserProfile = {
  id: '',
  name: '',
  email: '',
  mobile: '',
  profilePhoto: defaultProfilePhoto,
  referralCode: '',
  memberSince: '',
  kycStatus: 'NOT_SUBMITTED',
  levelTitle: '',
  dateOfBirth: '',
  address: '',
  bankMask: '',
  accountHolderName: '',
  bankName: '',
  ifscCode: '',
  panNumber: '',
  aadhaarMasked: '',
  initials: '',
  biometricEnabled: false,
  passwordConfigured: false,
  mpinConfigured: false,
  communicationConsent: false,
  investorAgreementAccepted: false,
  riskDisclosureAccepted: false,
  accountStatus: 'MOBILE_VERIFIED',
  bankVerified: false,
  onboardingStatus: '',
};

export const emptyDashboardMetrics: DashboardMetrics = {
  walletBalance: 0,
  availableBalance: 0,
  totalInvested: 0,
  totalEarnings: 0,
  referralEarnings: 0,
  activeTeamCount: 0,
  totalTeamInvested: 0,
  monthlyGrowth: 0,
};

export const emptyAnnouncements: Announcement[] = [];
export const emptyEarningsSeries: EarningsPoint[] = [];
export const emptyWalletAnalytics: WalletAnalyticsPoint[] = [];
export const emptyProjectionSeries: EarningsPoint[] = [];
export const emptyTeamGrowthSeries: EarningsPoint[] = [];
export const emptyInvestmentPlans: Plan[] = [];
export const emptyActiveInvestments: ActiveInvestment[] = [];
export const emptyTransactions: TransactionItem[] = [];
export const emptyNotifications: AppNotification[] = [];
export const emptySessions: SessionItem[] = [];
export const emptyTeamLevels: TeamLevel[] = [];
export const emptyTeamTree: TeamTreeNode[] = [];
export const emptyPaymentMethods: string[] = [];
export const emptyReferralLink = '';

export const emptyDashboardPayload: DashboardPayload = {
  user: emptyUserProfile,
  metrics: emptyDashboardMetrics,
  announcements: emptyAnnouncements,
  earningsSeries: emptyEarningsSeries,
  teamLevels: emptyTeamLevels,
  recentTransactions: emptyTransactions,
  recentEarnings: emptyTransactions,
  referralLink: emptyReferralLink,
};

export const emptyWalletPayload: WalletPayload = {
  balance: 0,
  availableBalance: 0,
  lockedBalance: 0,
  paymentMethods: emptyPaymentMethods,
  analytics: emptyWalletAnalytics,
  transactions: emptyTransactions,
};

export const emptyInvestmentPayload: InvestmentPayload = {
  plans: emptyInvestmentPlans,
  activeInvestments: emptyActiveInvestments,
  history: emptyTransactions,
  projectionSeries: emptyProjectionSeries,
};

export const emptyTeamPayload: TeamPayload = {
  totalMembers: 0,
  activeMembers: 0,
  tree: emptyTeamTree,
  levels: emptyTeamLevels,
  weeklyGrowthSeries: emptyTeamGrowthSeries,
};

export const emptyNotificationPayload: NotificationPayload = {
  items: emptyNotifications,
};
