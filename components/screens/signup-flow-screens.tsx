import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { styles } from './signup-flow-styles';
import { usePathname, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Image, Pressable, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fontFamily, gradients, shadows } from '../../constants/theme';
import { authService } from '../../services/auth.service';
import { mpinService } from '../../services/mpin.service';
import { kycService, type KycStatusResponse, type KycDocumentStatus } from '../../services/kyc.service';
import { bankService } from '../../services/bank.service';
import { createSignupDraft, signupFlowService, type SignupDraft } from '../../services/signup-flow.service';
import { useAppStore } from '../../store/use-app-store';
import { useAuthStore } from '../../store/use-auth-store';
import type { SignupStatus } from '../../types';
import { useResponsive } from '../../utils/responsive';
import { AppScreen } from '../ui/app-screen';
import { GradientButton } from '../ui/gradient-button';
import { InputField } from '../ui/input-field';
import { ScreenHeader } from '../ui/screen-header';
import { SurfaceCard } from '../ui/surface-card';

const TOTAL_SIGNUP_STEPS = 8;
const MPIN_LENGTH = 4;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const strongPasswordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const ifscPattern = /^[A-Z0-9]{11}$/i;
const simpleMpins = new Set(['0000', '1111', '1234', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999']);

const formatDobInput = (value: string) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
};

const FLOW_STEPS = [
  {
    route: '/signup/profile',
    title: 'Personal Details',
    subtitle: 'Add your full name, email, date of birth and address.',
    actionLabel: 'Continue to Password',
    icon: 'person-outline',
  },
  {
    route: '/signup/password',
    title: 'Create Password',
    subtitle: 'Create a strong password. Add a referral code if you have one.',
    actionLabel: 'Continue to Terms',
    icon: 'key-outline',
  },
  {
    route: '/signup/terms',
    title: 'Terms & Consent',
    subtitle: 'Accept the required policies to create your account.',
    actionLabel: 'Accept & Create Account',
    icon: 'document-text-outline',
  },
  {
    route: '/signup/kyc',
    title: 'KYC Documents',
    subtitle: 'Upload your PAN, Aadhaar (front & back), selfie, and bank passbook.',
    actionLabel: 'Submit KYC Documents',
    icon: 'id-card-outline',
  },
  {
    route: '/signup/bank',
    title: 'Link Bank Account',
    subtitle: 'Link your primary bank account for withdrawals and investments.',
    actionLabel: 'Link Bank Account',
    icon: 'business-outline',
  },
  {
    route: '/signup/mpin',
    title: 'Create MPIN',
    subtitle: 'Set a 4-digit MPIN for secure access to your account.',
    actionLabel: 'Create MPIN & Go to Dashboard',
    icon: 'keypad-outline',
  },
] as const;

const normalizeDigits = (value: string) => value.replace(/\D/g, '');
const normalizeUpper = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, '');
const normalizeDraftStep = (stepIndex: number) => Math.min(Math.max(stepIndex, 0), FLOW_STEPS.length - 1);
const formatStepLabel = (stepIndex: number) => `STEP ${stepIndex + 3} OF ${TOTAL_SIGNUP_STEPS}`;
const formatAadhaarDisplay = (value: string) =>
  normalizeDigits(value)
    .slice(0, 12)
    .replace(/(\d{4})(?=\d)/g, '$1 ')
    .trim();
const isDobFormat = (value: string) => /^\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$/.test(value.trim());

const isSequentialMpin = (value: string) => {
  if (value.length < 4) {
    return false;
  }

  const digits = value.split('').map((digit) => Number(digit));
  const isAscending = digits.every((digit, index) => index === 0 || digit === digits[index - 1] + 1);
  const isDescending = digits.every((digit, index) => index === 0 || digit === digits[index - 1] - 1);

  return isAscending || isDescending;
};

const CheckboxRow = ({
  checked,
  label,
  onPress,
}: {
  checked: boolean;
  label: string;
  onPress: () => void;
}) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.checkboxRow,
      checked && styles.checkboxRowActive,
      pressed && styles.checkboxRowPressed,
    ]}
  >
    <View style={[styles.checkboxBox, checked && styles.checkboxBoxActive]}>
      {checked ? <Ionicons name="checkmark" size={14} color={colors.surface} /> : null}
    </View>
    <Text style={styles.checkboxLabel}>{label}</Text>
  </Pressable>
);

const PasswordRule = ({ met, label }: { met: boolean; label: string }) => (
  <View style={styles.ruleRow}>
    <Ionicons name={met ? 'checkmark-circle' : 'ellipse-outline'} size={15} color={met ? colors.success : colors.muted} />
    <Text style={[styles.ruleText, met && styles.ruleTextMet]}>{label}</Text>
  </View>
);

const ValidTick = () => <Ionicons name="checkmark-circle" size={18} color={colors.success} />;

const PinEntryBoxes = ({
  label,
  value,
  isFocused,
  onPress,
}: {
  label: string;
  value: string;
  isFocused: boolean;
  onPress: () => void;
}) => (
  <View style={styles.pinGroup}>
    <Text style={styles.pinLabel}>
      {label}
      <Text style={styles.pinRequired}> *</Text>
    </Text>
    <Pressable onPress={onPress} style={styles.pinPressable}>
      <View style={styles.pinRow}>
        {new Array(MPIN_LENGTH).fill(null).map((_, index) => {
          const activeIndex = Math.min(value.length, MPIN_LENGTH - 1);
          const isActive = index === activeIndex && isFocused;
          const hasValue = index < value.length;

          return (
            <View
              key={`${label}-${index}`}
              style={[styles.pinBox, hasValue && styles.pinBoxFilled, isActive && styles.pinBoxFocused]}
            >
              {hasValue ? <View style={styles.pinDot} /> : null}
            </View>
          );
        })}
      </View>
    </Pressable>
  </View>
);

const MpinBoxes = ({
  label,
  value,
  onChangeText,
  isFocused,
  onFocus,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  isFocused: boolean;
  onFocus: () => void;
}) => (
  <View style={styles.mpinGroup}>
    <Text style={styles.mpinLabel}>
      {label}
      <Text style={styles.mpinRequired}> *</Text>
    </Text>
    <View style={styles.mpinInputWrap}>
      <Pressable onPress={onFocus} style={styles.mpinPressable}>
        <View style={styles.mpinRow}>
          {new Array(MPIN_LENGTH).fill(null).map((_, index) => {
            const activeIndex = Math.min(value.length, MPIN_LENGTH - 1);
            const isActive = index === activeIndex && isFocused;
            const hasValue = index < value.length;

            return (
              <View key={`${label}-${index}`} style={[styles.mpinBox, isActive && styles.mpinBoxFocused]}>
                <Text style={styles.mpinDigit}>{hasValue ? '•' : ''}</Text>
              </View>
            );
          })}
        </View>
      </Pressable>
    </View>
  </View>
);

const SummaryItem = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.summaryRow}>
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text style={styles.summaryValue}>{value}</Text>
  </View>
);

const ImageUploadButton = ({ label, uri, onPress }: { label: string; uri: string; onPress: () => void }) => (
  <Pressable onPress={onPress} style={styles.imageUploadBtn}>
    {uri ? (
      <Image source={{ uri }} style={styles.imageUploadPreview} resizeMode="cover" />
    ) : (
      <View style={styles.imageUploadPlaceholder}>
        <Ionicons name="cloud-upload-outline" size={24} color={colors.primary} />
        <Text style={styles.imageUploadText}>{label}</Text>
      </View>
    )}
  </Pressable>
);

const getStatusPatch = (status: SignupStatus, patch: Partial<SignupDraft> = {}): Partial<SignupDraft> => ({
  ...patch,
  signupStatus: status,
});

const PasswordStrengthMeter = ({
  score,
  isEmpty,
  checks,
}: {
  score: number;
  isEmpty: boolean;
  checks: { minLength: boolean; uppercase: boolean; lowercase: boolean; number: boolean; special: boolean };
}) => {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: score,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [score, widthAnim]);

  const width = widthAnim.interpolate({
    inputRange: [0, 5],
    outputRange: ['0%', '100%'],
  });

  const backgroundColor = widthAnim.interpolate({
    inputRange: [0, 1, 2, 4, 5],
    outputRange: [colors.danger, colors.danger, '#F59E0B', colors.primary, colors.success],
  });

  let strengthLabel = 'Weak';
  let strengthColor = colors.danger;

  if (score === 5) {
    strengthLabel = 'Strong';
    strengthColor = colors.success;
  } else if (score >= 4) {
    strengthLabel = 'Good';
    strengthColor = colors.primary;
  } else if (score >= 2) {
    strengthLabel = 'Fair';
    strengthColor = '#F59E0B';
  } else if (isEmpty) {
    strengthLabel = '';
  }

  if (isEmpty) return null;

  const rules: { key: string; label: string; met: boolean }[] = [
    { key: 'len', label: '8+ chars', met: checks.minLength },
    { key: 'up', label: 'A-Z', met: checks.uppercase },
    { key: 'low', label: 'a-z', met: checks.lowercase },
    { key: 'num', label: '0-9', met: checks.number },
    { key: 'spl', label: '!@#', met: checks.special },
  ];

  return (
    <View style={{ marginBottom: 16, gap: 10 }}>
      {/* Requirement chips */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {rules.map((rule) => (
          <View
            key={rule.key}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: rule.met ? '#ECFDF5' : '#F1F5F9',
              borderRadius: 20,
              paddingHorizontal: 10,
              paddingVertical: 5,
              gap: 4,
              borderWidth: 1,
              borderColor: rule.met ? '#BBF7D0' : '#E2E8F0',
            }}
          >
            <Ionicons
              name={rule.met ? 'checkmark-circle' : 'ellipse-outline'}
              size={14}
              color={rule.met ? colors.success : colors.muted}
            />
            <Text
              style={{
                fontFamily: fontFamily.bodySemi,
                fontSize: 11,
                color: rule.met ? '#16A34A' : colors.muted,
              }}
            >
              {rule.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Strength bar + label */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ flex: 1, height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
          <Animated.View style={{ height: '100%', width, backgroundColor, borderRadius: 3 }} />
        </View>
        <Text style={{ fontFamily: fontFamily.bodySemi, fontSize: 12, color: strengthColor, minWidth: 42 }}>
          {strengthLabel}
        </Text>
      </View>
    </View>
  );
};

export const CompleteSignupScreen = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { isTablet } = useResponsive();
  const insets = useSafeAreaInsets();
  const signIn = useAuthStore((state) => state.signIn);
  const markMpinVerified = useAuthStore((state) => state.markMpinVerified);
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const [draft, setDraft] = useState<SignupDraft | null>(null);
  const draftRef = useRef<SignupDraft | null>(null);
  const mpinInputRef = useRef<TextInput | null>(null);
  const confirmMpinInputRef = useRef<TextInput | null>(null);
  const [isLoadingDraft, setIsLoadingDraft] = useState(true);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmMpin, setConfirmMpin] = useState('');
  const [isFinishingSignup, setIsFinishingSignup] = useState(false);
  const [isRegisteringAndActivating, setIsRegisteringAndActivating] = useState(false);
  const [isSubmittingBank, setIsSubmittingBank] = useState(false);
  const [isSubmittingKyc, setIsSubmittingKyc] = useState(false);
  const [isMpinFocused, setIsMpinFocused] = useState(false);
  const [isConfirmMpinFocused, setIsConfirmMpinFocused] = useState(false);
  // KYC polling state
  const [kycStatusData, setKycStatusData] = useState<KycStatusResponse | null>(null);
  const [isPollingKyc, setIsPollingKyc] = useState(false);
  const kycPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // KYC reupload mode state
  const [isReuploadMode, setIsReuploadMode] = useState(false);
  const [kycFormDisabled, setKycFormDisabled] = useState(false);
  const [isLoadingKycStatus, setIsLoadingKycStatus] = useState(false);

  useEffect(() => {
    let active = true;

    void signupFlowService.getDraft().then((storedDraft) => {
      if (!active) {
        return;
      }

      let normalizedDraft = storedDraft
        ? {
            ...storedDraft,
            currentStep: normalizeDraftStep(storedDraft.currentStep),
          }
        : null;

      const user = useAuthStore.getState().user;
      if ((!normalizedDraft || !normalizedDraft.otpVerified || !normalizedDraft.mobile?.trim()) && user && user.mobile) {
        const stepIdx = FLOW_STEPS.findIndex((step) => step.route === pathname);
        normalizedDraft = createSignupDraft({
          mobile: user.mobile,
          otpVerified: true,
          fullName: user.name || '',
          email: user.email || '',
          dateOfBirth: user.dateOfBirth || '',
          address: user.address || '',
          password: '',
          referredByCode: user.referralCode || '',
          investorAgreementAccepted: true,
          riskDisclosureAccepted: true,
          communicationConsent: true,
          panNumber: user.panNumber || '',
          aadhaarNumber: user.aadhaarMasked ? normalizeDigits(user.aadhaarMasked) : '',
          ifscCode: user.ifscCode || '',
          bankName: user.bankName || '',
          currentStep: normalizeDraftStep(stepIdx >= 0 ? stepIdx : 0),
          signupVerificationToken: useAuthStore.getState().accessToken || '',
        });
      }

      draftRef.current = normalizedDraft;
      setDraft(normalizedDraft);
      setConfirmPassword(storedDraft?.password ?? '');
      setConfirmMpin(storedDraft?.mpin ?? '');
      setIsLoadingDraft(false);
    });

    return () => {
      active = false;
    };
  }, [pathname]);

  useEffect(() => {
    if (!draft || isLoadingDraft) {
      return;
    }

    const persistTimer = setTimeout(() => {
      void signupFlowService.saveDraft(draft);
    }, 180);

    return () => clearTimeout(persistTimer);
  }, [draft, isLoadingDraft]);

  const routeStepIndex = FLOW_STEPS.findIndex((step) => step.route === pathname);
  const savedStep = normalizeDraftStep(draft?.currentStep ?? 0);
  const currentStep = routeStepIndex >= 0 ? routeStepIndex : savedStep;
  const currentStepMeta = FLOW_STEPS[currentStep];
  const stepProgressWidth = `${((currentStep + 3) / TOTAL_SIGNUP_STEPS) * 100}%` as `${number}%`;
  const passwordValue = draft?.password ?? '';
  const mpinValue = normalizeDigits(draft?.mpin ?? '');
  const panValue = normalizeUpper(draft?.panNumber ?? '');
  const aadhaarValue = normalizeDigits(draft?.aadhaarNumber ?? '');
  const dateOfBirthValue = draft?.dateOfBirth?.trim() ?? '';
  const addressValue = draft?.address?.trim() ?? '';
  const accountNumberValue = normalizeDigits(draft?.accountNumber ?? '');
  const confirmAccountNumberValue = normalizeDigits(draft?.confirmAccountNumber ?? '');
  const bankNameValue = draft?.bankName?.trim() ?? '';
  const ifscValue = normalizeUpper(draft?.ifscCode ?? '');
  const passwordChecks = {
    minLength: passwordValue.length >= 8,
    uppercase: /[A-Z]/.test(passwordValue),
    lowercase: /[a-z]/.test(passwordValue),
    number: /\d/.test(passwordValue),
    special: /[^A-Za-z\d]/.test(passwordValue),
  };
  const isMpinValid = /^\d{4,6}$/.test(mpinValue) && !simpleMpins.has(mpinValue) && !isSequentialMpin(mpinValue);
  const isPanValid = panPattern.test(panValue);
  const isAadhaarValid = /^\d{12}$/.test(aadhaarValue);
  const isAccountNumberValid = /^\d{9,18}$/.test(accountNumberValue);
  const isConfirmAccountNumberValid = isAccountNumberValid && accountNumberValue === confirmAccountNumberValue;
  const isIfscValid = ifscPattern.test(ifscValue);

  useEffect(() => {
    if (!draft || isLoadingDraft) {
      return;
    }

    if (pathname === '/complete-signup') {
      router.replace(FLOW_STEPS[savedStep].route);
      return;
    }

    if (routeStepIndex >= 0 && routeStepIndex > savedStep) {
      // The root layout (server-side user data) routed us to a step ahead of the
      // local draft. Sync the draft forward to match instead of redirecting back,
      // which would cause a navigation loop with the root layout.
      const syncedDraft = { ...draftRef.current!, currentStep: routeStepIndex };
      draftRef.current = syncedDraft;
      setDraft(syncedDraft);
      void signupFlowService.saveDraft(syncedDraft);
    }
  }, [draft, isLoadingDraft, pathname, routeStepIndex, router, savedStep]);

  // Fetch KYC status when landing on KYC step (step 4) to support reupload and prefill
  useEffect(() => {
    if (currentStep !== 4 || isLoadingDraft || !draft) {
      return;
    }

    let active = true;
    setIsLoadingKycStatus(true);

    void kycService.getKycStatus().then((statusData) => {
      if (!active) return;

      setKycStatusData(statusData);
      setIsLoadingKycStatus(false);

      // Determine if this is a reupload scenario
      const kycStatus = statusData.kycStatus;
      if (kycStatus === 'REUPLOAD_REQUIRED' || kycStatus === 'REJECTED') {
        setIsReuploadMode(true);
        setKycFormDisabled(false);
      } else if (kycStatus === 'APPROVED') {
        setKycFormDisabled(!statusData.canUpload);
        setIsReuploadMode(false);
      } else if (kycStatus === 'PENDING') {
        // KYC is pending review, redirect to status page
        const nextStep = 5;
        const nextDraft = { ...draftRef.current!, currentStep: nextStep };
        void persistDraftAndNavigate(nextDraft, FLOW_STEPS[nextStep].route);
        return;
      } else {
        setIsReuploadMode(false);
        setKycFormDisabled(false);
      }

      // Prefill profile fields from KYC status response
      if (statusData.profile) {
        const profile = statusData.profile;
        const prefill: Partial<SignupDraft> = {};
        if (profile.panNumber && !draft.panNumber) {
          prefill.panNumber = profile.panNumber;
        }
        if (profile.aadhaarLast4 && !draft.aadhaarNumber) {
          prefill.aadhaarNumber = profile.aadhaarLast4;
        }
        if (profile.dateOfBirth && !draft.dateOfBirth) {
          prefill.dateOfBirth = profile.dateOfBirth;
        }
        if (profile.address && !draft.address) {
          prefill.address = profile.address;
        }
        if (Object.keys(prefill).length > 0) {
          patchDraft(prefill);
        }
      }
    }).catch(() => {
      if (!active) return;
      setIsLoadingKycStatus(false);
      // On error (e.g. first time user, no KYC yet), proceed normally
    });

    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, isLoadingDraft]);

  const patchDraft = (patch: Partial<SignupDraft>) => {
    const currentDraft = draftRef.current;

    if (!currentDraft) {
      return;
    }

    const nextDraft = { ...currentDraft, ...patch };
    draftRef.current = nextDraft;
    setDraft(nextDraft);
  };

  const persistDraftAndNavigate = async (nextDraft: SignupDraft, nextRoute: string) => {
    draftRef.current = nextDraft;
    setDraft(nextDraft);
    await signupFlowService.saveDraft(nextDraft);
    router.replace(nextRoute);
  };

  const openTerms = () => {
    router.push({
      pathname: '/terms-and-conditions',
      params: {
        returnTo: currentStepMeta.route,
        returnLabel: 'Back to Signup',
      },
    });
  };

  const openPrivacyPolicy = () => {
    router.push({
      pathname: '/privacy-policy',
      params: {
        returnTo: currentStepMeta.route,
        returnLabel: 'Back to Signup',
      },
    });
  };

  const pickImage = async (field: 'panCardPhoto' | 'aadhaarFrontPhoto' | 'aadhaarBackPhoto' | 'selfiePhoto' | 'bankPassbookPhoto') => {
    Alert.alert(
      'Document Scanner',
      'Choose how you would like to upload your document:',
      [
        {
          text: '📷 Scan Document (Camera)',
          onPress: async () => {
            try {
              const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
              if (!permissionResult.granted) {
                Alert.alert('Permission Required', 'Allow access to your camera in your device settings to scan documents.');
                return;
              }

              const result = await ImagePicker.launchCameraAsync({
                allowsEditing: true,
                quality: 0.15,
              });

              if (!result.canceled && result.assets && result.assets.length > 0) {
                patchDraft({ [field]: result.assets[0].uri });
              }
            } catch (error) {
              console.error('Camera scanning error:', error);
              const msg = error instanceof Error ? error.message : 'Unknown error';
              Alert.alert('Scanner Error', `Could not scan with camera. Details: ${msg}`);
            }
          },
        },
        {
          text: '🖼️ Choose from Gallery',
          onPress: async () => {
            try {
              const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (!permissionResult.granted) {
                Alert.alert('Permission Required', 'Allow access to your media library in your device settings to select photos.');
                return;
              }

              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.15,
              });

              if (!result.canceled && result.assets && result.assets.length > 0) {
                patchDraft({ [field]: result.assets[0].uri });
              }
            } catch (error) {
              console.error('Image picking error:', error);
              const msg = error instanceof Error ? error.message : 'Unknown error';
              Alert.alert('Upload Error', `Could not pick an image from your library. Details: ${msg}`);
            }
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const validateStep = () => {
    if (!draft) {
      return false;
    }

    switch (currentStep) {
      case 0: {
        const fullName = draft.fullName.trim();
        const normalizedEmail = draft.email.trim().toLowerCase();
        const dateOfBirth = draft.dateOfBirth.trim();
        const address = draft.address.trim();

        if (!fullName) {
          Alert.alert('Full name required', 'Enter your full name to continue.');
          return false;
        }

        if (!normalizedEmail) {
          Alert.alert('Email required', 'Enter your email address to continue.');
          return false;
        }

        if (!emailPattern.test(normalizedEmail)) {
          Alert.alert('Invalid email', 'Enter a valid email address to continue.');
          return false;
        }

        if (!dateOfBirth) {
          Alert.alert('Date of Birth required', 'Enter your date of birth to continue.');
          return false;
        }

        if (!isDobFormat(dateOfBirth)) {
          Alert.alert('Invalid date format', 'Use YYYY-MM-DD format (e.g. 1995-05-20).');
          return false;
        }

        // Check age is 18+
        const parts = dateOfBirth.split('-');
        const birthYear = parseInt(parts[0], 10);
        const birthMonth = parseInt(parts[1], 10) - 1;
        const birthDate = parseInt(parts[2], 10);
        const today = new Date();
        let age = today.getFullYear() - birthYear;
        const m = today.getMonth() - birthMonth;
        if (m < 0 || (m === 0 && today.getDate() < birthDate)) {
            age--;
        }
        if (age < 18) {
          Alert.alert('Underage', 'You must be 18 years or older to register.');
          return false;
        }

        if (!address) {
          Alert.alert('Address required', 'Enter your address to continue.');
          return false;
        }

        patchDraft(getStatusPatch('PROFILE_COMPLETED', {
          fullName,
          email: normalizedEmail,
          dateOfBirth,
          address,
        }));
        return true;
      }
      case 1: {
        if (!strongPasswordPattern.test(draft.password)) {
          Alert.alert('Weak password', 'Use at least 8 characters with uppercase, lowercase, number, and special character.');
          return false;
        }

        if (!confirmPassword.trim()) {
          Alert.alert('Confirm password', 'Enter the same password again to confirm it.');
          return false;
        }

        if (draft.password !== confirmPassword) {
          Alert.alert('Password mismatch', 'Password and confirm password must match exactly.');
          return false;
        }

        patchDraft(getStatusPatch('PASSWORD_CREATED'));
        return true;
      }
      case 2: {
        if (!draft.investorAgreementAccepted || !draft.riskDisclosureAccepted) {
          Alert.alert('Accept policies', 'Accept the Investor Agreement and Risk Disclosure to continue.');
          return false;
        }

        patchDraft(getStatusPatch('TERMS_ACCEPTED'));
        return true;
      }
      case 3: {
        // KYC step — validate document fields
        // In reupload mode, only validate documents that need re-uploading
        const submission = kycStatusData?.submission;

        if (!isPanValid) {
          Alert.alert('Invalid PAN', 'Enter a valid 10-character PAN number.');
          return false;
        }

        if (isReuploadMode && submission) {
          // Reupload: only require files that are missing, REJECTED, or REUPLOAD_REQUIRED
          const needsPan = kycService.needsUpload(submission.panCardStatus as KycDocumentStatus | undefined);
          const needsFront = kycService.needsUpload(submission.aadhaarFrontStatus as KycDocumentStatus | undefined);
          const needsBack = kycService.needsUpload(submission.aadhaarBackStatus as KycDocumentStatus | undefined);
          const needsSelfie = kycService.needsUpload(submission.selfieStatus as KycDocumentStatus | undefined);
          const needsBank = kycService.needsUpload(submission.bankProofStatus as KycDocumentStatus | undefined);

          if (needsPan && !draft.panCardPhoto) {
            Alert.alert('PAN Photo Required', 'Please re-upload a photo of your PAN card.');
            return false;
          }
          if (needsFront && !draft.aadhaarFrontPhoto) {
            Alert.alert('Aadhaar Front Required', 'Please re-upload the front side of your Aadhaar card.');
            return false;
          }
          if (needsBack && !draft.aadhaarBackPhoto) {
            Alert.alert('Aadhaar Back Required', 'Please re-upload the back side of your Aadhaar card.');
            return false;
          }
          if (needsSelfie && !draft.selfiePhoto) {
            Alert.alert('Selfie Required', 'Please re-upload a selfie photo for verification.');
            return false;
          }
          if (needsBank && !draft.bankPassbookPhoto) {
            Alert.alert('Bank Passbook Required', 'Please re-upload a photo of your bank passbook or cancelled cheque.');
            return false;
          }

          // Must have at least one new file for reupload
          const hasAnyNewFile = [
            needsPan && draft.panCardPhoto,
            needsFront && draft.aadhaarFrontPhoto,
            needsBack && draft.aadhaarBackPhoto,
            needsSelfie && draft.selfiePhoto,
            needsBank && draft.bankPassbookPhoto,
          ].some(Boolean);

          if (!hasAnyNewFile) {
            Alert.alert('No Documents', 'Please upload at least one document to resubmit.');
            return false;
          }
        } else {
          // Initial upload: require all 5 documents
          if (!isAadhaarValid) {
            Alert.alert('Invalid Aadhaar', 'Enter a valid 12-digit Aadhaar number.');
            return false;
          }
          if (!draft.panCardPhoto) {
            Alert.alert('PAN Photo Required', 'Please upload a photo of your PAN card.');
            return false;
          }
          if (!draft.aadhaarFrontPhoto) {
            Alert.alert('Aadhaar Front Required', 'Please upload the front side of your Aadhaar card.');
            return false;
          }
          if (!draft.aadhaarBackPhoto) {
            Alert.alert('Aadhaar Back Required', 'Please upload the back side of your Aadhaar card.');
            return false;
          }
          if (!draft.selfiePhoto) {
            Alert.alert('Selfie Required', 'Please take or upload a selfie photo for verification.');
            return false;
          }
          if (!draft.bankPassbookPhoto) {
            Alert.alert('Bank Passbook Required', 'Please upload a photo of your bank passbook or cancelled cheque.');
            return false;
          }
        }

        patchDraft(getStatusPatch('KYC_COMPLETED'));
        return true;
      }
      case 4: {
        // Bank linking step — validate account details
        if (!isAccountNumberValid) {
          Alert.alert('Invalid Account', 'Enter a valid bank account number (9–18 digits).');
          return false;
        }
        if (!isConfirmAccountNumberValid) {
          Alert.alert('Account Mismatch', 'Account numbers must match.');
          return false;
        }
        if (!isIfscValid) {
          Alert.alert('Invalid IFSC', 'Enter a valid 11-character IFSC code.');
          return false;
        }
        if (!bankNameValue.trim()) {
          Alert.alert('Bank Name Required', 'Please enter your bank name.');
          return false;
        }
        patchDraft(getStatusPatch('BANK_LINKED'));
        return true;
      }
      case 5: {
        const mpin = normalizeDigits(draft.mpin).slice(0, MPIN_LENGTH);

        if (!new RegExp(`^\\d{${MPIN_LENGTH}}$`).test(mpin)) {
          Alert.alert('Invalid MPIN', 'Enter a 4 digit MPIN.');
          return false;
        }

        if (simpleMpins.has(mpin) || isSequentialMpin(mpin)) {
          Alert.alert('Weak MPIN', 'Avoid simple MPIN values like 1111 or 1234.');
          return false;
        }

        if (mpin !== confirmMpin) {
          Alert.alert('MPIN mismatch', 'MPIN and confirm MPIN must match.');
          return false;
        }

        patchDraft(getStatusPatch('MPIN_CREATED', { mpin }));
        return true;
      }
      default:
        return true;
    }
  };

  // KYC polling is removed — KYC submit goes directly to bank

  const stopKycPolling = () => {
    if (kycPollRef.current) {
      clearInterval(kycPollRef.current);
      kycPollRef.current = null;
    }
  };

  const startKycPolling = () => {
    stopKycPolling();
    setIsPollingKyc(true);
    const fetchStatus = async () => {
      try {
        const data = await kycService.getKycStatus();
        setKycStatusData(data);
        if (data.kycStatus === 'NOT_SUBMITTED') {
          stopKycPolling();
          setIsPollingKyc(false);
          const backStep = 4;
          const backDraft = { ...draftRef.current!, currentStep: backStep };
          await persistDraftAndNavigate(backDraft, FLOW_STEPS[backStep].route);
          return;
        }
        if (data.kycStatus === 'APPROVED') {
          stopKycPolling();
          setIsPollingKyc(false);
          // Sync auth store state so RootNavigator's resolveOnboardingRoute knows KYC is APPROVED
          await useAuthStore.getState().updateUser({ kycStatus: 'APPROVED' });
          // Auto-navigate to Bank Linking (step 6) on approval
          const nextStep = 6;
          const nextDraft = { ...draftRef.current!, currentStep: nextStep };
          await persistDraftAndNavigate(nextDraft, FLOW_STEPS[nextStep].route);
          return;
        }
        if (data.kycStatus === 'REJECTED' || data.kycStatus === 'REUPLOAD_REQUIRED') {
          stopKycPolling();
          setIsPollingKyc(false);
          await useAuthStore.getState().updateUser({ kycStatus: data.kycStatus });
        }
      } catch {
        // silent — keep polling
      }
    };
    void fetchStatus();
    kycPollRef.current = setInterval(() => { void fetchStatus(); }, 5000);
  };

  // KYC polling screen removed — no polling needed in new flow

  const goNext = async () => {
    if (!draftRef.current || !validateStep()) {
      return;
    }

    const nextStep = Math.min(currentStep + 1, FLOW_STEPS.length - 1);
    const nextDraft = {
      ...draftRef.current,
      currentStep: nextStep,
    };

    await persistDraftAndNavigate(nextDraft, FLOW_STEPS[nextStep].route);
  };

  const goBack = async () => {
    if (!draftRef.current) {
      router.replace('/signup/mobile');
      return;
    }

    if (currentStep === 0) {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/signup/mobile');
      }
      return;
    }

    const previousStep = Math.max(currentStep - 1, 0);
    const previousDraft = {
      ...draftRef.current,
      currentStep: previousStep,
    };

    await persistDraftAndNavigate(previousDraft, FLOW_STEPS[previousStep].route);
  };

  // Called from Terms step (step 3) — Register user, then navigate to KYC document upload
  const registerAndGoToKyc = async () => {
    if (!draftRef.current || !validateStep()) {
      return;
    }

    const latestDraft = draftRef.current;

    // Pre-flight validation: catch corrupted/empty fields before hitting the backend
    if (!latestDraft.fullName.trim()) {
      Alert.alert('Missing Information', 'Full name is missing. Go back to the Profile step and enter your name.');
      return;
    }
    if (!latestDraft.email.trim()) {
      Alert.alert('Missing Information', 'Email address is missing. Go back to the Profile step and enter your email.');
      return;
    }
    if (!latestDraft.mobile.trim()) {
      Alert.alert('Missing Information', 'Mobile number is missing. Please restart the signup from mobile verification.');
      return;
    }
    if (!latestDraft.password || !strongPasswordPattern.test(latestDraft.password)) {
      Alert.alert('Invalid Password', 'Your password was lost or does not meet the requirements.\n\nGo back to the Password step and re-enter a password with at least 8 characters, including uppercase, lowercase, number, and special character.');
      return;
    }
    if (!latestDraft.dateOfBirth.trim()) {
      Alert.alert('Missing Information', 'Date of birth is missing. Go back to the Profile step and enter your date of birth.');
      return;
    }
    if (!latestDraft.address.trim()) {
      Alert.alert('Missing Information', 'Address is missing. Go back to the Profile step and enter your address.');
      return;
    }
    if (!latestDraft.investorAgreementAccepted || !latestDraft.riskDisclosureAccepted) {
      Alert.alert('Accept Policies', 'You must accept the Investor Agreement and Risk Disclosure to continue.');
      return;
    }
    if (!latestDraft.signupVerificationToken) {
      Alert.alert('Session Expired', 'Your verification session has expired. Please restart the signup from mobile verification.');
      return;
    }

    setIsRegisteringAndActivating(true);

    try {
      // Step 1: Register the investor account
      const registration = await authService.register({
        idToken: latestDraft.signupVerificationToken,
        fullName: latestDraft.fullName,
        email: latestDraft.email,
        password: latestDraft.password,
        mpin: latestDraft.mpin || undefined,
        dateOfBirth: latestDraft.dateOfBirth || undefined,
        address: latestDraft.address || undefined,
        panNumber: latestDraft.panNumber || undefined,
        aadhaarLast4: latestDraft.aadhaarNumber ? latestDraft.aadhaarNumber.slice(-4) : undefined,
        bankAccountNumber: latestDraft.accountNumber || undefined,
        bankIfscCode: latestDraft.ifscCode || undefined,
        bankName: latestDraft.bankName || undefined,
        referredByCode: latestDraft.referredByCode || undefined,
        termsAccepted: latestDraft.investorAgreementAccepted,
        privacyPolicyAccepted: latestDraft.riskDisclosureAccepted,
        kycConsentAccepted: latestDraft.communicationConsent ?? true,
        mobileNumber: latestDraft.mobile,
      });

      if (registration.outcome === 'verification-pending') {
        await signupFlowService.clearDraft();
        router.replace({
          pathname: '/success',
          params: {
            title: 'Registration Submitted',
            subtitle:
              registration.message ||
              'Your account has been created. Verify your email first, then log in to continue onboarding.',
            cta: 'Back to Login',
            redirect: '/(auth)/login',
          },
        });
        return;
      }

      // Step 2: Sign in to store the access token for subsequent API calls
      await signIn(registration.session);

      // Step 3: Navigate to KYC document upload (step index 4)
      const nextStep = 4;
      const nextDraft = { ...latestDraft, currentStep: nextStep,
        signupVerificationToken: registration.session.tokens.accessToken };
      await persistDraftAndNavigate(nextDraft, FLOW_STEPS[nextStep].route);
    } catch (error: any) {
      const status = error.response?.status;
      const serverData = error.response?.data;
      let errorMessage = 'Something went wrong. Please try again.';

      if (status === 404) {
        errorMessage = 'Registration endpoint is currently unavailable on server. Please verify your connection or try again.';
      } else if (serverData) {
        const mainMessage = serverData.message || serverData.error || 'Registration failed';
        const details: string[] = Array.isArray(serverData.details) ? serverData.details : [];

        if (details.length > 0) {
          errorMessage = `${mainMessage}\n\n${details.map((d: string) => `• ${d}`).join('\n')}`;
        } else {
          errorMessage = mainMessage;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      Alert.alert('Registration failed', errorMessage);
    } finally {
      setIsRegisteringAndActivating(false);
    }
  };

  // Called from KYC step (step 4) — Submit KYC documents (initial or reupload)
  const submitKycDocuments = async () => {
    if (!draftRef.current || !validateStep()) {
      return;
    }

    setIsSubmittingKyc(true);

    try {
      const latestDraft = draftRef.current;
      const submission = kycStatusData?.submission;

      // In reupload mode, only send files that need re-uploading
      let panUri = latestDraft.panCardPhoto;
      let frontUri = latestDraft.aadhaarFrontPhoto;
      let backUri = latestDraft.aadhaarBackPhoto;
      let selfieUri = latestDraft.selfiePhoto;
      let bankUri = latestDraft.bankPassbookPhoto;

      if (isReuploadMode && submission) {
        // Only include files for documents that need re-upload
        if (!kycService.needsUpload(submission.panCardStatus as KycDocumentStatus | undefined)) panUri = '';
        if (!kycService.needsUpload(submission.aadhaarFrontStatus as KycDocumentStatus | undefined)) frontUri = '';
        if (!kycService.needsUpload(submission.aadhaarBackStatus as KycDocumentStatus | undefined)) backUri = '';
        if (!kycService.needsUpload(submission.selfieStatus as KycDocumentStatus | undefined)) selfieUri = '';
        if (!kycService.needsUpload(submission.bankProofStatus as KycDocumentStatus | undefined)) bankUri = '';
      }

      await kycService.submitKyc({
        panCardImageUri: panUri,
        aadhaarFrontImageUri: frontUri,
        aadhaarBackImageUri: backUri,
        selfiePhotoUri: selfieUri,
        bankPassbookUri: bankUri,
        panNumber: latestDraft.panNumber,
        aadhaarLast4: latestDraft.aadhaarNumber.slice(-4),
        dateOfBirth: latestDraft.dateOfBirth,
        address: latestDraft.address,
      });

      // Update auth store with KYC PENDING status
      await useAuthStore.getState().updateUser({ kycStatus: 'PENDING' });

      // Navigate directly to Bank Linking (step index 4) — no polling screen
      const nextStep = 4;
      const nextDraft = { ...latestDraft, currentStep: nextStep };
      await persistDraftAndNavigate(nextDraft, FLOW_STEPS[nextStep].route);
    } catch (error: any) {
      const serverData = error.response?.data;
      let errorMessage = 'Could not submit your documents. Try again.';

      if (serverData) {
        const mainMessage = serverData.message || serverData.error || errorMessage;
        const details: string[] = Array.isArray(serverData.details) ? serverData.details : [];
        errorMessage = details.length > 0 ? `${mainMessage}\n\n${details.map((d: string) => `• ${d}`).join('\n')}` : mainMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      Alert.alert('KYC Submission Failed', errorMessage);
    } finally {
      setIsSubmittingKyc(false);
    }
  };

  // Called from Bank step (step 6) — Link bank account, go to Activation
  const submitBank = async () => {
    if (!draftRef.current || !validateStep()) {
      return;
    }

    setIsSubmittingBank(true);

    try {
      const latestDraft = draftRef.current;
      const accessToken = useAuthStore.getState().accessToken;

      if (!accessToken) {
        throw new Error('Session expired. Please sign in again.');
      }

      // Step A: Link bank account
      await bankService.linkBank(
        latestDraft.accountHolderName || latestDraft.fullName,
        latestDraft.accountNumber,
        latestDraft.ifscCode,
        latestDraft.bankName
      );

      // Sync auth store state so RootNavigator's resolveOnboardingRoute knows bank is verified
      await useAuthStore.getState().updateUser({ bankVerified: true, accountStatus: 'ACTIVE' });

      // Navigate directly to MPIN setup (step index 5)
      const nextStep = 5;
      const nextDraft = { ...latestDraft, currentStep: nextStep };
      await persistDraftAndNavigate(nextDraft, FLOW_STEPS[nextStep].route);
    } catch (error: any) {
      const serverData = error.response?.data;
      let errorMessage = 'Could not link your bank account. Try again.';

      if (serverData) {
        const mainMessage = serverData.message || serverData.error || errorMessage;
        const details: string[] = Array.isArray(serverData.details) ? serverData.details : [];
        errorMessage = details.length > 0 ? `${mainMessage}\n\n${details.map((d: string) => `• ${d}`).join('\n')}` : mainMessage;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      Alert.alert('Bank Linking Failed', errorMessage);
    } finally {
      setIsSubmittingBank(false);
    }
  };

  const [isActivating, setIsActivating] = useState(false);

  // Called from Activation step (step 7) — Activate account on backend, go to MPIN
  const activateAccountStep = async () => {
    setIsActivating(true);
    try {
      const accessToken = useAuthStore.getState().accessToken;
      if (!accessToken) throw new Error('Session expired. Please sign in again.');

      await authService.activateAccount(accessToken);
      
      // Update session locally to reflect active status
      await useAuthStore.getState().updateUser({ accountStatus: 'ACTIVE' });

      const nextStep = 8;
      const nextDraft = { ...draftRef.current!, currentStep: nextStep, accountActivated: true };
      await persistDraftAndNavigate(nextDraft, FLOW_STEPS[nextStep].route);
    } catch (error: any) {
      const serverData = error.response?.data;
      const errorMessage = serverData?.message || serverData?.error || error.message || 'Activation failed.';
      Alert.alert('Activation Failed', errorMessage);
    } finally {
      setIsActivating(false);
    }
  };

  const finishSignup = async () => {
    if (!draftRef.current || !validateStep()) {
      return;
    }

    setIsFinishingSignup(true);

    try {
      const latestDraft = draftRef.current;

      if (!latestDraft) {
        return;
      }

      // Step 1: Save MPIN locally
      await mpinService.saveMpinForAccount({
        email: latestDraft.email,
        mobile: latestDraft.mobile,
        mpin: normalizeDigits(latestDraft.mpin),
      });

      // Get authenticated session from auth store
      const user = useAuthStore.getState().user;
      const accessToken = useAuthStore.getState().accessToken;
      const refreshToken = useAuthStore.getState().refreshToken;
      const expiresAt = useAuthStore.getState().expiresAt;

      if (!user || !accessToken) {
        throw new Error('No active authenticated session found. Please sign in.');
      }

      const currentSession = {
        user,
        tokens: {
          accessToken,
          refreshToken: refreshToken ?? '',
          expiresAt: expiresAt ?? (Date.now() + 24 * 60 * 60 * 1000),
        },
      };

      // Step 2: Set MPIN on the backend
      const session = await authService.setMpin(currentSession, normalizeDigits(latestDraft.mpin));

      // Step 3: Update the user profile with the REAL data the user entered during signup
      const updatedSession = {
        ...session,
        user: {
          ...session.user,
          name: latestDraft.fullName || session.user.name,
          email: latestDraft.email || session.user.email,
          mobile: latestDraft.mobile || session.user.mobile,
          dateOfBirth: latestDraft.dateOfBirth || session.user.dateOfBirth,
          address: latestDraft.address || session.user.address,
          panNumber: latestDraft.panNumber?.trim().toUpperCase() || session.user.panNumber,
          aadhaarMasked: latestDraft.aadhaarNumber
            ? `XXXX XXXX ${latestDraft.aadhaarNumber.replace(/\D/g, '').slice(-4).padStart(4, '0')}`
            : session.user.aadhaarMasked,
          bankName: latestDraft.bankName || session.user.bankName,
          accountHolderName: latestDraft.accountHolderName || latestDraft.fullName || session.user.accountHolderName,
          ifscCode: latestDraft.ifscCode?.trim().toUpperCase() || session.user.ifscCode,
          bankMask: latestDraft.accountNumber
            ? `A/C **** ${latestDraft.accountNumber.replace(/\D/g, '').slice(-4)}`
            : session.user.bankMask,
          investorAgreementAccepted: latestDraft.investorAgreementAccepted,
          riskDisclosureAccepted: latestDraft.riskDisclosureAccepted,
          communicationConsent: latestDraft.communicationConsent,
          referralCode: latestDraft.referredByCode || session.user.referralCode,
        },
      };

      // Step 4: Persist the enriched session with real user data
      await signIn(updatedSession);
      markMpinVerified();

      // Use the onboarding resolver to determine the next route.
      // MPIN creation does NOT automatically mean dashboard access.
      const nextRoute = authService.resolveOnboardingRoute(updatedSession.user);
      if (nextRoute === '/(tabs)') {
        // All onboarding complete — dashboard
        await completeOnboarding();
        await signupFlowService.clearDraft();
        router.replace({
          pathname: '/success',
          params: {
            title: 'MPIN Created',
            subtitle: 'Your account is active and your MPIN has been created successfully.',
            cta: 'Go to Dashboard',
            redirect: '/(tabs)',
          },
        });
      } else {
        // Onboarding is NOT complete — route to the correct pending step
        await signupFlowService.clearDraft();
        router.replace(nextRoute);
      }
    } catch (error) {
      Alert.alert('Signup failed', error instanceof Error ? error.message : 'We could not finish the signup right now.');
    } finally {
      setIsFinishingSignup(false);
    }
  };

  const renderStepBody = () => {
    if (!draft) {
      return null;
    }

    switch (currentStep) {
      case 0:
        return (
          <>
            <View style={styles.infoPanel}>
              <Text style={styles.infoPanelText}>Your verified mobile number is ready. Enter your personal details to continue.</Text>
            </View>
            <InputField labelStyle={styles.inputLabel}
              label="Full Name"
              value={draft.fullName}
              onChangeText={(value) => patchDraft({ fullName: value })}
              required
              placeholder="Enter your full name"
              icon={<Ionicons name="person-outline" size={18} color={colors.primary} />}
            />
            <InputField labelStyle={styles.inputLabel}
              label="Email Address"
              value={draft.email}
              onChangeText={(value) => patchDraft({ email: value })}
              keyboardType="email-address"
              required
              placeholder="Enter email address"
              icon={<Ionicons name="mail-outline" size={18} color={colors.primary} />}
            />
            <InputField labelStyle={styles.inputLabel}
              label="Date of Birth (YYYY-MM-DD)"
              value={draft.dateOfBirth}
              onChangeText={(value) => patchDraft({ dateOfBirth: formatDobInput(value) })}
              required
              placeholder="e.g. 1995-05-20"
              keyboardType="number-pad"
              icon={<Ionicons name="calendar-outline" size={18} color={colors.primary} />}
            />
            <InputField labelStyle={styles.inputLabel}
              label="Address"
              value={draft.address}
              onChangeText={(value) => patchDraft({ address: value })}
              required
              placeholder="Enter your residential address"
              icon={<Ionicons name="location-outline" size={18} color={colors.primary} />}
            />
          </>
        );
      case 1: {
        const score = Object.values(passwordChecks).filter(Boolean).length;
        
        return (
          <>
            <InputField labelStyle={styles.inputLabel}
              label="Create Password"
              value={draft.password}
              onChangeText={(value) => patchDraft({ password: value })}
              secure
              required
              placeholder="Enter a secure password"
              icon={<Ionicons name="lock-closed-outline" size={18} color={colors.primary} />}
            />
            
            <PasswordStrengthMeter score={score} isEmpty={draft.password.length === 0} checks={passwordChecks} />

            <InputField labelStyle={styles.inputLabel}
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secure
              required
              placeholder="Enter the same password again"
              icon={<Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />}
              trailing={
                confirmPassword.length > 0 && confirmPassword === draft.password ? (
                  <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                ) : undefined
              }
            />

            <InputField labelStyle={styles.inputLabel}
              label="Referral Code (Optional)"
              value={draft.referredByCode}
              onChangeText={(value) => patchDraft({ referredByCode: normalizeUpper(value).slice(0, 12) })}
              placeholder="Enter referral code"
              autoCapitalize="characters"
              icon={<Ionicons name="pricetag-outline" size={18} color={colors.primary} />}
            />
          </>
        );
      }
      case 2: {
        return (
          <>
            <View style={styles.infoPanel}>
              <Text style={styles.infoPanelText}>Review the terms below, then accept to create your account.</Text>
            </View>

            <View style={styles.termsTable}>
              <View style={[styles.termsRow, styles.termsRowHeader]}>
                <Text style={styles.termsCellFeatureHeader}>Feature</Text>
                <Text style={styles.termsCellDetailsHeader}>Details</Text>
              </View>
              <View style={styles.termsRow}>
                <Text style={styles.termsCellFeature}>Minimum Investment</Text>
                <Text style={styles.termsCellDetails}>Rs5,000</Text>
              </View>
              <View style={styles.termsRow}>
                <Text style={styles.termsCellFeature}>Maximum Investment</Text>
                <Text style={styles.termsCellDetails}>Rs10,00,000</Text>
              </View>
              <View style={styles.termsRow}>
                <Text style={styles.termsCellFeature}>Lock-in Period</Text>
                <Text style={styles.termsCellDetails}>6 Months</Text>
              </View>
              <View style={styles.termsRow}>
                <Text style={styles.termsCellFeature}>Monthly Interest</Text>
                <Text style={styles.termsCellDetails}>10%</Text>
              </View>
              <View style={styles.termsRow}>
                <Text style={styles.termsCellFeature}>Interest Credit</Text>
                <Text style={styles.termsCellDetails}>Wallet</Text>
              </View>
              <View style={styles.termsRow}>
                <Text style={styles.termsCellFeature}>Wallet Withdrawal Minimum</Text>
                <Text style={styles.termsCellDetails}>Rs1,000</Text>
              </View>
              <View style={styles.termsRow}>
                <Text style={styles.termsCellFeature}>Withdrawal Approval</Text>
                <Text style={styles.termsCellDetails}>Admin Approval</Text>
              </View>
              <View style={styles.termsRow}>
                <Text style={styles.termsCellFeature}>Investment Completion Return</Text>
                <Text style={styles.termsCellDetails}>90%</Text>
              </View>
              <View style={[styles.termsRow, styles.termsRowLast]}>
                <Text style={styles.termsCellFeature}>Early Withdrawal Return</Text>
                <Text style={styles.termsCellDetails}>70%</Text>
              </View>
            </View>

            <Text style={styles.termsText}>
              All returns and payout timelines are subject to verification and platform policy updates.
              {'\n\n'}
              Any fraud, policy abuse, or invalid KYC or payment information may result in account suspension.
              {'\n\n'}
              By continuing, you acknowledge that these terms may be revised from time to time.
            </Text>

            <Text style={[styles.termsText, { fontSize: 13, fontFamily: fontFamily.bodySemi, color: colors.primary, marginBottom: 4 }]}>
              Mandatory Agreements
            </Text>
            <View style={{ gap: 8, marginBottom: 16 }}>
              <CheckboxRow
                checked={draft.investorAgreementAccepted}
                onPress={() => patchDraft({ investorAgreementAccepted: !draft.investorAgreementAccepted })}
                label="I Accept the Investor Agreement *"
              />
              <CheckboxRow
                checked={draft.riskDisclosureAccepted}
                onPress={() => patchDraft({ riskDisclosureAccepted: !draft.riskDisclosureAccepted })}
                label="I Accept the Risk Disclosure *"
              />
            </View>

            <Text style={[styles.termsText, { fontSize: 13, fontFamily: fontFamily.bodySemi, color: colors.muted, marginBottom: 4 }]}>
              Optional
            </Text>
            <View style={{ gap: 8, marginBottom: 24 }}>
              <CheckboxRow
                checked={draft.communicationConsent}
                onPress={() => patchDraft({ communicationConsent: !draft.communicationConsent })}
                label="I consent to receive promotional updates and communications"
              />
            </View>
          </>
        );
      }

      case 3: {
        // KYC Document Upload — supports both initial upload and reupload
        const submission4 = kycStatusData?.submission;

        const docStatusChip = (label: string, status?: string, reason?: string) => {
          if (!status || !isReuploadMode) return null;
          const isOk = status === 'APPROVED';
          const isErr = status === 'REJECTED' || status === 'REUPLOAD_REQUIRED';
          return (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Ionicons
                name={isOk ? 'checkmark-circle' : isErr ? 'close-circle' : 'ellipse-outline'}
                size={14}
                color={isOk ? colors.success : isErr ? colors.danger : '#94A3B8'}
              />
              <Text style={{ fontFamily: fontFamily.bodySemi, fontSize: 11, color: isOk ? colors.success : isErr ? colors.danger : '#94A3B8' }}>
                {label}: {isOk ? 'Approved' : isErr ? 'Reupload Required' : 'Pending'}
              </Text>
              {reason ? (
                <Text style={{ fontFamily: fontFamily.body, fontSize: 10, color: colors.danger, flex: 1 }} numberOfLines={2}>
                  — {reason}
                </Text>
              ) : null}
            </View>
          );
        };

        const needsPan = !isReuploadMode || kycService.needsUpload(submission4?.panCardStatus as KycDocumentStatus | undefined);
        const needsFront = !isReuploadMode || kycService.needsUpload(submission4?.aadhaarFrontStatus as KycDocumentStatus | undefined);
        const needsBack = !isReuploadMode || kycService.needsUpload(submission4?.aadhaarBackStatus as KycDocumentStatus | undefined);
        const needsSelfie = !isReuploadMode || kycService.needsUpload(submission4?.selfieStatus as KycDocumentStatus | undefined);
        const needsBank = !isReuploadMode || kycService.needsUpload(submission4?.bankProofStatus as KycDocumentStatus | undefined);

        if (kycFormDisabled) {
          return (
            <>
              <View style={styles.infoPanel}>
                <Text style={styles.infoPanelText}>Your KYC documents have been approved. No further uploads are needed.</Text>
              </View>
            </>
          );
        }

        return (
          <>
            <View style={styles.infoPanel}>
              <Text style={styles.infoPanelText}>
                {isReuploadMode
                  ? 'Some documents need to be re-uploaded. Only upload the documents marked below.'
                  : 'Upload all required documents. These will be submitted together for admin review.'}
              </Text>
            </View>

            {isReuploadMode && kycStatusData?.submission?.rejectionReason ? (
              <View style={[styles.infoPanel, { borderColor: colors.danger + '44', backgroundColor: colors.danger + '11' }]}>
                <Text style={[styles.infoPanelText, { color: colors.danger }]}>
                  Admin feedback: {kycStatusData.submission.rejectionReason}
                </Text>
                {kycStatusData.submission.adminNotes ? (
                  <Text style={[styles.infoPanelText, { color: colors.danger, marginTop: 4, fontSize: 12 }]}>
                    Note: {kycStatusData.submission.adminNotes}
                  </Text>
                ) : null}
              </View>
            ) : null}

            <InputField labelStyle={styles.inputLabel}
              label="PAN Number"
              value={draft.panNumber}
              onChangeText={(value) => patchDraft({ panNumber: normalizeUpper(value).slice(0, 10) })}
              placeholder="Enter 10-character PAN"
              autoCapitalize="characters"
              required
              icon={<Ionicons name="card-outline" size={18} color={colors.primary} />}
            />
            {docStatusChip('PAN Card', submission4?.panCardStatus, submission4?.panCardRejectionReason)}
            {needsPan ? (
              <ImageUploadButton
                label="📸 Upload PAN Card Photo"
                uri={draft.panCardPhoto}
                onPress={() => pickImage('panCardPhoto')}
              />
            ) : null}

            <InputField labelStyle={styles.inputLabel}
              label="Aadhaar Number"
              value={formatAadhaarDisplay(draft.aadhaarNumber)}
              onChangeText={(value) => patchDraft({ aadhaarNumber: normalizeDigits(value).slice(0, 12) })}
              placeholder="Enter 12-digit Aadhaar"
              keyboardType="number-pad"
              required
              icon={<Ionicons name="id-card-outline" size={18} color={colors.primary} />}
            />
            {docStatusChip('Aadhaar Front', submission4?.aadhaarFrontStatus, submission4?.aadhaarFrontRejectionReason)}
            {needsFront ? (
              <ImageUploadButton
                label="📸 Upload Aadhaar Front"
                uri={draft.aadhaarFrontPhoto}
                onPress={() => pickImage('aadhaarFrontPhoto')}
              />
            ) : null}

            {docStatusChip('Aadhaar Back', submission4?.aadhaarBackStatus, submission4?.aadhaarBackRejectionReason)}
            {needsBack ? (
              <ImageUploadButton
                label="📸 Upload Aadhaar Back"
                uri={draft.aadhaarBackPhoto}
                onPress={() => pickImage('aadhaarBackPhoto')}
              />
            ) : null}

            {docStatusChip('Selfie', submission4?.selfieStatus, submission4?.selfieRejectionReason)}
            {needsSelfie ? (
              <ImageUploadButton
                label="🤳 Upload Selfie Photo"
                uri={draft.selfiePhoto}
                onPress={() => pickImage('selfiePhoto')}
              />
            ) : null}

            {docStatusChip('Bank Passbook', submission4?.bankProofStatus, submission4?.bankProofRejectionReason)}
            {needsBank ? (
              <ImageUploadButton
                label="🏦 Upload Bank Passbook / Cancelled Cheque"
                uri={draft.bankPassbookPhoto}
                onPress={() => pickImage('bankPassbookPhoto')}
              />
            ) : null}
          </>
        );
      }
      case 4:
        // Bank Linking — account details
        return (
          <>
            <View style={styles.infoPanel}>
              <Text style={styles.infoPanelText}>Link your primary bank account. Your KYC is approved and you are ready to proceed.</Text>
            </View>
            <InputField labelStyle={styles.inputLabel}
              label="Account Holder Name"
              value={draft.accountHolderName || draft.fullName}
              onChangeText={(value) => patchDraft({ accountHolderName: value })}
              placeholder="Name as per bank records"
              required
              icon={<Ionicons name="person-outline" size={18} color={colors.primary} />}
            />
            <InputField labelStyle={styles.inputLabel}
              label="Bank Account Number"
              value={draft.accountNumber}
              onChangeText={(value) => patchDraft({ accountNumber: normalizeDigits(value).slice(0, 18) })}
              placeholder="Enter bank account number"
              keyboardType="number-pad"
              secure
              required
              icon={<Ionicons name="business-outline" size={18} color={colors.primary} />}
            />
            <InputField labelStyle={styles.inputLabel}
              label="Confirm Account Number"
              value={draft.confirmAccountNumber}
              onChangeText={(value) => patchDraft({ confirmAccountNumber: normalizeDigits(value).slice(0, 18) })}
              placeholder="Re-enter bank account number"
              keyboardType="number-pad"
              required
              icon={<Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />}
            />
            <InputField labelStyle={styles.inputLabel}
              label="IFSC Code"
              value={draft.ifscCode}
              onChangeText={(value) => patchDraft({ ifscCode: normalizeUpper(value).slice(0, 11) })}
              placeholder="e.g. HDFC0001234"
              autoCapitalize="characters"
              required
              icon={<Ionicons name="code-working-outline" size={18} color={colors.primary} />}
            />
            <InputField labelStyle={styles.inputLabel}
              label="Bank Name"
              value={draft.bankName}
              onChangeText={(value) => patchDraft({ bankName: value })}
              placeholder="e.g. HDFC Bank"
              required
              icon={<Ionicons name="wallet-outline" size={18} color={colors.primary} />}
            />
          </>
        );
      case 5:
        return (
          <>
            <PinEntryBoxes
              label="Enter 4-digit MPIN"
              value={draft.mpin}
              isFocused={isMpinFocused}
              onPress={() => {
                setIsMpinFocused(true);
                setIsConfirmMpinFocused(false);
                mpinInputRef.current?.focus();
              }}
            />
            <TextInput
              ref={mpinInputRef}
              value={draft.mpin}
              onChangeText={(value) => patchDraft({ mpin: normalizeDigits(value).slice(0, MPIN_LENGTH) })}
              onFocus={() => {
                setIsMpinFocused(true);
                setIsConfirmMpinFocused(false);
              }}
              onBlur={() => setIsMpinFocused(false)}
              keyboardType="number-pad"
              maxLength={MPIN_LENGTH}
              secureTextEntry
              caretHidden
              contextMenuHidden
              selectionColor="transparent"
              style={styles.hiddenKeyboardInput}
            />
            <PinEntryBoxes
              label="Confirm MPIN"
              value={confirmMpin}
              isFocused={isConfirmMpinFocused}
              onPress={() => {
                setIsMpinFocused(false);
                setIsConfirmMpinFocused(true);
                confirmMpinInputRef.current?.focus();
              }}
            />
            <TextInput
              ref={confirmMpinInputRef}
              value={confirmMpin}
              onChangeText={(value) => setConfirmMpin(normalizeDigits(value).slice(0, MPIN_LENGTH))}
              onFocus={() => {
                setIsMpinFocused(false);
                setIsConfirmMpinFocused(true);
              }}
              onBlur={() => setIsConfirmMpinFocused(false)}
              keyboardType="number-pad"
              maxLength={MPIN_LENGTH}
              secureTextEntry
              caretHidden
              contextMenuHidden
              selectionColor="transparent"
              style={styles.hiddenKeyboardInput}
            />
            <Text style={styles.inlineNote}>Do not use simple patterns like 1234 or 1111.</Text>
            {mpinValue ? (
              <Text style={[styles.inlineNote, isMpinValid ? styles.inlineNoteActive : styles.inlineNoteMuted]}>
                {isMpinValid ? 'MPIN format looks strong.' : 'Use 4 digits and avoid easy sequences.'}
              </Text>
            ) : null}
          </>
        );
      default:
        return null;
    }
  };

  if (isLoadingDraft) {
    return (
      <AppScreen>
        <ScreenHeader title="Complete Signup" subtitle="Loading your saved registration progress..." onBackPress={() => (router.canGoBack() ? router.back() : router.replace('/signup/mobile'))} />
        <SurfaceCard>
          <Text style={styles.fallbackText}>Preparing your signup flow.</Text>
        </SurfaceCard>
      </AppScreen>
    );
  }

  const handleStartAgain = async () => {
    await signupFlowService.clearDraft();
    await useAuthStore.getState().signOut();
    router.replace('/signup/mobile');
  };

  if (!draft?.otpVerified || !draft.mobile.trim()) {
    return (
      <AppScreen>
        <ScreenHeader title="Complete Signup" subtitle="Start with mobile verification before continuing to the registration steps." onBackPress={() => void handleStartAgain()} />
        <SurfaceCard>
          <Text style={styles.fallbackText}>No verified mobile signup draft was found on this device.</Text>
        </SurfaceCard>
        <GradientButton label="Start Signup Again" onPress={() => void handleStartAgain()} />
      </AppScreen>
    );
  }

  // Determine button label and handler based on step
  const getButtonConfig = () => {
    switch (currentStep) {
      case 2: // Terms → Register & go to KYC
        return {
          label: isRegisteringAndActivating ? 'Creating Account...' : currentStepMeta.actionLabel,
          onPress: () => void registerAndGoToKyc(),
          disabled: isRegisteringAndActivating,
        };
      case 3: // KYC → Submit all documents
        return {
          label: isSubmittingKyc ? 'Submitting Documents...' : currentStepMeta.actionLabel,
          onPress: () => void submitKycDocuments(),
          disabled: isSubmittingKyc,
        };
      case 4: // Bank → Submit & go to MPIN
        return {
          label: isSubmittingBank ? 'Linking Bank...' : currentStepMeta.actionLabel,
          onPress: () => void submitBank(),
          disabled: isSubmittingBank,
        };
      case 5: // MPIN → Finish signup
        return {
          label: isFinishingSignup ? 'Creating MPIN...' : currentStepMeta.actionLabel,
          onPress: () => void finishSignup(),
          disabled: isFinishingSignup,
        };
      default:
        return {
          label: currentStepMeta.actionLabel,
          onPress: goNext,
          disabled: false,
        };
    }
  };

  const buttonConfig = getButtonConfig();

  return (
    <AppScreen
      contentStyle={styles.page}
      fullBleed
      contentBottomInset={currentStep === 5 ? Math.max(insets.bottom + 220, 240) : Math.max(insets.bottom + 72, 88)}
      backgroundColor={colors.dark}
      safeAreaEdges={['left', 'right']}
      scrollViewProps={{ keyboardShouldPersistTaps: 'handled' }}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.dark} />
      <View style={[styles.stepShell, !isTablet && styles.stepShellMobile]}>
        <LinearGradient colors={gradients.dark} style={[styles.heroPanel, { paddingTop: Math.max(insets.top + 12, 26) }]}>
          <View style={styles.heroTopRow}>
            <Pressable onPress={goBack} style={({ pressed }) => [styles.heroBackButton, pressed && styles.heroBackButtonPressed]}>
              <Ionicons name="arrow-back" size={22} color={colors.surface} />
            </Pressable>
            <Text style={styles.heroStepLabel}>STEP {currentStep + 3} OF {TOTAL_SIGNUP_STEPS}</Text>
            <View style={styles.heroSpacer} />
          </View>

          <View style={styles.heroIconTile}>
            <Ionicons name={currentStepMeta.icon} size={26} color={colors.primary} />
          </View>

          <Text style={styles.heroTitle}>{currentStepMeta.title}</Text>
          <Text style={styles.heroSubtitle}>{currentStepMeta.subtitle}</Text>
        </LinearGradient>

        <View style={[styles.formPanel, !isTablet && styles.formPanelMobile]}>
          {renderStepBody()}

          <GradientButton
            label={buttonConfig.label}
            onPress={buttonConfig.onPress}
            iconPosition="end"
            style={[styles.primaryAction, buttonConfig.disabled && styles.primaryActionDisabled]}
            disabled={buttonConfig.disabled}
          />
        </View>

        <View style={styles.progressRail}>
          <View style={[styles.progressFill, { width: stepProgressWidth }]} />
        </View>
      </View>
    </AppScreen>
  );
};

