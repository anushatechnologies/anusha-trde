export type AuthMode = 'mobile' | 'email';
export type OtpPurpose = 'login' | 'register' | 'reset';
export type SignupStatus =
  | 'MOBILE_VERIFIED'
  | 'PROFILE_COMPLETED'
  | 'PASSWORD_CREATED'
  | 'TERMS_ACCEPTED'
  | 'KYC_COMPLETED'
  | 'BANK_LINKED'
  | 'ACCOUNT_ACTIVATED'
  | 'MPIN_CREATED'
  | 'ACTIVE';
export type TransactionType = 'deposit' | 'withdrawal' | 'commission' | 'profit';
export type TransactionStatus = 'credited' | 'debited' | 'processing';
export type NotificationType = 'earning' | 'investment' | 'referral' | 'security';
export type SessionPlatform = 'ios' | 'android' | 'web';

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

export type KycStatusValue = 'NOT_SUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'REUPLOAD_REQUIRED';

export type WhatsAppReceiptStatus =
  | 'NOT_SENT'
  | 'QUEUED'
  | 'SENDING'
  | 'SENT'
  | 'DELIVERED'
  | 'READ'
  | 'FAILED';

export type EmailReceiptStatus =
  | 'NOT_SENT'
  | 'QUEUED'
  | 'SENDING'
  | 'SENT'
  | 'DELIVERED'
  | 'FAILED';

export type ReceiptDetails = {
  receiptNumber?: string;
  receiptUrl?: string;
  emailStatus?: EmailReceiptStatus;
  whatsappStatus?: WhatsAppReceiptStatus;
  available?: boolean;
};

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  mobile: string;
  profilePhoto: string;
  referralCode: string;
  memberSince: string;
  kycStatus: KycStatusValue;
  levelTitle: string;
  dateOfBirth: string;
  address: string;
  bankMask: string;
  accountHolderName: string;
  bankName: string;
  ifscCode: string;
  panNumber: string;
  aadhaarMasked: string;
  initials: string;
  biometricEnabled: boolean;
  passwordConfigured: boolean;
  mpinConfigured: boolean;
  investorAgreementAccepted: boolean;
  riskDisclosureAccepted: boolean;
  communicationConsent: boolean;
  accountStatus: SignupStatus;
  bankVerified: boolean;
  onboardingStatus: string;
};

export type DashboardMetrics = {
  walletBalance: number;
  availableBalance: number;
  totalInvested: number;
  totalEarnings: number;
  referralEarnings: number;
  activeTeamCount: number;
  totalTeamInvested: number;
  monthlyGrowth: number;
};

export type Announcement = {
  id: string;
  title: string;
  message: string;
  tag: string;
};

export type EarningsPoint = {
  label: string;
  value: number;
};

export type TeamLevel = {
  level: number;
  members: number;
  earnings: number;
  commission: number;
  growth: number;
};

export type Plan = {
  id: string;
  name: string;
  roi: number;
  minInvestment: number;
  maxInvestment: number;
  termDays: number;
  activeInvestors: number;
  accent: string;
  description: string;
};

export type ActiveInvestment = {
  id: string;
  planId: string;
  planName: string;
  amount: number;
  roi: number;
  progress: number;
  nextPayout: string;
  earned: number;
  status: 'Running' | 'Completed';
  receipt?: ReceiptDetails;
};

export type WalletAnalyticsPoint = {
  label: string;
  value: number;
};

export type TransactionItem = {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  timestamp: string;
  note: string;
  receipt?: ReceiptDetails;
};

export type AppNotification = {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: NotificationType;
};

export type SessionItem = {
  id: string;
  device: string;
  location: string;
  ipAddress: string;
  lastActive: string;
  current: boolean;
  platform: SessionPlatform;
};

export type TeamTreeNode = {
  id: string;
  title: string;
  subtitle: string;
  members: number;
  earnings: number;
  commission: number;
};

export type DashboardPayload = {
  user: UserProfile;
  metrics: DashboardMetrics;
  announcements: Announcement[];
  earningsSeries: EarningsPoint[];
  teamLevels: TeamLevel[];
  recentTransactions: TransactionItem[];
  recentEarnings: TransactionItem[];
  referralLink: string;
};

export type WalletPayload = {
  balance: number;
  availableBalance: number;
  lockedBalance: number;
  paymentMethods: string[];
  analytics: WalletAnalyticsPoint[];
  transactions: TransactionItem[];
};

export type InvestmentPayload = {
  plans: Plan[];
  activeInvestments: ActiveInvestment[];
  history: TransactionItem[];
  projectionSeries: EarningsPoint[];
};

export type TeamPayload = {
  totalMembers: number;
  activeMembers: number;
  tree: TeamTreeNode[];
  levels: TeamLevel[];
  weeklyGrowthSeries: EarningsPoint[];
};

export type NotificationPayload = {
  items: AppNotification[];
};
