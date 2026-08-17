import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { styles } from './signup-flow-styles';
import { usePathname, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Image, Pressable, StatusBar, StyleSheet, Text, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fontFamily, gradients, radius, shadows } from '../../constants/theme';
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
import { DatePickerInput } from '../ui/date-picker-input';
import { GradientButton } from '../ui/gradient-button';
import { InputField } from '../ui/input-field';
import { ScreenHeader } from '../ui/screen-header';
import { SurfaceCard } from '../ui/surface-card';

const TOTAL_SIGNUP_STEPS = 5;
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
    subtitle: 'Add your full name, date of birth, and residential address.',
    actionLabel: 'Continue to PAN & KYC',
    icon: 'person-outline',
  },
  {
    route: '/signup/kyc',
    title: 'PAN & Document Upload',
    subtitle: 'Enter your PAN number and upload identity documents.',
    actionLabel: 'Continue to Bank Details',
    icon: 'id-card-outline',
  },
  {
    route: '/signup/bank',
    title: 'Bank Account Details',
    subtitle: 'Add your bank details for secure deposits and payouts.',
    actionLabel: 'Continue to Security Setup',
    icon: 'business-outline',
  },
  {
    route: '/signup/password',
    title: 'Security Credentials',
    subtitle: 'Create your login password, 4-digit MPIN, and referral code.',
    actionLabel: 'Continue to Review & Terms',
    icon: 'lock-closed-outline',
  },
  {
    route: '/signup/terms',
    title: 'Terms & Privacy Policy',
    subtitle: 'Review your application summary and accept platform policies.',
    actionLabel: 'Submit Application & Open Dashboard',
    icon: 'document-text-outline',
  },
] as const;

const normalizeDigits = (value: string) => value.replace(/\D/g, '');
const normalizeUpper = (value: string) => value.toUpperCase().replace(/[^A-Z0-9]/g, '');
const normalizeDraftStep = (stepIndex: number) => Math.min(Math.max(stepIndex, 0), FLOW_STEPS.length - 1);
const formatStepLabel = (stepIndex: number) => `STEP ${stepIndex + 1} OF ${TOTAL_SIGNUP_STEPS}`;
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
        const stepIdx = (FLOW_STEPS as readonly any[]).findIndex((step: any) => step.route === pathname);
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

  const routeStepIndex = (FLOW_STEPS as readonly any[]).findIndex((step: any) => step.route === pathname);
  const savedStep = normalizeDraftStep(draft?.currentStep ?? 0);
  const currentStep = routeStepIndex >= 0 ? routeStepIndex : savedStep;
  const currentStepMeta = FLOW_STEPS[currentStep];
  const stepProgressWidth = `${((currentStep + 1) / TOTAL_SIGNUP_STEPS) * 100}%` as `${number}%`;
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

  // Fetch KYC status when landing on KYC step (step 1) to support reupload and prefill
  useEffect(() => {
    if (currentStep !== 1 || isLoadingDraft || !draft) {
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
        // KYC is pending review, redirect to Bank linkage (step index 4)
        const nextStep = Math.min(4, FLOW_STEPS.length - 1);
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
        const email = draft.email.trim().toLowerCase();
        const dateOfBirth = draft.dateOfBirth.trim();
        const address = draft.address.trim();

        if (!fullName) {
          Alert.alert('Full Name Required', 'Enter your full name to continue.');
          return false;
        }

        if (!emailPattern.test(email)) {
          Alert.alert('Email Required', 'Enter a valid email address to receive payment invoices and account updates.');
          return false;
        }

        if (!dateOfBirth) {
          Alert.alert('Date of Birth Required', 'Enter your date of birth to continue.');
          return false;
        }

        if (!isDobFormat(dateOfBirth)) {
          Alert.alert('Invalid Date Format', 'Use YYYY-MM-DD format (e.g. 1995-05-20).');
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
          Alert.alert('Age Requirement', 'You must be 18 years or older to create an investor account.');
          return false;
        }

        if (!address) {
          Alert.alert('Address Required', 'Enter your residential address to continue.');
          return false;
        }

        patchDraft(getStatusPatch('PROFILE_COMPLETED', {
          fullName,
          email,
          dateOfBirth,
          address,
        }));
        return true;
      }
      case 1: {
        // Step 1: PAN & KYC Document Upload
        if (!isPanValid) {
          Alert.alert('Invalid PAN Number', 'Please enter a valid 10-character PAN number (e.g. ABCDE1234F).');
          return false;
        }

        if (!draft.panCardPhoto) {
          Alert.alert('PAN Card Photo Required', 'Please upload or scan a clear photo of your PAN card.');
          return false;
        }

        if (!isAadhaarValid) {
          Alert.alert('Invalid Aadhaar Number', 'Please enter your 12-digit Aadhaar number.');
          return false;
        }

        patchDraft(getStatusPatch('KYC_COMPLETED', {
          panNumber: panValue,
          aadhaarNumber: aadhaarValue,
        }));
        return true;
      }
      case 2: {
        // Step 2: Bank Account Details
        if (!isAccountNumberValid) {
          Alert.alert('Invalid Account Number', 'Enter a valid bank account number (9–18 digits).');
          return false;
        }
        if (!isConfirmAccountNumberValid) {
          Alert.alert('Account Number Mismatch', 'Bank account numbers do not match.');
          return false;
        }
        if (!isIfscValid) {
          Alert.alert('Invalid IFSC Code', 'Enter a valid 11-character bank IFSC code.');
          return false;
        }
        if (!bankNameValue.trim()) {
          Alert.alert('Bank Name Required', 'Please enter your bank name.');
          return false;
        }

        patchDraft(getStatusPatch('BANK_LINKED', {
          accountNumber: accountNumberValue,
          confirmAccountNumber: confirmAccountNumberValue,
          ifscCode: ifscValue,
          bankName: bankNameValue,
          accountHolderName: draft.accountHolderName || draft.fullName,
        }));
        return true;
      }
      case 3: {
        // Step 3: Password & Security MPIN Setup
        if (!strongPasswordPattern.test(draft.password)) {
          Alert.alert('Weak Password', 'Password must be at least 8 characters long with uppercase, lowercase, number, and a special character.');
          return false;
        }

        if (!confirmPassword.trim()) {
          Alert.alert('Confirm Password', 'Enter the same password again to confirm.');
          return false;
        }

        if (draft.password !== confirmPassword) {
          Alert.alert('Password Mismatch', 'Password and confirm password must match exactly.');
          return false;
        }

        const mpin = normalizeDigits(draft.mpin).slice(0, MPIN_LENGTH);
        if (!new RegExp(`^\\d{${MPIN_LENGTH}}$`).test(mpin)) {
          Alert.alert('Invalid MPIN', 'Enter a 4-digit security MPIN.');
          return false;
        }

        if (simpleMpins.has(mpin) || isSequentialMpin(mpin)) {
          Alert.alert('Weak MPIN', 'Avoid simple sequences like 1234 or repeated digits like 1111.');
          return false;
        }

        if (mpin !== confirmMpin) {
          Alert.alert('MPIN Mismatch', 'MPIN and confirm MPIN must match.');
          return false;
        }

        patchDraft(getStatusPatch('PASSWORD_CREATED', {
          password: draft.password,
          mpin,
        }));
        return true;
      }
      case 4: {
        // Step 4: Terms & Privacy Policy Review
        if (!draft.investorAgreementAccepted || !draft.riskDisclosureAccepted) {
          Alert.alert('Accept Policies', 'You must accept the Terms & Conditions and Privacy Policy to create your account.');
          return false;
        }

        patchDraft(getStatusPatch('TERMS_ACCEPTED'));
        return true;
      }
      default:
        return true;
    }
  };

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
      ...draftRef.current!,
      currentStep: previousStep,
    };

    await persistDraftAndNavigate(previousDraft, FLOW_STEPS[previousStep].route);
  };

  // Called from Terms step (Step 4 / Final Step) — Submit application, attach KYC docs, and open Dashboard
  const registerAndSubmitApplication = async () => {
    if (!draftRef.current || !validateStep()) {
      return;
    }

    const latestDraft = draftRef.current;

    // Pre-flight validation
    if (!latestDraft.fullName.trim()) {
      Alert.alert('Missing Information', 'Full name is missing. Go back to Personal Details.');
      return;
    }
    if (!latestDraft.mobile.trim()) {
      Alert.alert('Missing Information', 'Mobile number is missing. Please restart signup.');
      return;
    }
    if (!latestDraft.password || !strongPasswordPattern.test(latestDraft.password)) {
      Alert.alert('Invalid Password', 'Password must meet security requirements. Go back to Security Credentials.');
      return;
    }
    if (!latestDraft.dateOfBirth.trim()) {
      Alert.alert('Missing Information', 'Date of birth is missing.');
      return;
    }
    if (!latestDraft.address.trim()) {
      Alert.alert('Missing Information', 'Address is missing.');
      return;
    }
    if (!latestDraft.investorAgreementAccepted || !latestDraft.riskDisclosureAccepted) {
      Alert.alert('Accept Policies', 'You must accept the Terms and Privacy Policy to continue.');
      return;
    }
    if (!latestDraft.signupVerificationToken) {
      Alert.alert('Session Expired', 'Your verification session has expired. Please restart signup from mobile verification.');
      return;
    }

    setIsRegisteringAndActivating(true);

    try {
      const cleanMobile = latestDraft.mobile.replace(/\D/g, '');
      const userEmail = latestDraft.email?.trim() || `${cleanMobile}@anusha.trade`;

      const registration = await authService.register({
        idToken: latestDraft.signupVerificationToken,
        fullName: latestDraft.fullName,
        email: userEmail,
        password: latestDraft.password,
        mpin: latestDraft.mpin || undefined,
        dateOfBirth: latestDraft.dateOfBirth || undefined,
        address: latestDraft.address || undefined,
        panNumber: latestDraft.panNumber?.trim().toUpperCase() || undefined,
        aadhaarLast4: latestDraft.aadhaarNumber ? latestDraft.aadhaarNumber.slice(-4) : undefined,
        bankAccountNumber: latestDraft.accountNumber || undefined,
        bankIfscCode: latestDraft.ifscCode?.trim().toUpperCase() || undefined,
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

      // Step 2: Sign in session
      await signIn(registration.session);

      // Step 3: Background upload KYC documents if attached
      if (latestDraft.panCardPhoto || latestDraft.aadhaarFrontPhoto || latestDraft.selfiePhoto || latestDraft.bankPassbookPhoto) {
        try {
          await kycService.submitKyc({
            panCardImageUri: latestDraft.panCardPhoto,
            aadhaarFrontImageUri: latestDraft.aadhaarFrontPhoto,
            aadhaarBackImageUri: latestDraft.aadhaarBackPhoto,
            selfiePhotoUri: latestDraft.selfiePhoto,
            bankPassbookUri: latestDraft.bankPassbookPhoto,
            panNumber: latestDraft.panNumber,
            aadhaarLast4: latestDraft.aadhaarNumber ? latestDraft.aadhaarNumber.slice(-4) : '',
            dateOfBirth: latestDraft.dateOfBirth,
            address: latestDraft.address,
          });
        } catch (kycErr) {
          console.warn('KYC background submission notice:', kycErr);
        }
      }

      // Step 4: Save MPIN locally
      if (latestDraft.mpin) {
        await mpinService.saveMpinForAccount({
          email: userEmail,
          mobile: latestDraft.mobile,
          mpin: latestDraft.mpin,
        });
      }

      // Step 5: Update session and open Dashboard immediately!
      await useAuthStore.getState().updateUser({
        mpinConfigured: Boolean(latestDraft.mpin),
        kycStatus: 'PENDING',
        accountStatus: 'ACTIVE',
        bankVerified: Boolean(latestDraft.accountNumber),
        panNumber: latestDraft.panNumber?.trim().toUpperCase(),
        address: latestDraft.address,
        dateOfBirth: latestDraft.dateOfBirth,
      });
      completeOnboarding();
      await signupFlowService.clearDraft();
      router.replace('/(tabs)');
    } catch (error: any) {
      const status = error.response?.status;
      const serverData = error.response?.data;
      let errorMessage = 'Something went wrong. Please try again.';

      if (status === 404) {
        errorMessage = 'Registration endpoint is currently unavailable. Please verify your connection or try again.';
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

      Alert.alert('Registration Failed', errorMessage);
    } finally {
      setIsRegisteringAndActivating(false);
    }
  };

  const renderStepBody = () => {
    if (!draft) {
      return null;
    }

    switch (currentStep) {
      case 0:
        // Step 0: Personal Details
        return (
          <>
            <View style={styles.infoPanel}>
              <Text style={styles.infoPanelText}>Your verified mobile number is ready. Enter your personal details to begin.</Text>
            </View>
            <InputField labelStyle={styles.inputLabel}
              label="Full Name"
              value={draft.fullName}
              onChangeText={(value) => patchDraft({ fullName: value })}
              required
              placeholder="Enter your full legal name"
              icon={<Ionicons name="person-outline" size={18} color={colors.primary} />}
            />
            <InputField labelStyle={styles.inputLabel}
              label="Email Address"
              value={draft.email}
              onChangeText={(value) => patchDraft({ email: value.trim().toLowerCase() })}
              required
              placeholder="Enter your email address"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              icon={<Ionicons name="mail-outline" size={18} color={colors.primary} />}
            />
            <DatePickerInput
              label="Date of Birth"
              value={draft.dateOfBirth}
              onChangeDate={(value) => patchDraft({ dateOfBirth: value })}
              required
              placeholder="YYYY-MM-DD (e.g. 1995-05-20)"
              labelStyle={styles.inputLabel}
            />
            <InputField labelStyle={styles.inputLabel}
              label="Residential Address"
              value={draft.address}
              onChangeText={(value) => patchDraft({ address: value })}
              required
              placeholder="Enter your permanent / residential address"
              icon={<Ionicons name="location-outline" size={18} color={colors.primary} />}
            />
          </>
        );
      case 1: {
        // Step 1: PAN & Document Upload (Here before Terms and Dashboard)
        return (
          <>
            <View style={styles.infoPanel}>
              <Text style={styles.infoPanelText}>
                Provide your PAN and identity details. Upload photos now for quick KYC approval upon registration.
              </Text>
            </View>

            <InputField labelStyle={styles.inputLabel}
              label="PAN Number"
              value={draft.panNumber}
              onChangeText={(value) => patchDraft({ panNumber: normalizeUpper(value).slice(0, 10) })}
              placeholder="Enter 10-character PAN (e.g. ABCDE1234F)"
              autoCapitalize="characters"
              required
              icon={<Ionicons name="card-outline" size={18} color={colors.primary} />}
            />

            <ImageUploadButton
              label="📸 Upload PAN Card Photo *"
              uri={draft.panCardPhoto}
              onPress={() => pickImage('panCardPhoto')}
            />

            <InputField labelStyle={styles.inputLabel}
              label="Aadhaar Number"
              value={formatAadhaarDisplay(draft.aadhaarNumber)}
              onChangeText={(value) => patchDraft({ aadhaarNumber: normalizeDigits(value).slice(0, 12) })}
              placeholder="Enter 12-digit Aadhaar"
              keyboardType="number-pad"
              required
              icon={<Ionicons name="id-card-outline" size={18} color={colors.primary} />}
            />

            <ImageUploadButton
              label="📸 Upload Aadhaar Front (Optional)"
              uri={draft.aadhaarFrontPhoto}
              onPress={() => pickImage('aadhaarFrontPhoto')}
            />

            <ImageUploadButton
              label="📸 Upload Aadhaar Back (Optional)"
              uri={draft.aadhaarBackPhoto}
              onPress={() => pickImage('aadhaarBackPhoto')}
            />

            <ImageUploadButton
              label="🤳 Upload Selfie Photo (Optional)"
              uri={draft.selfiePhoto}
              onPress={() => pickImage('selfiePhoto')}
            />

            <ImageUploadButton
              label="🏦 Upload Bank Passbook / Cheque (Optional)"
              uri={draft.bankPassbookPhoto}
              onPress={() => pickImage('bankPassbookPhoto')}
            />
          </>
        );
      }
      case 2:
        // Step 2: Bank Account Details
        return (
          <>
            <View style={styles.infoPanel}>
              <Text style={styles.infoPanelText}>Link your primary bank account for seamless investment deposits and monthly returns.</Text>
            </View>
            <InputField labelStyle={styles.inputLabel}
              label="Account Holder Name"
              value={draft.accountHolderName || draft.fullName}
              onChangeText={(value) => patchDraft({ accountHolderName: value })}
              placeholder="Name as per bank passbook"
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
              placeholder="e.g. HDFC Bank, SBI, ICICI"
              required
              icon={<Ionicons name="wallet-outline" size={18} color={colors.primary} />}
            />
          </>
        );
      case 3: {
        // Step 3: Security Credentials (Password & MPIN)
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

            <PinEntryBoxes
              label="Set 4-digit Security MPIN"
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
              label="Confirm 4-digit MPIN"
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
      case 4: {
        // Step 4: Final Step — Application Summary, Privacy Policy & Terms Acceptance
        const docCount = [
          draft.panCardPhoto && 'PAN Card',
          draft.aadhaarFrontPhoto && 'Aadhaar Front',
          draft.aadhaarBackPhoto && 'Aadhaar Back',
          draft.selfiePhoto && 'Selfie Photo',
          draft.bankPassbookPhoto && 'Bank Proof',
        ].filter(Boolean);

        return (
          <>
            <View style={styles.infoPanel}>
              <Text style={styles.infoPanelText}>
                Review your profile details below. Read and accept platform policies to submit your application and open your dashboard.
              </Text>
            </View>

            {/* Application Overview Summary Card */}
            <View style={[styles.termsTable, { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', marginBottom: 16 }]}>
              <View style={[styles.termsRow, styles.termsRowHeader, { backgroundColor: 'rgba(56, 189, 248, 0.12)' }]}>
                <Text style={[styles.termsCellFeatureHeader, { color: colors.cyan }]}>Application Summary</Text>
                <Text style={[styles.termsCellDetailsHeader, { color: colors.cyan }]}>Status</Text>
              </View>
              <View style={styles.termsRow}>
                <Text style={styles.termsCellFeature}>Applicant Name</Text>
                <Text style={styles.termsCellDetails}>{draft.fullName || '—'}</Text>
              </View>
              <View style={styles.termsRow}>
                <Text style={styles.termsCellFeature}>Mobile Number</Text>
                <Text style={styles.termsCellDetails}>{draft.mobile || '—'}</Text>
              </View>
              <View style={styles.termsRow}>
                <Text style={styles.termsCellFeature}>Date of Birth</Text>
                <Text style={styles.termsCellDetails}>{draft.dateOfBirth || '—'}</Text>
              </View>
              <View style={styles.termsRow}>
                <Text style={styles.termsCellFeature}>PAN Number</Text>
                <Text style={styles.termsCellDetails}>{draft.panNumber ? `${draft.panNumber.slice(0, 5)}XXXX${draft.panNumber.slice(-1)}` : '—'}</Text>
              </View>
              <View style={styles.termsRow}>
                <Text style={styles.termsCellFeature}>Bank Account</Text>
                <Text style={styles.termsCellDetails}>{draft.accountNumber ? `**** ${draft.accountNumber.slice(-4)} (${draft.bankName || 'Bank'})` : '—'}</Text>
              </View>
              <View style={[styles.termsRow, styles.termsRowLast]}>
                <Text style={styles.termsCellFeature}>KYC Documents</Text>
                <Text style={[styles.termsCellDetails, { color: colors.success, fontFamily: fontFamily.bodyBold }]}>
                  {docCount.length > 0 ? `${docCount.length} Uploaded ✓` : 'PAN Attached ✓'}
                </Text>
              </View>
            </View>

            {/* Platform Terms Table */}
            <View style={styles.termsTable}>
              <View style={[styles.termsRow, styles.termsRowHeader]}>
                <Text style={styles.termsCellFeatureHeader}>Investment Plan</Text>
                <Text style={styles.termsCellDetailsHeader}>Terms</Text>
              </View>
              <View style={styles.termsRow}>
                <Text style={styles.termsCellFeature}>Minimum Investment</Text>
                <Text style={styles.termsCellDetails}>Rs 5,000</Text>
              </View>
              <View style={styles.termsRow}>
                <Text style={styles.termsCellFeature}>Maximum Investment</Text>
                <Text style={styles.termsCellDetails}>Rs 10,00,000</Text>
              </View>
              <View style={styles.termsRow}>
                <Text style={styles.termsCellFeature}>Lock-in Period</Text>
                <Text style={styles.termsCellDetails}>6 Months</Text>
              </View>
              <View style={styles.termsRow}>
                <Text style={styles.termsCellFeature}>Monthly Return</Text>
                <Text style={styles.termsCellDetails}>10% credited to wallet</Text>
              </View>
              <View style={[styles.termsRow, styles.termsRowLast]}>
                <Text style={styles.termsCellFeature}>Withdrawal Minimum</Text>
                <Text style={styles.termsCellDetails}>Rs 1,000 (Admin Approval)</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginVertical: 12 }}>
              <Pressable
                onPress={openTerms}
                style={{ flex: 1, paddingVertical: 11, paddingHorizontal: 12, backgroundColor: '#F8FAFC', borderRadius: radius.md, borderWidth: 1, borderColor: '#DBEAFE', alignItems: 'center' }}
              >
                <Text style={{ fontFamily: fontFamily.bodySemi, fontSize: 12, color: colors.cyan }}>📄 Read Terms</Text>
              </Pressable>
              <Pressable
                onPress={openPrivacyPolicy}
                style={{ flex: 1, paddingVertical: 11, paddingHorizontal: 12, backgroundColor: '#F8FAFC', borderRadius: radius.md, borderWidth: 1, borderColor: '#DBEAFE', alignItems: 'center' }}
              >
                <Text style={{ fontFamily: fontFamily.bodySemi, fontSize: 12, color: colors.cyan }}>🔒 Read Privacy Policy</Text>
              </Pressable>
            </View>

            <View style={{ gap: 10, marginBottom: 16 }}>
              <CheckboxRow
                checked={draft.investorAgreementAccepted}
                onPress={() => patchDraft({ investorAgreementAccepted: !draft.investorAgreementAccepted })}
                label="I Accept the Terms & Conditions and Investor Agreement *"
              />
              <CheckboxRow
                checked={draft.riskDisclosureAccepted}
                onPress={() => patchDraft({ riskDisclosureAccepted: !draft.riskDisclosureAccepted })}
                label="I Accept the Privacy Policy and Risk Disclosure *"
              />
            </View>
          </>
        );
      }
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
      case 4: // Terms & Privacy Policy (Final Step) → Submit application & open dashboard
        return {
          label: isRegisteringAndActivating ? 'Submitting Application...' : currentStepMeta.actionLabel,
          onPress: () => void registerAndSubmitApplication(),
          disabled: isRegisteringAndActivating,
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
      contentBottomInset={currentStep === 3 ? Math.max(insets.bottom + 220, 240) : Math.max(insets.bottom + 72, 88)}
      backgroundColor={'#F7F8FA'}
      safeAreaEdges={['left', 'right']}
      scrollViewProps={{ keyboardShouldPersistTaps: 'handled' }}
    >
      <StatusBar barStyle="dark-content" backgroundColor={'#F7F8FA'} />
      <View style={[styles.stepShell, !isTablet && styles.stepShellMobile]}>
        <LinearGradient colors={gradients.dark} style={[styles.heroPanel, { paddingTop: Math.max(insets.top + 12, 26) }]}>
          <View style={styles.heroTopRow}>
            <Pressable onPress={goBack} style={({ pressed }) => [styles.heroBackButton, pressed && styles.heroBackButtonPressed]}>
              <Ionicons name="arrow-back" size={22} color="#374151" />
            </Pressable>
            <Text style={styles.heroStepLabel}>STEP {currentStep + 1} OF {TOTAL_SIGNUP_STEPS}</Text>
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
      </View>
    </AppScreen>
  );
};



