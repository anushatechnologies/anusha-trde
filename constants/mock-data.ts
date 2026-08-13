import {
  ActiveInvestment,
  Announcement,
  AppNotification,
  DashboardMetrics,
  EarningsPoint,
  Plan,
  SessionItem,
  TeamLevel,
  TeamTreeNode,
  TransactionItem,
  UserProfile,
  WalletAnalyticsPoint,
} from '../types';

export const mockUser: UserProfile = {
  id: 'ABCD1234',
  name: 'Aman Verma',
  email: 'aman@investapp.com',
  mobile: '+919876543210',
  profilePhoto: '',
  referralCode: 'ABCD1234',
  memberSince: '15 May 2024',
  kycStatus: 'APPROVED',
  bankVerified: true,
  onboardingStatus: 'ACTIVE',
  levelTitle: 'Gold Partner',
  dateOfBirth: '1995-08-12',
  address: '123 Main Street, Pune, Maharashtra, India',
  bankMask: 'A/C **** 2810',
  accountHolderName: 'Aman Verma',
  bankName: 'HDFC Bank',
  ifscCode: 'HDFC0001234',
  panNumber: 'ABCDE1234F',
  aadhaarMasked: 'XXXX XXXX 4321',
  initials: 'AV',
  biometricEnabled: true,
  passwordConfigured: true,
  mpinConfigured: true,
  communicationConsent: true,
  investorAgreementAccepted: true,
  riskDisclosureAccepted: true,
  accountStatus: 'ACTIVE',
};

export const mockMetrics: DashboardMetrics = {
  walletBalance: 45680.5,
  availableBalance: 12680.5,
  totalInvested: 25000,
  totalEarnings: 20680.5,
  referralEarnings: 8450,
  activeTeamCount: 23,
  totalTeamInvested: 12850,
  monthlyGrowth: 18.4,
};

export const mockAnnouncements: Announcement[] = [
  {
    id: 'ann-1',
    title: 'Premium payout cycle is live',
    message: 'Daily ROI settlements are now visible earlier in the wallet timeline.',
    tag: 'Product',
  },
  {
    id: 'ann-2',
    title: 'Referral boost weekend',
    message: 'Direct referrals verified this week earn an additional activation bonus.',
    tag: 'Referral',
  },
  {
    id: 'ann-3',
    title: 'Security reminder',
    message: 'Review active sessions and enable biometric access for faster secure login.',
    tag: 'Security',
  },
];

export const earningsSeries: EarningsPoint[] = [
  { label: 'Mon', value: 220 },
  { label: 'Tue', value: 360 },
  { label: 'Wed', value: 410 },
  { label: 'Thu', value: 520 },
  { label: 'Fri', value: 690 },
  { label: 'Sat', value: 740 },
  { label: 'Sun', value: 810 },
];

export const walletAnalytics: WalletAnalyticsPoint[] = [
  { label: 'Jan', value: 4200 },
  { label: 'Feb', value: 5100 },
  { label: 'Mar', value: 6900 },
  { label: 'Apr', value: 7300 },
  { label: 'May', value: 8100 },
];

export const projectionSeries: EarningsPoint[] = [
  { label: '30D', value: 4200 },
  { label: '60D', value: 9100 },
  { label: '90D', value: 13800 },
  { label: '120D', value: 18900 },
];

export const teamGrowthSeries: EarningsPoint[] = [
  { label: 'L1', value: 5 },
  { label: 'L2', value: 12 },
  { label: 'L3', value: 24 },
  { label: 'L4', value: 45 },
  { label: 'L5', value: 80 },
  { label: 'L6', value: 120 },
];

export const investmentPlans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter Plan',
    roi: 5,
    minInvestment: 1000,
    maxInvestment: 10000,
    termDays: 30,
    activeInvestors: 148,
    accent: '#60A5FA',
    description: 'Ideal for first-time investors looking for stable daily returns.',
  },
  {
    id: 'standard',
    name: 'Standard Plan',
    roi: 7,
    minInvestment: 10001,
    maxInvestment: 50000,
    termDays: 45,
    activeInvestors: 92,
    accent: '#F59E0B',
    description: 'Balanced growth for active earners and referral network builders.',
  },
  {
    id: 'premium',
    name: 'Premium Plan',
    roi: 9,
    minInvestment: 50001,
    maxInvestment: 100000,
    termDays: 60,
    activeInvestors: 41,
    accent: '#22C55E',
    description: 'High-yield premium plan with strong daily profit projection.',
  },
];

export const activeInvestments: ActiveInvestment[] = [
  {
    id: 'act-1',
    planId: 'premium',
    planName: 'Premium Plan',
    amount: 15000,
    roi: 9,
    progress: 0.78,
    nextPayout: 'Today, 09:30 PM',
    earned: 3280,
    status: 'Running',
  },
  {
    id: 'act-2',
    planId: 'starter',
    planName: 'Starter Plan',
    amount: 10000,
    roi: 5,
    progress: 0.42,
    nextPayout: 'Tomorrow, 09:30 PM',
    earned: 920,
    status: 'Running',
  },
];

export const transactions: TransactionItem[] = [
  {
    id: 'txn-1',
    title: 'Investment Top-up',
    amount: -5000,
    type: 'deposit',
    status: 'debited',
    timestamp: 'Today, 10:30 AM',
    note: 'Starter Plan activation',
  },
  {
    id: 'txn-2',
    title: 'Referral Commission',
    amount: 500,
    type: 'commission',
    status: 'credited',
    timestamp: 'Today, 09:15 AM',
    note: 'Level 1 referral payout',
  },
  {
    id: 'txn-3',
    title: 'Withdrawal',
    amount: -2000,
    type: 'withdrawal',
    status: 'processing',
    timestamp: 'Yesterday, 04:30 PM',
    note: 'Primary bank account',
  },
  {
    id: 'txn-4',
    title: 'Daily ROI Profit',
    amount: 300,
    type: 'profit',
    status: 'credited',
    timestamp: 'Yesterday, 11:20 AM',
    note: 'Premium Plan cycle',
  },
  {
    id: 'txn-5',
    title: 'Team Bonus',
    amount: 840,
    type: 'commission',
    status: 'credited',
    timestamp: 'Monday, 07:10 PM',
    note: 'Level network bonus',
  },
];

export const notifications: AppNotification[] = [
  {
    id: 'noti-1',
    title: 'Daily earnings credited',
    description: 'Your Premium Plan credited today’s ROI to wallet balance.',
    time: '2m ago',
    read: false,
    type: 'earning',
  },
  {
    id: 'noti-2',
    title: 'New referral joined',
    description: 'Rohan Sharma registered using your referral link.',
    time: '18m ago',
    read: false,
    type: 'referral',
  },
  {
    id: 'noti-3',
    title: 'Withdrawal is processing',
    description: 'Your withdrawal request is queued for bank transfer review.',
    time: '1h ago',
    read: true,
    type: 'investment',
  },
  {
    id: 'noti-4',
    title: 'New login alert',
    description: 'A Safari session was opened from your current location.',
    time: '3h ago',
    read: true,
    type: 'security',
  },
];

export const sessions: SessionItem[] = [
  {
    id: 'ses-1',
    device: 'iPhone 15 Pro',
    location: 'Mumbai, India',
    ipAddress: '103.42.116.8',
    lastActive: 'Just now',
    current: true,
    platform: 'ios',
  },
  {
    id: 'ses-2',
    device: 'Samsung S24 Ultra',
    location: 'Pune, India',
    ipAddress: '49.37.22.54',
    lastActive: 'Today, 07:48 PM',
    current: false,
    platform: 'android',
  },
  {
    id: 'ses-3',
    device: 'Chrome on MacBook Pro',
    location: 'Remote session',
    ipAddress: '103.42.116.8',
    lastActive: 'Yesterday, 10:22 PM',
    current: false,
    platform: 'web',
  },
];

export const teamLevels: TeamLevel[] = [
  { level: 1, members: 5, earnings: 500, commission: 5, growth: 18 },
  { level: 2, members: 12, earnings: 480, commission: 4, growth: 15 },
  { level: 3, members: 24, earnings: 960, commission: 3, growth: 12 },
  { level: 4, members: 45, earnings: 1350, commission: 2, growth: 10 },
  { level: 5, members: 80, earnings: 1600, commission: 1, growth: 8 },
  { level: 6, members: 120, earnings: 1440, commission: 0.5, growth: 6 },
];

export const teamTree: TeamTreeNode[] = [
  { id: 'node-1', title: 'Level 1', subtitle: 'Direct partners', members: 5, earnings: 500, commission: 5 },
  { id: 'node-2', title: 'Level 2', subtitle: 'Growth partners', members: 12, earnings: 480, commission: 4 },
  { id: 'node-3', title: 'Level 3', subtitle: 'Builder network', members: 24, earnings: 960, commission: 3 },
  { id: 'node-4', title: 'Level 4', subtitle: 'Core team', members: 45, earnings: 1350, commission: 2 },
  { id: 'node-5', title: 'Level 5', subtitle: 'Leadership layer', members: 80, earnings: 1600, commission: 1 },
  { id: 'node-6', title: 'Level 6', subtitle: 'Executive growth', members: 120, earnings: 1440, commission: 0.5 },
];

export const paymentMethods = ['UPI', 'Bank Transfer', 'USDT (TRC20)', 'IMPS'];
export const referralLink = `https://investapp.com/ref/${mockUser.referralCode}`;
