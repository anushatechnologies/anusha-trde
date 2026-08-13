import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useMutation } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { Alert, Modal, Platform, Pressable, StatusBar, StyleProp, StyleSheet, Text, TextInput, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FadeInView } from '../../animations/fade-in-view';
import { isTestingOtpMode, runtimeConfig } from '../../constants/runtime-config';
import { colors, fontFamily, gradients, radius, shadows } from '../../constants/theme';
import { useSessionsQuery } from '../../hooks/use-app-queries';
import { authService } from '../../services/auth.service';
import { getAuthErrorMessage } from '../../services/firebase-auth.service';
import { createSignupDraft, getSignupRouteForStep, signupFlowService, type SignupDraft } from '../../services/signup-flow.service';
import { useAuthStore } from '../../store/use-auth-store';
import { OtpPurpose, SessionItem } from '../../types';
import { useReceiptPolling } from '../../hooks/use-receipt-polling';
import { maskContact } from '../../utils/format';
import { useResponsive } from '../../utils/responsive';
import { ReceiptStatusCard } from '../receipt/receipt-status-card';
import { AppScreen } from '../ui/app-screen';
import { BrandLogo } from '../ui/brand-logo';
import { GradientButton } from '../ui/gradient-button';
import { InputField } from '../ui/input-field';
import { ListRow } from '../ui/list-row';
import { ScreenHeader } from '../ui/screen-header';
import { SectionTitle } from '../ui/section-title';
import { SkeletonBlock } from '../ui/skeleton-block';
import { SurfaceCard } from '../ui/surface-card';

const getParam = (value: string | string[] | undefined, fallback = '') =>
  Array.isArray(value) ? value[0] || fallback : value || fallback;

const normalizeCountryCode = (value: string) => {
  const trimmed = value.trim();
  const sanitized = trimmed.replace(/[^\d+]/g, '');

  if (!sanitized) {
    return '+91';
  }

  if (sanitized.startsWith('+')) {
    return sanitized;
  }

  return `+${sanitized.replace(/\D/g, '')}`;
};

const normalizeMobileDigits = (value: string) => value.replace(/\D/g, '').slice(0, 10);

type OtpSuccessState = {
  title: string;
  subtitle: string;
  ctaLabel: string;
  onContinue: () => void;
};

const TOTAL_REGISTRATION_STEPS = 10;
const getRegistrationProgressWidth = (stepNumber: number) =>
  `${(stepNumber / TOTAL_REGISTRATION_STEPS) * 100}%` as `${number}%`;

const OtpBoxes = ({ code, isFocused }: { code: string; isFocused: boolean }) => (
  <View style={styles.otpRow}>
    {new Array(6).fill(null).map((_, index) => (
      <View
        key={`otp-${index}`}
        style={[
          styles.otpBox,
          index === Math.min(code.length, 5) && isFocused && styles.otpBoxFocused,
        ]}
      >
        <Text style={styles.otpDigit}>{code[index] || ''}</Text>
      </View>
    ))}
  </View>
);

const RegistrationStepCard = ({
  stepLabel,
  title,
  subtitle,
  icon,
  progressWidth,
  onBackPress,
  shellStyle,
  bodyStyle,
  heroStyle,
  children,
}: {
  stepLabel: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  progressWidth: `${number}%`;
  onBackPress: () => void;
  shellStyle?: StyleProp<ViewStyle>;
  bodyStyle?: StyleProp<ViewStyle>;
  heroStyle?: StyleProp<ViewStyle>;
  children: ReactNode;
}) => (
  <View style={[styles.registrationShell, shellStyle]}>
    <LinearGradient colors={gradients.dark} style={[styles.registrationHero, heroStyle]}>
      <View style={styles.registrationTopRow}>
        <Pressable onPress={onBackPress} style={({ pressed }) => [styles.registrationBackButton, pressed && styles.registrationBackButtonPressed]}>
          <Ionicons name="arrow-back" size={22} color={colors.surface} />
        </Pressable>
        <Text style={styles.registrationStepLabel}>{stepLabel}</Text>
        <View style={styles.registrationSpacer} />
      </View>

      <View style={styles.registrationIconTile}>
        <Ionicons name={icon} size={26} color={colors.primary} />
      </View>

      <Text style={styles.registrationTitle}>{title}</Text>
      <Text style={styles.registrationSubtitle}>{subtitle}</Text>
    </LinearGradient>

    <View style={[styles.registrationBody, bodyStyle]}>{children}</View>

    <View style={styles.registrationProgressRail}>
      <View style={[styles.registrationProgressFill, { width: progressWidth }]} />
    </View>
  </View>
);

const SessionCard = ({ item, showLocation = true }: { item: SessionItem; showLocation?: boolean }) => (
  <SurfaceCard>
    <View style={styles.sessionHeader}>
      <View style={styles.sessionLead}>
        <View style={styles.sessionIconWrap}>
          <Ionicons
            name={item.platform === 'web' ? 'desktop-outline' : 'phone-portrait-outline'}
            size={18}
            color={colors.primary}
          />
        </View>
        <View style={styles.sessionCopy}>
          <Text style={styles.sessionTitle}>{item.device}</Text>
          <Text style={styles.sessionMeta}>{showLocation ? item.location : item.ipAddress}</Text>
        </View>
      </View>
      {item.current ? (
        <View style={styles.currentBadge}>
          <Text style={styles.currentBadgeText}>Current</Text>
        </View>
      ) : null}
    </View>
    <Text style={styles.sessionFooter}>
      {showLocation ? `IP: ${item.ipAddress}` : `Last active: ${item.lastActive}`}
    </Text>
    <Text style={styles.sessionFooter}>Last active: {item.lastActive}</Text>
  </SurfaceCard>
);

export const LoginScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ target?: string; mode?: 'mobile' | 'email' }>();
  const { isTablet, width } = useResponsive();
  const insets = useSafeAreaInsets();
  const signIn = useAuthStore((state) => state.signIn);
  const setPreferredMode = useAuthStore((state) => state.setPreferredLoginMode);
  const preferredMode = useAuthStore((state) => state.preferredLoginMode);
  const incomingMobile = getParam(params.target, '');
  const incomingMode = (getParam(params.mode, '') as 'mobile' | 'email') || preferredMode;

  const [mode, setMode] = useState<'mobile' | 'email'>(incomingMode);
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const isCompact = width < 390;
  const normalizedEmail = email.trim().toLowerCase();

  useEffect(() => {
    if (incomingMode === 'mobile' || incomingMode === 'email') {
      setMode(incomingMode);
    }
    if (incomingMobile) {
      if (incomingMode === 'email') {
        setEmail(incomingMobile);
      } else {
        setMobile(normalizeMobileDigits(incomingMobile));
      }
    }
  }, [incomingMobile, incomingMode]);

  const handleMobileChange = (value: string) => {
    let digits = value.replace(/\D/g, '');
    if (digits.startsWith('91') && digits.length > 10) {
      digits = digits.slice(2);
    }
    setMobile(digits.slice(0, 10));
  };

  const handleEmailChange = (value: string) => {
    setEmail(value.replace(/\s+/g, ''));
  };

  const loginMutation = useMutation({
    mutationFn: () => mode === 'mobile' 
      ? authService.loginWithMobileMpin(mobile, password)
      : authService.loginWithEmail(normalizedEmail, password),
    onSuccess: async (data) => {
      await setPreferredMode(mode);
      await signIn(data);
      // Use the onboarding resolver to determine the correct route.
      // Do not assume MPIN or accountStatus alone unlocks the dashboard.
      const nextRoute = authService.resolveOnboardingRoute(data.user);
      if (nextRoute !== '/(tabs)') {
        // Onboarding incomplete — let RootNavigator handle the redirect
        return;
      }
      router.replace('/(tabs)');
    },
    onError: (error) => {
      const msg = getAuthErrorMessage(error);
      const isNotFound =
        msg.includes('USER_NOT_FOUND') ||
        msg.toLowerCase().includes('not found') ||
        msg.toLowerCase().includes('not registered') ||
        msg.toLowerCase().includes('does not exist');

      if (isNotFound) {
        const targetValue = mode === 'mobile' ? mobile : normalizedEmail;
        Alert.alert(
          'Account Not Found',
          mode === 'mobile'
            ? `No registered account found for mobile +91${mobile}. Would you like to create a new account?`
            : `No registered account found for ${normalizedEmail}. Would you like to create a new account?`,
          [
            {
              text: 'Register Now',
              onPress: () => {
                router.push({
                  pathname: '/(auth)/register',
                  params: { target: targetValue, mode },
                });
              },
            },
            {
              text: 'Cancel',
              style: 'cancel',
            },
          ]
        );
      } else {
        Alert.alert('Login failed', msg);
      }
    },
  });

  const handleLogin = () => {
    if (mode === 'mobile') {
      const sanitizedMobile = normalizeMobileDigits(mobile);
      if (!sanitizedMobile || sanitizedMobile.length !== 10) {
        Alert.alert('Invalid mobile number', 'Enter a valid 10 digit mobile number.');
        return;
      }
      if (!password.trim()) {
        Alert.alert('MPIN required', 'Enter your 4-digit MPIN to continue.');
        return;
      }
    } else {
      if (!normalizedEmail || !password.trim()) {
        Alert.alert('Email login', 'Enter both email and password to continue.');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        Alert.alert('Invalid email address', 'Enter a valid email address to continue.');
        return;
      }
    }
    loginMutation.mutate();
  };



  return (
    <AppScreen
      contentStyle={styles.loginScreen}
      fullBleed
      backgroundColor={colors.dark}
      safeAreaEdges={['left', 'right']}
      scrollViewProps={{ keyboardShouldPersistTaps: 'handled' }}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.dark} />

      <View style={[styles.loginShell, !isTablet && styles.loginShellMobile]}>
        <LinearGradient colors={gradients.dark} style={[styles.loginHero, { paddingTop: Math.max(insets.top + 16, 34) }]}>
          <View style={styles.loginGlowOrbPrimary} />
          <View style={styles.loginGlowOrbSecondary} />

          <View style={styles.loginHeroHeader}>
            <View style={styles.loginBrandBadge}>
              <BrandLogo size={60} />
            </View>
            <View style={styles.loginHeroCopy}>
              <Text style={styles.loginEyebrow}>SECURE SIGN IN</Text>
              <Text style={styles.loginHeroTitle}>Welcome Back</Text>
              <Text style={styles.loginHeroSubtitle}>Access your investments, earnings, wallet activity, and referrals with one secure login.</Text>
            </View>
          </View>

          <View style={styles.loginPillRow}>
            <View style={styles.loginPill}>
              <Ionicons name="shield-checkmark-outline" size={14} color={colors.surface} />
              <Text style={styles.loginPillText}>Protected Sessions</Text>
            </View>
            <View style={styles.loginPill}>
              <Ionicons name="scan-outline" size={14} color={colors.surface} />
              <Text style={styles.loginPillText}>Biometric Ready</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={[styles.loginPanel, !isTablet && styles.loginPanelMobile, { paddingBottom: Math.max(insets.bottom + 18, 28) }]}>
          <View style={styles.loginModeWrap}>
            {(['mobile', 'email'] as const).map((item) => {
              const active = item === mode;
              const iconName = item === 'mobile' ? 'phone-portrait-outline' : 'mail-open-outline';
              const modeLabel = item === 'mobile' ? 'Mobile Login' : 'Email Login';

              return (
                <Pressable
                  key={item}
                  onPress={() => {
                    if (item !== mode) {
                      setMode(item);
                      setPassword('');
                    }
                  }}
                  style={({ pressed }) => [
                    styles.loginModeItem,
                    active && styles.loginModeItemActive,
                    pressed && styles.loginModeItemPressed,
                  ]}
                >
                  <Ionicons name={iconName} size={16} color={active ? colors.primary : colors.muted} />
                  <Text style={[styles.loginModeText, active && styles.loginModeTextActive]}>
                    {modeLabel}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.loginModeHeader}>
            <View style={styles.loginModeHeaderIcon}>
              <Ionicons name={mode === 'mobile' ? 'phone-portrait-outline' : 'mail-outline'} size={18} color={colors.primary} />
            </View>
            <View style={styles.loginModeHeaderCopy}>
              <Text style={styles.loginModeHeaderTitle}>{mode === 'mobile' ? 'Mobile Login' : 'Email Login'}</Text>
              <Text style={styles.loginModeHeaderSubtitle}>Use your registered {mode === 'mobile' ? 'mobile number and MPIN' : 'email and password'} to continue securely.</Text>
            </View>
          </View>

          <View style={[styles.loginFormBlock, isCompact && styles.loginFormBlockCompact]}>
            <View style={styles.loginFormFields}>
              {mode === 'mobile' ? (
                <>
                  <InputField
                    label="Mobile Number"
                    value={mobile}
                    onChangeText={handleMobileChange}
                    keyboardType="phone-pad"
                    maxLength={10}
                    textContentType="telephoneNumber"
                    autoComplete="tel"
                    returnKeyType="next"
                    prefixText="+91"
                    placeholder="98765 43210"
                    icon={<Ionicons name="call-outline" size={18} color={colors.primary} />}
                    containerStyle={styles.loginInputGroup}
                    labelStyle={styles.loginInputLabel}
                    shellStyle={styles.loginInputShell}
                    inputStyle={styles.loginInputText}
                  />
                  <InputField
                    label="MPIN"
                    value={password}
                    onChangeText={setPassword}
                    secure
                    keyboardType="numeric"
                    maxLength={4}
                    textContentType="password"
                    autoComplete="password"
                    returnKeyType="done"
                    placeholder="Enter your 4-digit MPIN"
                    icon={<Ionicons name="keypad-outline" size={18} color={colors.primary} />}
                    containerStyle={styles.loginInputGroup}
                    labelStyle={styles.loginInputLabel}
                    shellStyle={styles.loginInputShell}
                    inputStyle={styles.loginInputText}
                  />
                </>
              ) : (
                <>
                  <InputField
                    label="Email Address"
                    value={email}
                    onChangeText={handleEmailChange}
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    autoComplete="email"
                    returnKeyType="next"
                    placeholder="Enter your email address"
                    icon={<Ionicons name="mail-outline" size={18} color={colors.primary} />}
                    containerStyle={styles.loginInputGroup}
                    labelStyle={styles.loginInputLabel}
                    shellStyle={styles.loginInputShell}
                    inputStyle={styles.loginInputText}
                  />
                  <InputField
                    label="Password"
                    value={password}
                    onChangeText={setPassword}
                    secure
                    textContentType="password"
                    autoComplete="password"
                    returnKeyType="done"
                    placeholder="Enter your password"
                    icon={<Ionicons name="lock-closed-outline" size={18} color={colors.primary} />}
                    containerStyle={styles.loginInputGroup}
                    labelStyle={styles.loginInputLabel}
                    shellStyle={styles.loginInputShell}
                    inputStyle={styles.loginInputText}
                  />
                </>
              )}
            </View>

            <View style={styles.loginFormActions}>
              <Text style={styles.loginHelperText}>
                Use the {mode === 'mobile' ? 'mobile number and MPIN' : 'email address and password'} linked to your account.
              </Text>

              <GradientButton
                label={loginMutation.isPending ? 'Logging In...' : 'Login to Dashboard'}
                onPress={handleLogin}
                iconPosition="end"
              />
            </View>
          </View>

          <View style={[styles.loginUtilityRow, isCompact && styles.loginUtilityColumn]}>
            <Pressable onPress={() => router.push('/(auth)/forgot-password')} style={({ pressed }) => [styles.loginUtilityCard, pressed && styles.loginUtilityCardPressed]}>
              <View style={styles.loginUtilityIcon}>
                <Ionicons name="key-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.loginUtilityCopy}>
                <Text style={styles.loginUtilityTitle}>Forgot Password</Text>
                <Text style={styles.loginUtilitySubtitle}>Reset with mobile OTP</Text>
              </View>
            </Pressable>

            <Pressable onPress={() => router.push('/(auth)/biometric')} style={({ pressed }) => [styles.loginUtilityCard, pressed && styles.loginUtilityCardPressed]}>
              <View style={styles.loginUtilityIcon}>
                <Ionicons name="scan-outline" size={18} color={colors.primary} />
              </View>
              <View style={styles.loginUtilityCopy}>
                <Text style={styles.loginUtilityTitle}>Biometric Login</Text>
                <Text style={styles.loginUtilitySubtitle}>Use Face ID or fingerprint</Text>
              </View>
            </Pressable>
          </View>

          <View style={styles.loginSecurityCard}>
            <View style={styles.loginSecurityIcon}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.loginSecurityCopy}>
              <Text style={styles.loginSecurityTitle}>Built for secure access</Text>
              <Text style={styles.loginSecurityText}>OTP verification, JWT sessions, MPIN protection, and device-level security are active for this app.</Text>
            </View>
          </View>

          <View style={styles.loginFooterRow}>
            <Text style={styles.loginFooterText}>New to Anusha Trade?</Text>
            <Pressable onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.loginFooterLink}>Create account</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </AppScreen>
  );
};

export const RegisterScreen = () => {
  const router = useRouter();
  const { isTablet } = useResponsive();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const incomingMobile = useMemo(() => {
    const raw = params.mobile ? getParam(params.mobile) : '';
    // Strip +91 country code if it is already there
    if (raw.startsWith('+91')) {
      return raw.slice(3).trim();
    }
    return raw;
  }, [params.mobile]);

  const [countryCode, setCountryCode] = useState('+91');
  const [mobile, setMobile] = useState(incomingMobile);
  const [savedDraft, setSavedDraft] = useState<SignupDraft | null>(null);

  const handleRegisterMobileChange = (value: string) => {
    setMobile(normalizeMobileDigits(value));
  };

  useEffect(() => {
    let active = true;

    void signupFlowService.getDraft().then((draft) => {
      if (!active) {
        return;
      }

      if (incomingMobile) {
        setMobile(incomingMobile);
        return;
      }

      if (!draft) {
        return;
      }

      setSavedDraft(draft);
      setCountryCode(draft.countryCode || '+91');
      if (draft.mobile.startsWith(draft.countryCode)) {
        setMobile(normalizeMobileDigits(draft.mobile.slice(draft.countryCode.length).trim()));
      }
    });

    return () => {
      active = false;
    };
  }, [incomingMobile]);

  const requestRegisterOtp = useMutation({
    mutationFn: () => authService.requestOtp(`${normalizeCountryCode(countryCode)}${mobile.trim()}`, 'register', 'mobile'),
    onSuccess: async (data) => {
      if (data.userExists) {
        Alert.alert(
          'Already Registered',
          'This mobile number is already registered. Please log in.',
          [
            {
              text: 'Go to Login',
              onPress: () => {
                router.replace({
                  pathname: '/(auth)/login',
                  params: {
                    target: data.target,
                    mode: 'mobile',
                  },
                });
              },
            },
          ]
        );
        return;
      }

      console.log('OTP request successful. Saving draft and pushing to OTP screen...', data);
      await signupFlowService.saveDraft(
        createSignupDraft({
          countryCode: normalizeCountryCode(countryCode),
          mobile: data.target,
          otpVerified: false,
          otpVerifiedAt: '',
          signupVerificationToken: '',
          verificationProvider: data.provider ?? '',
          currentStep: 0,
        })
      );

      console.log('Draft saved. Routing to OTP screen.');
      router.push({
        pathname: '/signup/otp',
        params: {
          target: data.target,
          purpose: 'register',
          mode: 'mobile',
          provider: data.provider ?? '',
          previewCode: data.previewCode ?? '',
        },
      });
    },
    onError: (error) => {
      console.error('OTP request error:', error);
      const errorMsg = getAuthErrorMessage(error);

      // If the mobile number already exists, automatically redirect the user to the login screen
      const lowerError = errorMsg.toLowerCase();
      if (lowerError.includes('already exists') || lowerError.includes('exists') || lowerError.includes('already registered') || lowerError.includes('registered')) {
        Alert.alert(
          'Already Registered',
          'This mobile number is already registered. Redirecting to login...',
          [
            {
              text: 'OK',
              onPress: () => {
                router.replace({
                  pathname: '/(auth)/login',
                  params: {
                    target: `${normalizeCountryCode(countryCode)}${mobile.trim()}`,
                    mode: 'mobile',
                  },
                });
              },
            },
          ]
        );
        return;
      }

      Alert.alert('OTP request failed', errorMsg);
    },
  });

  const continueRegister = () => {
    const sanitizedMobile = mobile.replace(/\D/g, '');

    if (!mobile.trim()) {
      Alert.alert('Mobile number required', 'Enter your mobile number to begin registration.');
      return;
    }

    if (!/^\+?\d{1,4}$/.test(normalizeCountryCode(countryCode))) {
      Alert.alert('Country code required', 'Enter a valid country code such as +91.');
      return;
    }

    if (sanitizedMobile.length !== 10) {
      Alert.alert('Invalid mobile number', 'Enter a valid 10 digit mobile number for India.');
      return;
    }

    requestRegisterOtp.mutate();
  };

  return (
    <AppScreen contentStyle={styles.registrationFlowScreen} fullBleed backgroundColor={colors.dark} safeAreaEdges={['left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.dark} />
      <RegistrationStepCard
        stepLabel={`STEP 1 OF ${TOTAL_REGISTRATION_STEPS}`}
        title="Verify Mobile"
        subtitle="Enter your phone number to begin the registration process."
        icon="phone-portrait-outline"
        progressWidth={getRegistrationProgressWidth(1)}
        onBackPress={() => (router.canGoBack() ? router.back() : router.replace('/onboarding'))}
        shellStyle={!isTablet ? styles.registrationShellMobile : undefined}
        bodyStyle={!isTablet ? styles.registrationBodyMobile : undefined}
        heroStyle={{ paddingTop: Math.max(insets.top + 12, 26) }}
      >
        <InputField
          labelStyle={styles.registrationInputLabel}
          label="Mobile Number"
          value={mobile}
          onChangeText={handleRegisterMobileChange}
          keyboardType="phone-pad"
          maxLength={10}
          prefixText="+91"
          placeholder="98765 43210"
          required
          icon={<Ionicons name="call-outline" size={18} color={colors.primary} />}
        />
        <Text style={styles.registrationHint}>Enter your 10 digit mobile number. The app adds `+91` automatically for signup OTP verification.</Text>
        <GradientButton
          label={requestRegisterOtp.isPending ? 'Sending OTP...' : 'Send OTP'}
          onPress={continueRegister}
          iconPosition="end"
        />

        {savedDraft?.otpVerified ? (
          <>
            <View style={styles.registrationResumeCard}>
              <Text style={styles.registrationResumeTitle}>Saved signup found</Text>
              <Text style={styles.registrationResumeText}>A verified registration draft is already saved on this device. You can continue from the next step.</Text>
            </View>
            <GradientButton
              label="Resume Signup"
              variant="secondary"
              onPress={() => router.push(getSignupRouteForStep(savedDraft.currentStep))}
            />
          </>
        ) : null}

        <Pressable onPress={() => router.replace('/(auth)/login')}>
          <Text style={styles.registrationTextLink}>Already registered? Login</Text>
        </Pressable>
      </RegistrationStepCard>
    </AppScreen>
  );
};
export const OtpScreen = () => {
  const router = useRouter();
  const { isTablet } = useResponsive();
  const insets = useSafeAreaInsets();
  const signIn = useAuthStore((state) => state.signIn);
  const { target: rawTarget, purpose: rawPurpose, mode: rawMode, provider: rawProvider, previewCode: rawPreview } = useLocalSearchParams();
  const stableParams = useMemo(() => ({
    target: getParam(rawTarget),
    purpose: (getParam(rawPurpose, 'login') as OtpPurpose) ?? 'login',
    mode: getParam(rawMode, 'mobile'),
    provider: getParam(rawProvider, ''),
    previewCode: getParam(rawPreview, ''),
  }), [rawTarget, rawPurpose, rawMode, rawProvider, rawPreview]);
  const target = stableParams.target;
  const purpose = stableParams.purpose;
  const mode = stableParams.mode;
  const [otpProvider, setOtpProvider] = useState(stableParams.provider);
  const [previewOtpCode, setPreviewOtpCode] = useState(stableParams.previewCode);
  const otpInputRef = useRef<TextInput | null>(null);
  // Only auto-fill preview code when backend (MOBILE_OTP) is the provider.
  // When Firebase is the provider, it sends a DIFFERENT code via SMS,
  // so auto-filling the backend preview code causes "invalid OTP" errors.
  const initialIsFirebase = mode === 'mobile' && stableParams.provider === 'FIREBASE_PHONE_AUTH';
  const [otp, setOtp] = useState(initialIsFirebase ? '' : (stableParams.previewCode || ''));
  const [seconds, setSeconds] = useState(60);
  const [isOtpFocused, setIsOtpFocused] = useState(false);
  const [successState, setSuccessState] = useState<OtpSuccessState | null>(null);
  const isFirebasePhoneOtp = mode === 'mobile' && otpProvider === 'FIREBASE_PHONE_AUTH';

  useEffect(() => {
    if (seconds <= 0) return;
    const timer = setInterval(() => {
      setSeconds((value) => (value <= 1 ? 0 : value - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [seconds]);

  useEffect(() => {
    const focusTimer = setTimeout(() => {
      otpInputRef.current?.focus();
    }, 250);

    return () => clearTimeout(focusTimer);
  }, []);

  const focusOtpInput = () => {
    otpInputRef.current?.focus();
  };

  const verifyOtp = useMutation({
    mutationFn: () => authService.verifyOtp(target, purpose, otp, { provider: otpProvider }),
    onSuccess: async (result) => {
      if (result.outcome === 'session') {
        // If the user is in the register flow, we MUST direct them to complete the 
        // 10 signup steps. We cannot rely on userExists or accountStatus from this 
        // temporary session response, as the live backend may return true or default to ACTIVE.
        if (purpose === 'register') {
          await signupFlowService.mergeDraft({
            mobile: result.session.user.mobile || target,
            otpVerified: true,
            otpVerifiedAt: new Date().toISOString(),
            signupVerificationToken: result.session.tokens.accessToken, // use token for next steps
            verificationProvider: otpProvider,
            currentStep: 0,
          });

          setSuccessState({
            title: 'Mobile Verified',
            subtitle: 'This number is verified. Continue to create your account.',
            ctaLabel: 'Continue Signup',
            onContinue: () => {
              setSuccessState(null);
              router.replace('/signup/profile');
            },
          });
          return;
        }

        await signIn(result.session);

        if (purpose === 'login' && authService.resolveOnboardingRoute(result.session.user) !== '/(tabs)') {
          // Onboarding incomplete — let RootNavigator handle the redirect
          return;
        }

        const title = 'OTP Verified';
        const subtitle = 'Your OTP was verified successfully.';

        setSuccessState({
          title,
          subtitle,
          ctaLabel: 'Continue',
          onContinue: () => {
            setSuccessState(null);
            router.replace({
              pathname: '/success',
              params: {
                title: 'Login Verified',
                subtitle: 'Your secure OTP verification is complete. Continue to the main dashboard.',
                cta: 'Continue to Dashboard',
              },
            });
          },
        });
        return;
      }

      const verifiedMobile = result.mobileNumber
        ? result.mobileNumber.startsWith('+')
          ? result.mobileNumber
          : `${normalizeCountryCode('+91')}${result.mobileNumber}`
        : target;

      if (purpose === 'register') {
        await signupFlowService.mergeDraft({
          mobile: verifiedMobile,
          otpVerified: true,
          otpVerifiedAt: new Date().toISOString(),
          signupVerificationToken: result.signupVerificationToken ?? '',
          verificationProvider: otpProvider,
          currentStep: 0,
        });
        setSuccessState({
          title: 'Mobile Number Verified',
          subtitle: 'Your OTP was verified successfully. Continue to complete your account setup.',
          ctaLabel: 'Continue Signup',
          onContinue: () => {
            setSuccessState(null);
            router.replace('/signup/profile');
          },
        });
        return;
      }

      await signupFlowService.saveDraft(
        createSignupDraft({
          countryCode: '+91',
          mobile: verifiedMobile,
          otpVerified: true,
          otpVerifiedAt: new Date().toISOString(),
          signupVerificationToken: result.signupVerificationToken ?? '',
          verificationProvider: otpProvider,
          currentStep: 0,
        })
      );
      Alert.alert(
        'Account Not Found',
        'This number is not registered yet. Please create an account to continue.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Register', 
            onPress: () => router.replace('/(auth)/register')
          }
        ]
      );
    },
    onError: (error) => {
      lastSubmittedOtp.current = '';
      Alert.alert('OTP verification failed', getAuthErrorMessage(error));
    },
  });

  const lastSubmittedOtp = useRef('');

  useEffect(() => {
    if (otp.length === 6 && !verifyOtp.isPending && !verifyOtp.isSuccess && otp !== lastSubmittedOtp.current) {
      lastSubmittedOtp.current = otp;
      verifyOtp.mutate();
    }
  }, [otp, verifyOtp.isPending, verifyOtp.isSuccess]);

  const resendOtp = useMutation({
    mutationFn: () => authService.requestOtp(target, purpose, mode === 'mobile' ? 'mobile' : 'email', true),
    onSuccess: (data) => {
      setSeconds(60);
      const updatedProvider = data.provider || otpProvider;
      setOtpProvider(updatedProvider);
      setPreviewOtpCode(data.previewCode ?? '');
      lastSubmittedOtp.current = '';
      // Only auto-fill when backend (MOBILE_OTP) is the provider.
      // Firebase sends its own SMS code — auto-filling backend preview code would mismatch.
      const isResendFirebase = mode === 'mobile' && updatedProvider === 'FIREBASE_PHONE_AUTH';
      if (data.previewCode && !isResendFirebase) {
        setOtp(data.previewCode);
      } else {
        setOtp('');
      }
      Alert.alert(
        'OTP sent',
        data.previewCode
          ? `Use preview OTP ${data.previewCode} to continue.`
          : data.message || 'A fresh OTP has been sent. Please check your device and continue.'
      );
      focusOtpInput();
    },
    onError: (error) => {
      Alert.alert('Resend failed', getAuthErrorMessage(error));
    },
  });

  const handleVerifyOtp = () => {
    if (verifyOtp.isPending) return;
    if (otp.trim().length !== 6) {
      Alert.alert('OTP required', 'Enter the 6 digit OTP to continue.');
      return;
    }
    lastSubmittedOtp.current = otp;
    verifyOtp.mutate();
  };

  return (
    <AppScreen
      contentStyle={styles.registrationFlowScreen}
      fullBleed
      backgroundColor={colors.dark}
      safeAreaEdges={['left', 'right']}
      scrollViewProps={{ keyboardShouldPersistTaps: 'always' }}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.dark} />
      <Modal visible={Boolean(successState)} transparent animationType="fade" onRequestClose={() => setSuccessState(null)}>
        <View style={styles.successModalOverlay}>
          <View style={styles.successModalBackdrop} />
          <SurfaceCard style={styles.successModalCard}>
            <LinearGradient colors={gradients.success} style={styles.successModalBadge}>
              <Ionicons name="checkmark" size={28} color={colors.surface} />
            </LinearGradient>
            <Text style={styles.successModalTitle}>{successState?.title}</Text>
            <Text style={styles.successModalSubtitle}>{successState?.subtitle}</Text>
            <GradientButton label={successState?.ctaLabel || 'Continue'} onPress={() => successState?.onContinue()} />
          </SurfaceCard>
        </View>
      </Modal>

      <RegistrationStepCard
        stepLabel={purpose === 'register' ? `STEP 2 OF ${TOTAL_REGISTRATION_STEPS}` : purpose === 'reset' ? 'STEP 2 OF 3' : 'SECURE OTP'}
        title={purpose === 'register' ? 'Verify OTP' : purpose === 'reset' ? 'Reset Password OTP' : mode === 'mobile' ? 'Login OTP' : 'Email OTP'}
        subtitle={`Enter the 6 digit code sent to ${maskContact(target)}.`}
        icon="shield-checkmark-outline"
        progressWidth={purpose === 'register' ? getRegistrationProgressWidth(2) : purpose === 'reset' ? '66.67%' : getRegistrationProgressWidth(1)}
        onBackPress={() => (router.canGoBack() ? router.back() : router.replace('/signup/mobile'))}
        shellStyle={!isTablet ? styles.registrationShellMobile : undefined}
        bodyStyle={!isTablet ? styles.registrationBodyMobile : undefined}
        heroStyle={{ paddingTop: Math.max(insets.top + 12, 26) }}
      >
        {previewOtpCode ? (
          <View style={styles.previewOtpBanner}>
            <Text style={styles.previewOtpLabel}>Preview OTP</Text>
            <Text style={styles.previewOtpValue}>{previewOtpCode}</Text>
            <Text style={styles.previewOtpHint}>
              {isTestingOtpMode ? 'Testing mode is enabled for this build.' : 'This code is available only in development environments.'}
            </Text>
          </View>
        ) : null}



        <View style={styles.otpInputWrap}>
          <Pressable onPress={focusOtpInput} style={styles.otpInputPressable}>
            <OtpBoxes code={otp} isFocused={isOtpFocused} />
          </Pressable>
          <TextInput
            ref={otpInputRef}
            value={otp}
            onChangeText={(value) => setOtp(value.replace(/[^0-9]/g, '').slice(0, 6))}
            onFocus={() => setIsOtpFocused(true)}
            onBlur={() => setIsOtpFocused(false)}
            keyboardType={Platform.OS === 'android' ? 'numeric' : 'number-pad'}
            maxLength={6}
            autoFocus
            blurOnSubmit={false}
            caretHidden
            contextMenuHidden
            showSoftInputOnFocus
            textContentType="oneTimeCode"
            returnKeyType="done"
            selectionColor="transparent"
            style={styles.otpOverlayInput}
          />
        </View>

        <View style={styles.otpMetaRow}>
          <Text style={[styles.timerText, seconds === 0 && { color: colors.muted }]}>
            {seconds > 0 ? `00:${seconds.toString().padStart(2, '0')}` : 'Expired'}
          </Text>
          <Pressable 
            onPress={() => resendOtp.mutate()} 
            disabled={seconds > 0 || resendOtp.isPending}
            style={({ pressed }) => [
              { opacity: (seconds > 0 || resendOtp.isPending) ? 0.4 : pressed ? 0.7 : 1 }
            ]}
          >
            <Text style={[
              styles.registrationTextLink,
              (seconds > 0 || resendOtp.isPending) && { color: colors.muted }
            ]}>
              {resendOtp.isPending ? 'Sending...' : 'Resend OTP'}
            </Text>
          </Pressable>
        </View>



        <GradientButton
          label={verifyOtp.isPending ? 'Verifying OTP...' : 'Verify OTP'}
          onPress={handleVerifyOtp}
          iconPosition="end"
        />
      </RegistrationStepCard>
    </AppScreen>
  );
};

export const ForgotPasswordScreen = () => {
  const router = useRouter();
  const { isTablet } = useResponsive();
  const insets = useSafeAreaInsets();
  const [identifier, setIdentifier] = useState('');
  const requestResetOtp = useMutation({
    mutationFn: () => authService.requestPasswordReset(identifier),
    onSuccess: async (data) => {
      if (data.resetToken) {
        router.push({
          pathname: '/(auth)/reset-password',
          params: {
            target: identifier.trim(),
            token: data.resetToken,
          },
        });
        return;
      }

      router.replace({
        pathname: '/success',
        params: {
          title: 'Reset Link Sent',
          subtitle: data.message || 'Password reset instructions have been sent. Follow them to continue.',
          cta: 'Back to Login',
          redirect: '/(auth)/login',
        },
      });
    },
    onError: (error) => {
      Alert.alert('Reset request failed', getAuthErrorMessage(error));
    },
  });

  return (
    <AppScreen contentStyle={styles.registrationFlowScreen} fullBleed backgroundColor={colors.dark} safeAreaEdges={['left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.dark} />
      <RegistrationStepCard
        stepLabel="PASSWORD RECOVERY"
        title="Forgot Password"
        subtitle="Enter your registered email or mobile number to receive reset instructions."
        icon="lock-open-outline"
        progressWidth="33.33%"
        onBackPress={() => (router.canGoBack() ? router.back() : router.replace('/(auth)/login'))}
        shellStyle={!isTablet ? styles.registrationShellMobile : undefined}
        bodyStyle={!isTablet ? styles.registrationBodyMobile : undefined}
        heroStyle={{ paddingTop: Math.max(insets.top + 12, 26) }}
      >
        <InputField
          labelStyle={styles.registrationInputLabel}
          label="Email or Mobile Number"
          value={identifier}
          onChangeText={setIdentifier}
          keyboardType="email-address"
          icon={<Ionicons name="mail-open-outline" size={18} color={colors.primary} />}
        />
        <Text style={styles.registrationHint}>Use your registered email address or mobile number. If the backend is in development mode, a reset token may be returned directly.</Text>
        <GradientButton
          label={requestResetOtp.isPending ? 'Sending...' : 'Send Reset Link'}
          onPress={() => {
            if (!identifier.trim()) {
              Alert.alert('Details required', 'Enter your registered email address or mobile number.');
              return;
            }

            requestResetOtp.mutate();
          }}
          iconPosition="end"
        />
      </RegistrationStepCard>
    </AppScreen>
  );
};

export const ResetPasswordScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ target?: string; token?: string }>();
  const { isTablet } = useResponsive();
  const insets = useSafeAreaInsets();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const resetPassword = useMutation({
    mutationFn: () => authService.resetPassword(getParam(params.token), password),
    onSuccess: () => {
      router.replace({
        pathname: '/success',
        params: {
          title: 'Password Updated',
          subtitle: 'Your password has been updated successfully. Continue to login securely.',
          cta: 'Back to Login',
          redirect: '/(auth)/login',
        },
      });
    },
    onError: (error) => {
      Alert.alert('Password update failed', getAuthErrorMessage(error));
    },
  });

  return (
    <AppScreen contentStyle={styles.registrationFlowScreen} fullBleed backgroundColor={colors.dark} safeAreaEdges={['left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.dark} />
      <RegistrationStepCard
        stepLabel="STEP 3 OF 3"
        title="Create New Password"
        subtitle={`Create a new password for ${maskContact(getParam(params.target)) || 'your account'}.`}
        icon="key-outline"
        progressWidth="100%"
        onBackPress={() => (router.canGoBack() ? router.back() : router.replace('/(auth)/login'))}
        shellStyle={!isTablet ? styles.registrationShellMobile : undefined}
        bodyStyle={!isTablet ? styles.registrationBodyMobile : undefined}
        heroStyle={{ paddingTop: Math.max(insets.top + 12, 26) }}
      >
        <InputField
          labelStyle={styles.registrationInputLabel}
          label="New Password"
          value={password}
          onChangeText={setPassword}
          secure
          icon={<Ionicons name="lock-closed-outline" size={18} color={colors.primary} />}
        />
        <InputField
          labelStyle={styles.registrationInputLabel}
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secure
          icon={<Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />}
        />
        <View style={styles.strengthTrack}>
          <LinearGradient colors={['#60A5FA', '#2563EB', '#22C55E']} style={styles.strengthFill} />
        </View>
        <Text style={styles.supportingText}>Strong password: use 8+ characters, numbers, and symbols.</Text>
        <GradientButton
          label={resetPassword.isPending ? 'Updating...' : 'Update Password'}
          onPress={() => {
            if (!getParam(params.token)) {
              Alert.alert('Reset token required', 'Open this screen from the password reset link or request a new reset token.');
              return;
            }

            if (password !== confirmPassword) {
              Alert.alert('Password mismatch', 'Please make sure both password fields match.');
              return;
            }

            resetPassword.mutate();
          }}
          iconPosition="end"
        />
      </RegistrationStepCard>
    </AppScreen>
  );
};

export const ForgotMpinScreen = () => {
  const router = useRouter();
  const { isTablet } = useResponsive();
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<'mobile' | 'otp' | 'mpin'>('mobile');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newMpin, setNewMpin] = useState('');
  const [confirmMpin, setConfirmMpin] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!mobile.trim() || mobile.trim().length !== 10) {
      Alert.alert('Invalid Mobile', 'Please enter your registered 10-digit mobile number.');
      return;
    }
    setIsLoading(true);
    try {
      await authService.forgotMpin(mobile.trim());
      setStep('otp');
      Alert.alert('OTP Sent', `A 6-digit verification code has been sent to +91${mobile.trim()}`);
    } catch (err: any) {
      Alert.alert('Error', getAuthErrorMessage(err) || 'Failed to send OTP for MPIN reset.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim() || otp.trim().length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit OTP code.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await authService.verifyResetMpinOtp(mobile.trim(), otp.trim());
      setResetToken(res.resetToken);
      setStep('mpin');
    } catch (err: any) {
      Alert.alert('Verification Failed', getAuthErrorMessage(err) || 'Invalid or expired OTP code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetMpin = async () => {
    if (!newMpin || newMpin.length !== 4) {
      Alert.alert('Invalid MPIN', 'Please enter a 4-digit MPIN.');
      return;
    }
    if (newMpin !== confirmMpin) {
      Alert.alert('MPIN Mismatch', 'New MPIN and confirm MPIN must match.');
      return;
    }
    setIsLoading(true);
    try {
      await authService.resetMpin(mobile.trim(), resetToken, newMpin);
      Alert.alert('MPIN Reset Successful', 'Your MPIN has been updated. You can now login with your new MPIN.', [
        {
          text: 'Login Now',
          onPress: () => router.replace('/(auth)/login'),
        },
      ]);
    } catch (err: any) {
      Alert.alert('Reset Failed', getAuthErrorMessage(err) || 'Could not reset MPIN.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppScreen contentStyle={styles.registrationFlowScreen} fullBleed backgroundColor={colors.dark} safeAreaEdges={['left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.dark} />
      <RegistrationStepCard
        stepLabel={step === 'mobile' ? 'STEP 1 OF 3' : step === 'otp' ? 'STEP 2 OF 3' : 'STEP 3 OF 3'}
        title={step === 'mobile' ? 'Forgot MPIN' : step === 'otp' ? 'Verify Mobile OTP' : 'Set New MPIN'}
        subtitle={
          step === 'mobile'
            ? 'Enter your registered mobile number to verify your identity.'
            : step === 'otp'
            ? `Enter the 6-digit OTP code sent to +91${mobile}.`
            : 'Create and confirm your new 4-digit security MPIN.'
        }
        icon={step === 'mobile' ? 'keypad-outline' : step === 'otp' ? 'shield-checkmark-outline' : 'lock-closed-outline'}
        progressWidth={step === 'mobile' ? '33.3%' : step === 'otp' ? '66.6%' : '100%'}
        onBackPress={() => {
          if (step === 'otp') setStep('mobile');
          else if (step === 'mpin') setStep('otp');
          else router.canGoBack() ? router.back() : router.replace('/(auth)/login');
        }}
        shellStyle={!isTablet ? styles.registrationShellMobile : undefined}
        bodyStyle={!isTablet ? styles.registrationBodyMobile : undefined}
        heroStyle={{ paddingTop: Math.max(insets.top + 12, 26) }}
      >
        {step === 'mobile' && (
          <>
            <InputField
              labelStyle={styles.registrationInputLabel}
              label="Registered Mobile Number"
              value={mobile}
              onChangeText={(val) => setMobile(val.replace(/\D/g, '').slice(0, 10))}
              keyboardType="phone-pad"
              maxLength={10}
              icon={<Ionicons name="call-outline" size={18} color={colors.primary} />}
              placeholder="10-digit mobile number"
            />
            <Text style={styles.registrationHint}>For security reasons, an OTP will be sent to your mobile number before you can create a new MPIN.</Text>
            <GradientButton
              label={isLoading ? 'Sending OTP...' : 'Send Verification OTP'}
              onPress={() => void handleSendOtp()}
              disabled={isLoading || mobile.length !== 10}
              iconPosition="end"
            />
          </>
        )}

        {step === 'otp' && (
          <>
            <InputField
              labelStyle={styles.registrationInputLabel}
              label="6-Digit OTP Code"
              value={otp}
              onChangeText={(val) => setOtp(val.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              icon={<Ionicons name="key-outline" size={18} color={colors.primary} />}
              placeholder="Enter 6-digit code"
            />
            <Text style={styles.registrationHint}>OTP valid for 10 minutes. Check your messages.</Text>
            <GradientButton
              label={isLoading ? 'Verifying...' : 'Verify & Continue'}
              onPress={() => void handleVerifyOtp()}
              disabled={isLoading || otp.length !== 6}
              iconPosition="end"
            />
          </>
        )}

        {step === 'mpin' && (
          <>
            <View style={{ alignItems: 'center', marginBottom: 12 }}>
              <Text style={styles.registrationInputLabel}>New 4-Digit MPIN</Text>
              <PinBoxesInput value={newMpin} onChangeText={(val) => setNewMpin(val.replace(/\D/g, '').slice(0, 4))} length={4} secureTextEntry autoFocus />
            </View>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <Text style={styles.registrationInputLabel}>Confirm New MPIN</Text>
              <PinBoxesInput value={confirmMpin} onChangeText={(val) => setConfirmMpin(val.replace(/\D/g, '').slice(0, 4))} length={4} secureTextEntry />
            </View>
            <Text style={styles.supportingText}>Avoid simple patterns like 1234 or 1111.</Text>
            <GradientButton
              label={isLoading ? 'Saving...' : 'Reset MPIN'}
              onPress={() => void handleResetMpin()}
              disabled={isLoading || newMpin.length !== 4 || confirmMpin.length !== 4}
              iconPosition="end"
            />
          </>
        )}
      </RegistrationStepCard>
    </AppScreen>
  );
};

export const BiometricScreen = () => {
  const router = useRouter();
  const hasBiometricSession = useAuthStore((state) => state.hasBiometricSession);
  const signInWithBiometrics = useAuthStore((state) => state.signInWithBiometrics);
  const [isBiometricPending, setIsBiometricPending] = useState(false);
  const [isDeviceReady, setIsDeviceReady] = useState(false);
  const [hasSavedBiometricLogin, setHasSavedBiometricLogin] = useState(false);
  const [biometricMessage, setBiometricMessage] = useState('Checking device security...');

  useEffect(() => {
    let active = true;

    const checkBiometricReadiness = async () => {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();

      if (!hasHardware) {
        if (!active) {
          return;
        }

        setIsDeviceReady(false);
        setHasSavedBiometricLogin(false);
        setBiometricMessage('This device does not support fingerprint or Face ID authentication.');
        return;
      }

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!isEnrolled) {
        if (!active) {
          return;
        }

        setIsDeviceReady(false);
        setHasSavedBiometricLogin(false);
        setBiometricMessage('Set up fingerprint or Face ID in device settings before using biometric login.');
        return;
      }

      const hasSavedSession = await hasBiometricSession();

      if (!active) {
        return;
      }

      setIsDeviceReady(true);
      setHasSavedBiometricLogin(hasSavedSession);
      setBiometricMessage(
        hasSavedSession
          ? 'Use Face ID or fingerprint to unlock your saved account securely.'
          : 'Enable biometric login from Security Center after signing in once.'
      );
    };

    void checkBiometricReadiness();

    return () => {
      active = false;
    };
  }, [hasBiometricSession]);

  const unlockWithBiometrics = async () => {
    setIsBiometricPending(true);

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

      const hasSavedSession = await hasBiometricSession();

      if (!hasSavedSession) {
        Alert.alert(
          'Biometric login not enabled',
          'Sign in once, then turn on Face ID or fingerprint login from Security Center.'
        );
        setHasSavedBiometricLogin(false);
        setBiometricMessage('Enable biometric login from Security Center after signing in once.');
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirm your identity',
        fallbackLabel: 'Use device passcode',
      });

      if (!result.success) {
        return;
      }

      const restored = await signInWithBiometrics();

      if (!restored) {
        Alert.alert(
          'Biometric login unavailable',
          'No saved biometric session was found. Please sign in again and re-enable biometric login.'
        );
        setHasSavedBiometricLogin(false);
        setBiometricMessage('Enable biometric login from Security Center after signing in once.');
        return;
      }

      router.replace('/(tabs)');
    } finally {
      setIsBiometricPending(false);
    }
  };

  return (
    <LinearGradient colors={gradients.dark} style={{ flex: 1 }}>
      <AppScreen contentStyle={styles.darkAuthScreen}>
        <ScreenHeader title="Biometric Login" subtitle="Use Face ID or fingerprint recognition for instant secure access." onBackPress={() => (router.canGoBack() ? router.back() : router.replace('/(auth)/login'))} />
        <FadeInView delay={120}>
          <SurfaceCard glass style={styles.glassHero}>
            <View style={styles.biometricGraphic}>
              <LinearGradient colors={['rgba(96,165,250,0.22)', 'rgba(255,255,255,0.08)']} style={styles.biometricBubble}>
                <MaterialCommunityIcons name="face-recognition" size={40} color={colors.surface} />
              </LinearGradient>
            </View>
            <Text style={styles.glassTitle}>
              {hasSavedBiometricLogin ? 'Biometric login ready' : 'Biometric authentication'}
            </Text>
            <Text style={styles.glassSubtitle}>{biometricMessage}</Text>
            <View style={styles.biometricStatusRow}>
              <View style={[styles.biometricStatusBadge, isDeviceReady ? styles.biometricStatusBadgeActive : styles.biometricStatusBadgeMuted]}>
                <Text style={styles.biometricStatusText}>{isDeviceReady ? 'Device Ready' : 'Device Setup Needed'}</Text>
              </View>
              <View
                style={[
                  styles.biometricStatusBadge,
                  hasSavedBiometricLogin ? styles.biometricStatusBadgeActive : styles.biometricStatusBadgeMuted,
                ]}
              >
                <Text style={styles.biometricStatusText}>
                  {hasSavedBiometricLogin ? 'Login Enabled' : 'Login Not Enabled'}
                </Text>
              </View>
            </View>
            <GradientButton
              label={
                isBiometricPending
                  ? 'Authenticating...'
                  : hasSavedBiometricLogin
                    ? 'Login with Biometrics'
                    : 'Check Biometrics'
              }
              onPress={() => void unlockWithBiometrics()}
            />
          </SurfaceCard>
        </FadeInView>
      </AppScreen>
    </LinearGradient>
  );
};

export const SessionsScreen = () => {
  const router = useRouter();
  const { data, isLoading } = useSessionsQuery();

  return (
    <AppScreen contentStyle={styles.authScreen}>
      <ScreenHeader title="Active Sessions" subtitle="Monitor recent login activity and protect your account." onBackPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'))} />
      {isLoading ? (
        <>
          <SkeletonBlock height={92} />
          <SkeletonBlock height={92} />
        </>
      ) : (
        <>
          {(data?.sessions ?? []).map((item: SessionItem) => (
            <SessionCard key={item.id} item={item} />
          ))}
        </>
      )}
      <ListRow
        icon="shield-checkmark-outline"
        title="Open Security Center"
        subtitle="Manage devices, 2FA, and login alerts."
        onPress={() => router.push('/security-center')}
      />
    </AppScreen>
  );
};

export const DevicesScreen = () => {
  const router = useRouter();
  const { data, isLoading } = useSessionsQuery();

  return (
    <AppScreen contentStyle={styles.authScreen}>
      <ScreenHeader title="Device Tracking" subtitle="Review trusted devices and secure logout actions." onBackPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'))} />
      {isLoading ? <SkeletonBlock height={92} /> : (data?.sessions ?? []).map((item: SessionItem) => <SessionCard key={item.id} item={item} showLocation={false} />)}
      <ListRow
        icon="phone-portrait-outline"
        title="Open Device Center"
        subtitle="See active devices and logout controls."
        onPress={() => router.push('/devices')}
      />
    </AppScreen>
  );
};

export const SuccessScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{
    title?: string;
    subtitle?: string;
    cta?: string;
    redirect?: string;
    investmentId?: string;
    receiptNumber?: string;
    receiptUrl?: string;
    emailStatus?: string;
    whatsappStatus?: string;
  }>();
  const title = getParam(params.title, 'Success');
  const subtitle = getParam(params.subtitle, 'The requested action completed successfully.');
  const cta = getParam(params.cta, 'Continue');
  const redirect = getParam(params.redirect, '/(tabs)');
  const investmentId = getParam(params.investmentId, '');
  const showReceipt = Boolean(investmentId || params.receiptNumber || params.whatsappStatus || params.emailStatus);

  const initialReceipt = useMemo(
    () => ({
      receiptNumber: getParam(params.receiptNumber, investmentId ? `ATR-${investmentId.slice(-6).toUpperCase()}` : 'ATR-2026-000001'),
      receiptUrl: getParam(params.receiptUrl, ''),
      emailStatus: (getParam(params.emailStatus, 'SENT') as any),
      whatsappStatus: (getParam(params.whatsappStatus, 'DELIVERED') as any),
      available: true,
    }),
    [params.receiptNumber, params.receiptUrl, params.emailStatus, params.whatsappStatus, investmentId]
  );

  const { receipt } = useReceiptPolling({
    investmentId,
    initialReceipt,
    enabled: showReceipt,
  });

  return (
    <AppScreen scrollable contentStyle={styles.successScreen}>
      <View style={styles.successBurst} />
      <LinearGradient colors={gradients.success} style={styles.successBadge}>
        <Ionicons name="checkmark" size={34} color={colors.surface} />
      </LinearGradient>
      <Text style={styles.successTitle}>{title}</Text>
      <Text style={styles.successSubtitle}>{subtitle}</Text>
      {showReceipt && (
        <View style={{ width: '100%', marginVertical: 12 }}>
          <ReceiptStatusCard receipt={receipt} investmentId={investmentId} />
        </View>
      )}
      <GradientButton label={cta} onPress={() => router.replace(redirect as never)} style={styles.successButton} />
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  authScreen: {
    gap: 20,
  },
  loginScreen: {
    flexGrow: 1,
    backgroundColor: colors.dark,
  },
  loginShell: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 540,
    minHeight: '100%',
    backgroundColor: colors.dark,
  },
  loginShellMobile: {
    alignSelf: 'stretch',
    maxWidth: '100%',
  },
  loginHero: {
    position: 'relative',
    overflow: 'hidden',
    paddingHorizontal: 22,
    paddingBottom: 108,
    gap: 24,
    backgroundColor: colors.dark,
  },
  loginGlowOrbPrimary: {
    position: 'absolute',
    top: 54,
    right: -48,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(96,165,250,0.14)',
  },
  loginGlowOrbSecondary: {
    position: 'absolute',
    top: 138,
    left: -70,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  loginHeroHeader: {
    alignItems: 'center',
    gap: 18,
    zIndex: 1,
  },
  loginBrandBadge: {
    width: 112,
    height: 112,
    borderRadius: 34,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  loginHeroCopy: {
    alignItems: 'center',
    gap: 8,
  },
  loginEyebrow: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 12,
    letterSpacing: 1.6,
    color: '#93C5FD',
    textTransform: 'uppercase',
  },
  loginHeroTitle: {
    fontFamily: fontFamily.heading,
    fontSize: 34,
    lineHeight: 40,
    color: colors.surface,
    textAlign: 'center',
  },
  loginHeroSubtitle: {
    maxWidth: 340,
    fontFamily: fontFamily.body,
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.78)',
    textAlign: 'center',
  },
  loginPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    zIndex: 1,
  },
  loginPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  loginPillText: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    color: colors.surface,
  },
  loginPanel: {
    marginTop: -32,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 28,
    gap: 18,
    minHeight: 440,
  },
  loginPanelMobile: {
    flexGrow: 1,
  },
  loginModeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 4,
    borderRadius: 22,
    backgroundColor: '#E2E8F0',
    gap: 6,
  },
  loginModeItem: {
    flex: 1,
    height: 44,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
  },
  loginModeItemActive: {
    backgroundColor: colors.surface,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  loginModeItemPressed: {
    opacity: 0.88,
  },
  loginModeText: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12.5,
    color: colors.muted,
  },
  loginModeTextActive: {
    fontFamily: fontFamily.bodyBold,
    color: colors.primary,
  },
  loginModeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  loginModeHeaderIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginModeHeaderCopy: {
    flex: 1,
    gap: 2,
  },
  loginModeHeaderTitle: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 14,
    color: colors.text,
  },
  loginModeHeaderSubtitle: {
    fontFamily: fontFamily.body,
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.muted,
  },
  loginFormBlock: {
    gap: 14,
  },
  loginFormBlockCompact: {
    gap: 12,
  },
  loginFormFields: {
    gap: 14,
  },
  loginFormActions: {
    gap: 12,
    marginTop: 4,
  },
  loginHelperText: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    lineHeight: 17,
    color: colors.muted,
    textAlign: 'center',
  },
  loginInputGroup: {
    gap: 6,
  },
  loginInputLabel: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 12.5,
    color: colors.text,
  },
  registrationInputLabel: {
    color: '#020817',
  },
  loginInputShell: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
  },
  loginInputText: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 14.5,
    color: colors.text,
  },
  loginUtilityRow: {
    flexDirection: 'row',
    gap: 12,
  },
  loginUtilityColumn: {
    flexDirection: 'column',
  },
  loginUtilityCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 68,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  loginUtilityCardPressed: {
    opacity: 0.9,
    backgroundColor: '#F8FAFC',
  },
  loginUtilityIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginUtilityCopy: {
    flex: 1,
    gap: 2,
  },
  loginUtilityTitle: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 12.5,
    color: colors.text,
  },
  loginUtilitySubtitle: {
    fontFamily: fontFamily.body,
    fontSize: 11,
    color: colors.muted,
  },
  loginSecurityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  loginSecurityIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginSecurityCopy: {
    flex: 1,
    gap: 2,
  },
  loginSecurityTitle: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 12.5,
    color: colors.text,
  },
  loginSecurityText: {
    fontFamily: fontFamily.body,
    fontSize: 11,
    lineHeight: 16,
    color: colors.muted,
  },
  loginFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 2,
  },
  loginFooterText: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    color: colors.muted,
  },
  loginFooterLink: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 13,
    color: colors.primary,
  },
  registrationFlowScreen: {
    flexGrow: 1,
    backgroundColor: colors.surface,
  },
  registrationShell: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 540,
    borderRadius: 34,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    ...shadows.card,
  },
  registrationShellMobile: {
    alignSelf: 'stretch',
    maxWidth: '100%',
    borderRadius: 0,
    flexGrow: 1,
    elevation: 0,
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
  },
  registrationHero: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 34,
    alignItems: 'center',
    gap: 14,
  },
  registrationTopRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  registrationBackButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  registrationBackButtonPressed: {
    opacity: 0.88,
  },
  registrationSpacer: {
    width: 38,
  },
  registrationStepLabel: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 12,
    letterSpacing: 1.2,
    color: '#60A5FA',
    textTransform: 'uppercase',
  },
  registrationIconTile: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    ...shadows.soft,
  },
  registrationTitle: {
    marginTop: 4,
    fontFamily: fontFamily.heading,
    fontSize: 24,
    lineHeight: 30,
    color: colors.surface,
    textAlign: 'center',
  },
  registrationSubtitle: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.82)',
    textAlign: 'center',
    maxWidth: 320,
  },
  registrationBody: {
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 26,
    gap: 16,
    backgroundColor: colors.surface,
  },
  registrationBodyMobile: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingBottom: 20,
  },
  registrationProgressRail: {
    height: 5,
    backgroundColor: '#E7ECF6',
  },
  registrationProgressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  registrationHint: {
    textAlign: 'center',
    fontFamily: fontFamily.body,
    fontSize: 12,
    lineHeight: 18,
    color: colors.muted,
  },
  registrationResumeCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 6,
  },
  registrationResumeTitle: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 13,
    color: colors.text,
  },
  registrationResumeText: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    lineHeight: 18,
    color: colors.muted,
  },
  registrationTextLink: {
    textAlign: 'center',
    fontFamily: fontFamily.bodyBold,
    fontSize: 13,
    color: colors.primary,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  brandCopy: {
    flex: 1,
    gap: 4,
  },
  brandScreenTitle: {
    fontFamily: fontFamily.heading,
    fontSize: 30,
    color: colors.text,
  },
  brandScreenSubtitle: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    lineHeight: 22,
    color: colors.muted,
  },
  tabWrap: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: radius.md,
    backgroundColor: '#F1F5F9',
    gap: 4,
  },
  tabItem: {
    flex: 1,
    minHeight: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: colors.surface,
  },
  tabText: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 13,
    color: colors.muted,
  },
  tabTextActive: {
    color: colors.primary,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  flexButton: {
    flex: 1,
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  linkText: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 13,
    color: colors.primary,
  },
  authBadgeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  authBadgeText: {
    flex: 1,
    fontFamily: fontFamily.bodySemi,
    fontSize: 13,
    lineHeight: 20,
    color: colors.surface,
  },
  bottomLink: {
    textAlign: 'center',
    fontFamily: fontFamily.bodyBold,
    fontSize: 14,
    color: colors.primary,
  },
  dualInputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  countryCodeField: {
    width: 136,
  },
  mobileField: {
    flex: 1,
  },
  resumeTitle: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 18,
    color: colors.text,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxText: {
    flex: 1,
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 20,
    color: colors.text,
  },
  centeredCard: {
    alignItems: 'center',
  },
  otpIllustration: {
    width: 88,
    height: 88,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewOtpBanner: {
    width: '100%',
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 4,
  },
  previewOtpLabel: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: colors.primary,
  },
  previewOtpValue: {
    fontFamily: fontFamily.heading,
    fontSize: 28,
    color: colors.text,
  },
  previewOtpHint: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    color: colors.muted,
  },
  otpRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  otpInputWrap: {
    width: '100%',
    position: 'relative',
  },
  otpInputPressable: {
    width: '100%',
  },
  otpBox: {
    flex: 1,
    minHeight: 60,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxFocused: {
    borderColor: colors.primary,
    backgroundColor: '#EFF6FF',
  },
  otpDigit: {
    fontFamily: fontFamily.heading,
    fontSize: 24,
    color: colors.primary,
  },
  otpOverlayInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.02,
    color: 'transparent',
    backgroundColor: 'transparent',
  },
  otpHint: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 13,
    color: colors.primary,
  },
  otpMetaRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timerText: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 22,
    color: colors.primary,
  },
  supportingText: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 20,
    color: colors.muted,
  },
  strengthTrack: {
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: '#E2E8F0',
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    width: '84%',
    borderRadius: radius.pill,
  },
  darkAuthScreen: {
    gap: 22,
    backgroundColor: 'transparent',
  },
  glassHero: {
    minHeight: 420,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 18,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  biometricGraphic: {
    marginTop: 18,
  },
  biometricBubble: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassTitle: {
    fontFamily: fontFamily.heading,
    fontSize: 28,
    color: colors.surface,
    textAlign: 'center',
  },
  glassSubtitle: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.74)',
    textAlign: 'center',
  },
  biometricStatusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  biometricStatusBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
  },
  biometricStatusBadgeActive: {
    borderColor: 'rgba(255,255,255,0.32)',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  biometricStatusBadgeMuted: {
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  biometricStatusText: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 12,
    color: colors.surface,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  sessionLead: {
    flexDirection: 'row',
    gap: 12,
    flex: 1,
  },
  sessionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionCopy: {
    flex: 1,
    gap: 4,
  },
  sessionTitle: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 15,
    color: colors.text,
  },
  sessionMeta: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    color: colors.muted,
  },
  sessionFooter: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    color: colors.muted,
  },
  currentBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#EEF2FF',
    alignSelf: 'flex-start',
  },
  currentBadgeText: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 11,
    color: colors.primary,
  },
  successScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 18,
  },
  successBurst: {
    position: 'absolute',
    top: 120,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(34,197,94,0.10)',
  },
  successBadge: {
    width: 94,
    height: 94,
    borderRadius: 47,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontFamily: fontFamily.heading,
    fontSize: 30,
    lineHeight: 38,
    textAlign: 'center',
    color: colors.text,
  },
  successSubtitle: {
    fontFamily: fontFamily.body,
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    color: colors.muted,
    paddingHorizontal: 10,
  },
  successButton: {
    width: '100%',
  },
  successModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  successModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.58)',
  },
  successModalCard: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 24,
  },
  successModalBadge: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successModalTitle: {
    fontFamily: fontFamily.heading,
    fontSize: 24,
    lineHeight: 30,
    textAlign: 'center',
    color: colors.text,
  },
  successModalSubtitle: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    color: colors.muted,
  },
});
