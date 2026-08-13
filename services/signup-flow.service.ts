import { emptyUserProfile } from '../constants/app-defaults';
import { AuthTokens, SignupStatus, UserProfile } from '../types';
import { getInitials } from '../utils/format';
import { readSecure, removeSecure, writeSecure } from '../utils/storage';

const SIGNUP_DRAFT_KEY = 'investapp.auth.signup-draft';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;
const CURRENT_SIGNUP_FLOW_VERSION = 3;

export const signupStepRoutes = [
  '/signup/mobile',
  '/signup/otp',
  '/signup/profile',
  '/signup/password',
  '/signup/referral',
  '/signup/terms',
  '/signup/kyc',
  '/signup/kyc-status',
  '/signup/bank',
  '/signup/activate',
  '/signup/mpin',
] as const;

export const getSignupRouteForStep = (stepIndex: number) =>
  signupStepRoutes[Math.min(Math.max(stepIndex, 0), signupStepRoutes.length - 1)];

type AuthSession = {
  user: UserProfile;
  tokens: AuthTokens;
};

export type SignupDraft = {
  flowVersion: number;
  countryCode: string;
  mobile: string;
  otpVerified: boolean;
  otpVerifiedAt: string;
  signupVerificationToken: string;
  verificationProvider: string;
  currentStep: number;
  profilePhoto: string;
  panCardPhoto: string;
  aadhaarFrontPhoto: string;
  aadhaarBackPhoto: string;
  selfiePhoto: string;
  bankPassbookPhoto: string;
  email: string;
  referredByCode: string;
  password: string;
  investorAgreementAccepted: boolean;
  riskDisclosureAccepted: boolean;
  communicationConsent: boolean;
  mpin: string;
  biometricEnabled: boolean;
  fullName: string;
  dateOfBirth: string;
  address: string;
  panNumber: string;
  aadhaarNumber: string;
  aadhaarOtpVerified: boolean;
  selfieConfirmed: boolean;
  livenessVerified: boolean;
  supportingDocumentType: string;
  esignAccepted: boolean;
  accountHolderName: string;
  accountNumber: string;
  confirmAccountNumber: string;
  bankName: string;
  ifscCode: string;
  bankVerified: boolean;
  accountActivated: boolean;
  signupStatus: SignupStatus;
};

const formatMemberSince = (value = new Date()) =>
  new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(value);

const normalizeDigits = (value: string) => value.replace(/\D/g, '');

const maskBankAccount = (value: string) => {
  const digits = normalizeDigits(value);

  if (!digits) {
    return '';
  }

  return `A/C **** ${digits.slice(-4)}`;
};

const maskAadhaarNumber = (value: string) => {
  const digits = normalizeDigits(value);

  if (!digits) {
    return '';
  }

  return `XXXX XXXX ${digits.slice(-4).padStart(4, '0')}`;
};

const generateReferralCode = (name: string, mobile: string) => {
  const initials = getInitials(name).replace(/[^A-Z]/g, '').padEnd(2, 'A').slice(0, 2);
  const digits = normalizeDigits(mobile).slice(-4).padStart(4, '0');
  return `ANU${initials}${digits}`;
};

export const createSignupDraft = (partial: Partial<SignupDraft> = {}): SignupDraft => ({
  flowVersion: CURRENT_SIGNUP_FLOW_VERSION,
  countryCode: '+91',
  mobile: '',
  otpVerified: false,
  otpVerifiedAt: '',
  signupVerificationToken: '',
  verificationProvider: '',
  currentStep: 0,
  profilePhoto: '',
  panCardPhoto: '',
  aadhaarFrontPhoto: '',
  aadhaarBackPhoto: '',
  selfiePhoto: '',
  bankPassbookPhoto: '',
  email: '',
  referredByCode: '',
  password: '',
  investorAgreementAccepted: false,
  riskDisclosureAccepted: false,
  communicationConsent: false,
  mpin: '',
  biometricEnabled: false,
  fullName: '',
  dateOfBirth: '',
  address: '',
  panNumber: '',
  aadhaarNumber: '',
  aadhaarOtpVerified: false,
  selfieConfirmed: false,
  livenessVerified: false,
  supportingDocumentType: '',
  esignAccepted: false,
  accountHolderName: '',
  accountNumber: '',
  confirmAccountNumber: '',
  bankName: '',
  ifscCode: '',
  bankVerified: false,
  accountActivated: false,
  signupStatus: 'MOBILE_VERIFIED',
  ...partial,
});

export const signupFlowService = {
  getDraft: async () => {
    const storedDraft = await readSecure<SignupDraft>(SIGNUP_DRAFT_KEY);

    if (!storedDraft) {
      return null;
    }

    const normalizedDraft = createSignupDraft(storedDraft);

    if (storedDraft.flowVersion !== CURRENT_SIGNUP_FLOW_VERSION) {
      return {
        ...normalizedDraft,
        flowVersion: CURRENT_SIGNUP_FLOW_VERSION,
        currentStep: 0,
      };
    }

    return normalizedDraft;
  },
  saveDraft: async (draft: SignupDraft) => {
    await writeSecure<SignupDraft>(SIGNUP_DRAFT_KEY, createSignupDraft(draft));
  },
  mergeDraft: async (patch: Partial<SignupDraft>) => {
    const currentDraft = (await signupFlowService.getDraft()) ?? createSignupDraft();
    const nextDraft = createSignupDraft({ ...currentDraft, ...patch });
    await signupFlowService.saveDraft(nextDraft);
    return nextDraft;
  },
  clearDraft: async () => {
    await removeSecure(SIGNUP_DRAFT_KEY);
  },
  buildActivatedSession: (draft: SignupDraft): AuthSession => {
    const normalizedEmail = draft.email.trim().toLowerCase();
    const fullName = draft.fullName.trim() || normalizedEmail.split('@')[0] || draft.mobile || 'Member';
    const now = Date.now();
    const userId = `member-${now}`;

    return {
      user: {
        ...emptyUserProfile,
        id: userId,
        name: fullName,
        email: normalizedEmail,
        mobile: draft.mobile.trim(),
        profilePhoto: draft.profilePhoto.trim() || emptyUserProfile.profilePhoto,
        referralCode: generateReferralCode(fullName, draft.mobile),
        memberSince: formatMemberSince(),
        kycStatus: 'APPROVED',
        levelTitle: 'Account Activated',
        dateOfBirth: draft.dateOfBirth.trim(),
        address: draft.address.trim(),
        bankMask: maskBankAccount(draft.accountNumber),
        accountHolderName: draft.accountHolderName.trim(),
        bankName: draft.bankName.trim(),
        ifscCode: draft.ifscCode.trim().toUpperCase(),
        panNumber: draft.panNumber.trim().toUpperCase(),
        aadhaarMasked: maskAadhaarNumber(draft.aadhaarNumber),
        initials: getInitials(fullName),
        biometricEnabled: draft.biometricEnabled,
        passwordConfigured: Boolean(draft.password.trim()),
        mpinConfigured: Boolean(draft.mpin.trim()),
        investorAgreementAccepted: draft.investorAgreementAccepted,
        riskDisclosureAccepted: draft.riskDisclosureAccepted,
        communicationConsent: draft.communicationConsent,
        accountStatus: 'ACTIVE',
      },
      tokens: {
        accessToken: `signup-access-${userId}`,
        refreshToken: `signup-refresh-${userId}`,
        expiresAt: now + SESSION_TTL_MS,
      },
    };
  },
};
