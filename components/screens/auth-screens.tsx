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
import { mpinService } from '../../services/mpin.service';
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
import { PinBoxesInput } from '../ui/pin-boxes-input';

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
  badgeType?: 'success' | 'new_account' | 'login';
  phoneBadge?: string;
  onContinue: () => void;
};

const TOTAL_REGISTRATION_STEPS = 10;
const getRegistrationProgressWidth = (stepNumber: number) =>
  `${(stepNumber / TOTAL_REGISTRATION_STEPS) * 100}%` as `${number}%`;

const OtpBoxes = ({ code, isFocused }: { code: string; isFocused: boolean }) => (
  <View style={styles.otpRow}>
    {new Array(6).fill(null).map((_, index) => {
      const isBoxActive = isFocused && index === Math.min(code.length, 5);
      const isFilled = index < code.length;
      return (
        <View
          key={`otp-${index}`}
          style={[
            styles.otpBox,
            isFilled && styles.otpBoxFilled,
            isBoxActive && styles.otpBoxFocused,
          ]}
        >
          <Text style={[styles.otpDigit, isFilled && styles.otpDigitFilled]}>
            {code[index] || ''}
          </Text>
        </View>
      );
    })}
  </View>
);

const RegistrationStepCard = ({
  stepLabel,
  title,
  subtitle,
  icon,
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
  progressWidth?: `${number}%`;
  onBackPress: () => void;
  shellStyle?: StyleProp<ViewStyle>;
  bodyStyle?: StyleProp<ViewStyle>;
  heroStyle?: StyleProp<ViewStyle>;
  children?: ReactNode;
}) => (
  <View style={[styles.registrationShell, shellStyle]}>
    <View style={[styles.registrationHero, heroStyle]}>
      <View style={styles.registrationTopRow}>
        <Pressable onPress={onBackPress} style={({ pressed }) => [styles.registrationBackButton, pressed && styles.registrationBackButtonPressed]}>
          <Ionicons name="arrow-back" size={22} color="#374151" />
        </Pressable>
        <Text style={styles.registrationStepLabel}>{stepLabel}</Text>
        <View style={styles.registrationSpacer} />
      </View>

      <View style={styles.registrationIconTile}>
        <Ionicons name={icon} size={26} color={colors.primary} />
      </View>

      <Text style={styles.registrationTitle}>{title}</Text>
      <Text style={styles.registrationSubtitle}>{subtitle}</Text>
    </View>

    <View style={[styles.registrationBody, bodyStyle]}>{children}</View>
  </View>
);

const SessionCard = ({ item, showLocation = true }: { item: SessionItem; showLocation?: boolean; key?: string }) => (
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
  </SurfaceCard>
);

export const LoginScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ target?: string; mobile?: string }>();
  const { isTablet, width } = useResponsive();
  const insets = useSafeAreaInsets();
  const signIn = useAuthStore((state) => state.signIn);
  const incomingMobile = getParam(params.target || params.mobile, '');

  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginMode, setLoginMode] = useState<'password' | 'otp'>('password');
  const isCompact = width < 390;

  useEffect(() => {
    if (incomingMobile) {
      setMobile(normalizeMobileDigits(incomingMobile));
    }
  }, [incomingMobile]);

  const handleMobileChange = (value: string) => {
    let digits = value.replace(/\D/g, '');
    if (digits.startsWith('91') && digits.length > 10) {
      digits = digits.slice(2);
    }
    setMobile(digits.slice(0, 10));
  };

  // Password / MPIN Login Mutation
  const passwordLoginMutation = useMutation({
    mutationFn: async () => {
      const sanitizedMobile = normalizeMobileDigits(mobile);
      if (password.length === 4 && /^\d{4}$/.test(password)) {
        return authService.loginWithMobileMpin(sanitizedMobile, password);
      }
      return authService.loginWithMobilePassword(sanitizedMobile, password);
    },
    onSuccess: (session) => {
      signIn(session);
      router.replace('/(tabs)');
    },
    onError: (error: any) => {
      const msg = getAuthErrorMessage(error);
      const isNotFound =
        msg.includes('USER_NOT_FOUND') ||
        msg.toLowerCase().includes('not found') ||
        msg.toLowerCase().includes('not registered') ||
        msg.toLowerCase().includes('does not exist');

      if (isNotFound) {
        Alert.alert(
          'Account Not Found',
          `No registered account found for mobile +91 ${mobile}. Would you like to create a new account?`,
          [
            {
              text: 'Register Now',
              onPress: () => {
                router.push({
                  pathname: '/(auth)/register',
                  params: { mobile },
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
        Alert.alert('Login Failed', msg);
      }
    },
  });

  // OTP Request Mutation
  const otpLoginMutation = useMutation({
    mutationFn: () => authService.requestOtp(`+91${normalizeMobileDigits(mobile)}`, 'login', 'mobile'),
    onSuccess: (data) => {
      router.push({
        pathname: '/(auth)/otp',
        params: {
          target: data.target || `+91${normalizeMobileDigits(mobile)}`,
          purpose: 'login',
          mode: 'mobile',
          provider: data.provider || '',
          previewCode: data.previewCode || '',
        },
      });
    },
    onError: (error) => {
      const msg = getAuthErrorMessage(error);
      Alert.alert('OTP Request Failed', msg);
    },
  });

  const handleLogin = () => {
    const sanitizedMobile = normalizeMobileDigits(mobile);
    if (!sanitizedMobile || sanitizedMobile.length !== 10) {
      Alert.alert('Invalid Mobile Number', 'Enter a valid 10-digit mobile number.');
      return;
    }

    if (loginMode === 'password') {
      if (!password.trim()) {
        Alert.alert('Password Required', 'Enter your password or 4-digit MPIN to sign in.');
        return;
      }
      passwordLoginMutation.mutate();
    } else {
      otpLoginMutation.mutate();
    }
  };

  return (
    <AppScreen
      contentStyle={styles.loginScreen}
      fullBleed
      backgroundColor={'#F7F8FA'}
      safeAreaEdges={['left', 'right']}
      scrollViewProps={{ keyboardShouldPersistTaps: 'handled' }}
    >
      <StatusBar barStyle="light-content" backgroundColor={'#F7F8FA'} />

      <View style={[styles.loginShell, !isTablet && styles.loginShellMobile]}>
        <LinearGradient colors={gradients.dark} style={[styles.loginHero, { paddingTop: Math.max(insets.top + 20, 36) }]}>
          <View style={styles.loginGlowOrbPrimary} />
          <View style={styles.loginGlowOrbSecondary} />

          <View style={styles.loginHeroHeader}>
            <View style={styles.loginBrandBadge}>
              <BrandLogo size={68} />
            </View>
            <View style={styles.loginHeroCopy}>
              <Text style={styles.loginHeroTitle}>Welcome Back</Text>
              <Text style={styles.loginHeroSubtitle}>Sign in to access your investments, daily returns, and wallet.</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={[styles.loginPanel, !isTablet && styles.loginPanelMobile, { paddingBottom: Math.max(insets.bottom + 24, 32) }]}>
          <View style={[styles.loginFormBlock, isCompact && styles.loginFormBlockCompact]}>
            {/* Mode Switcher Tabs */}
            <View style={{ flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: radius.md, borderWidth: 1, borderColor: '#E5E7EB', padding: 4, marginBottom: 16 }}>
              <Pressable
                onPress={() => setLoginMode('password')}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: radius.sm,
                  backgroundColor: loginMode === 'password' ? colors.primary : 'transparent',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontFamily: fontFamily.bodySemi, fontSize: 13, color: loginMode === 'password' ? '#FFFFFF' : colors.textSecondary }}>
                  Password / MPIN
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setLoginMode('otp')}
                style={{
                  flex: 1,
                  paddingVertical: 8,
                  borderRadius: radius.sm,
                  backgroundColor: loginMode === 'otp' ? colors.primary : 'transparent',
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontFamily: fontFamily.bodySemi, fontSize: 13, color: loginMode === 'otp' ? '#FFFFFF' : colors.textSecondary }}>
                  Login via OTP
                </Text>
              </Pressable>
            </View>

            <View style={styles.loginFormFields}>
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

              {loginMode === 'password' ? (
                <>
                  <InputField
                    label="Password or 4-Digit MPIN"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    returnKeyType="done"
                    placeholder="Enter password or MPIN"
                    icon={<Ionicons name="lock-closed-outline" size={18} color={colors.primary} />}
                    trailing={
                      <Pressable onPress={() => setShowPassword((prev) => !prev)} style={{ padding: 6 }}>
                        <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textSecondary} />
                      </Pressable>
                    }
                    containerStyle={styles.loginInputGroup}
                    labelStyle={styles.loginInputLabel}
                    shellStyle={styles.loginInputShell}
                    inputStyle={styles.loginInputText}
                  />
                  <View style={{ alignItems: 'flex-end', marginTop: -4 }}>
                    <Pressable onPress={() => router.push('/(auth)/reset-password')}>
                      <Text style={{ fontFamily: fontFamily.bodySemi, fontSize: 12, color: colors.cyan }}>
                        Forgot Password / MPIN?
                      </Text>
                    </Pressable>
                  </View>
                </>
              ) : (
                <Text style={{ color: colors.muted, fontFamily: fontFamily.body, fontSize: 13 }}>
                  We will send a 6-digit one-time password to your registered mobile.
                </Text>
              )}
            </View>

            <View style={styles.loginFormActions}>
              <GradientButton
                label={
                  loginMode === 'password'
                    ? passwordLoginMutation.isPending
                      ? 'Signing in...'
                      : 'Sign In to Dashboard'
                    : otpLoginMutation.isPending
                    ? 'Sending OTP...'
                    : 'Send Login OTP'
                }
                onPress={handleLogin}
                iconPosition="end"
                icon={<Ionicons name="arrow-forward" size={18} color="#FFFFFF" />}
              />
            </View>
          </View>

          <View style={styles.loginFooterRow}>
            <Text style={styles.loginFooterText}>Don't have an account?</Text>
            <Pressable onPress={() => router.push('/(auth)/register')} style={{ paddingVertical: 6, paddingHorizontal: 4 }}>
              <Text style={styles.loginFooterLink}>Create Account</Text>
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
    <AppScreen contentStyle={styles.registrationFlowScreen} fullBleed backgroundColor={'#F7F8FA'} safeAreaEdges={['left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={'#F7F8FA'} />
      <RegistrationStepCard
        stepLabel="CREATE ACCOUNT"
        title="Create Account"
        subtitle="Enter your mobile number to start investing & earning."
        icon="phone-portrait-outline"
        progressWidth="15%"
        onBackPress={() => (router.canGoBack() ? router.back() : router.replace('/(auth)/login'))}
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
          showSoftInputOnFocus
          disableFullscreenUI
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
  }), [rawTarget, rawPurpose, rawMode, rawProvider]);
  const target = stableParams.target;
  const purpose = stableParams.purpose;
  const mode = stableParams.mode;
  const [otpProvider, setOtpProvider] = useState(stableParams.provider);
  const otpInputRef = useRef<TextInput | null>(null);
  const [otp, setOtp] = useState('');
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
        if (purpose === 'register') {
          await signupFlowService.mergeDraft({
            mobile: result.session.user.mobile || target,
            otpVerified: true,
            otpVerifiedAt: new Date().toISOString(),
            signupVerificationToken: result.session.tokens.accessToken,
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

        if (purpose === 'login') {
          const nextRoute = authService.resolveOnboardingRoute(result.session.user);
          router.replace(nextRoute);
          return;
        }

        const title = 'Identity Verified';
        const subtitle = 'Your secure OTP verification is complete. Entering your dashboard.';

        setSuccessState({
          title,
          subtitle,
          ctaLabel: 'Continue to Dashboard',
          badgeType: 'login',
          phoneBadge: target,
          onContinue: () => {
            setSuccessState(null);
            router.replace('/(tabs)');
          },
        });
        return;
      }

      const verifiedMobile = result.mobileNumber
        ? result.mobileNumber.startsWith('+')
          ? result.mobileNumber
          : `${normalizeCountryCode('+91')}${result.mobileNumber}`
        : target;

      if (purpose === 'reset') {
        router.replace({
          pathname: '/(auth)/reset-password',
          params: {
            target: verifiedMobile,
            token: (result as any).resetToken || result.signupVerificationToken || 'verified_reset_token',
          },
        });
        return;
      }

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
          title: 'Mobile Verified',
          subtitle: 'Your mobile number is verified. Continue to complete your investor registration.',
          ctaLabel: 'Continue Setup',
          badgeType: 'success',
          phoneBadge: verifiedMobile,
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
      setSuccessState({
        title: 'New Account',
        subtitle: `Mobile number ${verifiedMobile} verified! Let\'s setup your investor profile.`,
        ctaLabel: 'Complete Registration',
        badgeType: 'new_account',
        phoneBadge: verifiedMobile,
        onContinue: () => {
          setSuccessState(null);
          router.replace('/signup/profile');
        },
      });
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
      setOtp('');
      lastSubmittedOtp.current = '';
      Alert.alert(
        'OTP sent',
        data.message || 'A fresh 6-digit OTP has been sent. Please check your SMS and enter it below.'
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
      backgroundColor={'#F7F8FA'}
      safeAreaEdges={['left', 'right']}
      scrollViewProps={{ keyboardShouldPersistTaps: 'always' }}
    >
      <StatusBar barStyle="light-content" backgroundColor={'#F7F8FA'} />
      <Modal visible={Boolean(successState)} transparent animationType="fade" onRequestClose={() => successState?.onContinue()}>
        <View style={styles.successModalOverlay}>
          <Pressable style={styles.successModalBackdrop} onPress={() => successState?.onContinue()} />
          <View style={styles.successModalCard}>
            <LinearGradient
              colors={
                successState?.badgeType === 'new_account'
                  ? ['#0284C7', '#0369A1']
                  : successState?.badgeType === 'login'
                  ? ['#38BDF8', '#2563EB']
                  : ['#10B981', '#059669']
              }
              style={styles.successModalBadge}
            >
              <Ionicons
                name={
                  successState?.badgeType === 'new_account'
                    ? 'person-add'
                    : successState?.badgeType === 'login'
                    ? 'shield-checkmark'
                    : 'checkmark'
                }
                size={34}
                color="#FFFFFF"
              />
            </LinearGradient>

            <Text style={styles.successModalTitle}>{successState?.title}</Text>
            <Text style={styles.successModalSubtitle}>{successState?.subtitle}</Text>

            {successState?.phoneBadge ? (
              <View style={styles.successModalPhoneCapsule}>
                <Ionicons name="checkmark-circle" size={16} color={colors.cyan} />
                <Text style={styles.successModalPhoneText}>{successState.phoneBadge}</Text>
                <View style={styles.successModalVerifiedDot} />
                <Text style={styles.successModalVerifiedTag}>Verified</Text>
              </View>
            ) : null}

            <GradientButton
              label={successState?.ctaLabel || 'Continue'}
              onPress={() => successState?.onContinue()}
              icon={<Ionicons name="arrow-forward" size={18} color="#FFFFFF" />}
              iconPosition="end"
              style={{ width: '100%', marginTop: 8 }}
            />
          </View>
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

  const [step, setStep] = useState<'mobile' | 'otp' | 'password'>('mobile');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [seconds, setSeconds] = useState(60);

  useEffect(() => {
    if (step !== 'otp' || seconds <= 0) return;
    const timer = setInterval(() => {
      setSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [step, seconds]);

  const handleSendOtp = async () => {
    const digits = normalizeMobileDigits(mobile);
    if (!digits || digits.length !== 10) {
      Alert.alert('Mobile Number Required', 'Please enter your registered 10-digit mobile number.');
      return;
    }
    setIsLoading(true);
    try {
      await authService.requestPasswordReset(digits);
      setStep('otp');
      setSeconds(60);
      Alert.alert('OTP Sent', `A 6-digit verification code has been sent to +91 ${digits}`);
    } catch (err: any) {
      Alert.alert('Error', getAuthErrorMessage(err) || 'Failed to send OTP for password reset.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const digits = normalizeMobileDigits(mobile);
    if (!otp.trim() || otp.trim().length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit OTP code.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await authService.verifyResetPasswordOtp(digits, otp.trim());
      setResetToken(res.resetToken);
      setStep('password');
    } catch (err: any) {
      Alert.alert('Verification Failed', getAuthErrorMessage(err) || 'Invalid or expired OTP code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const digits = normalizeMobileDigits(mobile);
    if (!newPassword.trim() || newPassword.trim().length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Password Mismatch', 'New password and confirm password must match.');
      return;
    }
    setIsLoading(true);
    try {
      await authService.resetPassword(resetToken, newPassword.trim(), digits);
      Alert.alert(
        'Password Reset Successful',
        'Your password has been updated successfully. You can now login with your new password.',
        [
          {
            text: 'Login Now',
            onPress: () => router.replace('/(auth)/login'),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Reset Failed', getAuthErrorMessage(err) || 'Could not reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppScreen contentStyle={styles.registrationFlowScreen} fullBleed backgroundColor={'#F7F8FA'} safeAreaEdges={['left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={'#F7F8FA'} />
      <RegistrationStepCard
        stepLabel={step === 'mobile' ? 'STEP 1 OF 3' : step === 'otp' ? 'STEP 2 OF 3' : 'STEP 3 OF 3'}
        title={step === 'mobile' ? 'Forgot Password' : step === 'otp' ? 'Verify Mobile OTP' : 'Set New Password'}
        subtitle={
          step === 'mobile'
            ? 'Enter your registered mobile number to receive a secure password reset OTP.'
            : step === 'otp'
            ? `Enter the 6-digit verification code sent to +91 ${mobile}.`
            : 'Create and confirm a new secure password for your account.'
        }
        icon={step === 'mobile' ? 'lock-open-outline' : step === 'otp' ? 'shield-checkmark-outline' : 'key-outline'}
        onBackPress={() => {
          if (step === 'otp') setStep('mobile');
          else if (step === 'password') setStep('otp');
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
              onChangeText={(val) => setMobile(normalizeMobileDigits(val))}
              keyboardType="phone-pad"
              maxLength={10}
              prefixText="+91"
              placeholder="98765 43210"
              icon={<Ionicons name="call-outline" size={18} color={colors.cyan} />}
            />
            <Text style={styles.registrationHint}>A 6-digit verification code will be sent to your mobile number to verify your identity.</Text>
            <GradientButton
              label={isLoading ? 'Sending OTP...' : 'Send Verification OTP'}
              onPress={handleSendOtp}
              disabled={isLoading || mobile.length !== 10}
              icon={<Ionicons name="arrow-forward" size={18} color="#FFFFFF" />}
              iconPosition="end"
            />
            <Pressable onPress={() => router.replace('/(auth)/login')} style={{ alignItems: 'center', marginTop: 10 }}>
              <Text style={styles.registrationTextLink}>Remember your password? Login</Text>
            </Pressable>
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
              icon={<Ionicons name="key-outline" size={18} color={colors.cyan} />}
              placeholder="Enter 6-digit code"
            />
            <View style={styles.otpMetaRow}>
              <Text style={[styles.timerText, seconds === 0 && { color: colors.muted }]}>
                {seconds > 0 ? `00:${seconds.toString().padStart(2, '0')}` : 'Expired'}
              </Text>
              <Pressable
                onPress={handleSendOtp}
                disabled={seconds > 0 || isLoading}
                style={({ pressed }) => [{ opacity: seconds > 0 || isLoading ? 0.4 : pressed ? 0.7 : 1 }]}
              >
                <Text style={[styles.registrationTextLink, (seconds > 0 || isLoading) && { color: colors.muted }]}>
                  {isLoading ? 'Sending...' : 'Resend OTP'}
                </Text>
              </Pressable>
            </View>
            <GradientButton
              label={isLoading ? 'Verifying...' : 'Verify OTP & Continue'}
              onPress={handleVerifyOtp}
              disabled={isLoading || otp.length !== 6}
              icon={<Ionicons name="arrow-forward" size={18} color="#FFFFFF" />}
              iconPosition="end"
            />
          </>
        )}

        {step === 'password' && (
          <>
            <InputField
              labelStyle={styles.registrationInputLabel}
              label="New Password"
              value={newPassword}
              onChangeText={setNewPassword}
              secure
              icon={<Ionicons name="lock-closed-outline" size={18} color={colors.cyan} />}
              placeholder="Enter at least 6 characters"
            />
            <InputField
              labelStyle={styles.registrationInputLabel}
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secure
              icon={<Ionicons name="shield-checkmark-outline" size={18} color={colors.cyan} />}
              placeholder="Re-enter new password"
            />
            <View style={styles.strengthTrack}>
              <LinearGradient colors={['#38BDF8', '#2563EB', '#10B981']} style={styles.strengthFill} />
            </View>
            <Text style={styles.supportingText}>Choose a secure password with 6+ characters, numbers, and symbols.</Text>
            <GradientButton
              label={isLoading ? 'Updating...' : 'Update Password & Login'}
              onPress={handleResetPassword}
              disabled={isLoading || newPassword.length < 6 || confirmPassword.length < 6}
              icon={<Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />}
              iconPosition="end"
            />
          </>
        )}
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
    mutationFn: () => authService.resetPassword(getParam(params.token), password, getParam(params.target)),
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
    <AppScreen contentStyle={styles.registrationFlowScreen} fullBleed backgroundColor={'#F7F8FA'} safeAreaEdges={['left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={'#F7F8FA'} />
      <RegistrationStepCard
        stepLabel="STEP 3 OF 3"
        title="Create New Password"
        subtitle={`Create a new password for ${maskContact(getParam(params.target)) || 'your account'}.`}
        icon="key-outline"
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
          icon={<Ionicons name="lock-closed-outline" size={18} color={colors.cyan} />}
          placeholder="Enter at least 6 characters"
        />
        <InputField
          labelStyle={styles.registrationInputLabel}
          label="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secure
          icon={<Ionicons name="shield-checkmark-outline" size={18} color={colors.cyan} />}
          placeholder="Re-enter new password"
        />
        <View style={styles.strengthTrack}>
          <LinearGradient colors={['#38BDF8', '#2563EB', '#10B981']} style={styles.strengthFill} />
        </View>
        <Text style={styles.supportingText}>Strong password: use 6+ characters, numbers, and symbols.</Text>
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
  const [seconds, setSeconds] = useState(60);

  useEffect(() => {
    if (step !== 'otp' || seconds <= 0) return;
    const timer = setInterval(() => {
      setSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [step, seconds]);

  const handleSendOtp = async () => {
    const digits = normalizeMobileDigits(mobile);
    if (!digits || digits.length !== 10) {
      Alert.alert('Invalid Mobile', 'Please enter your registered 10-digit mobile number.');
      return;
    }
    setIsLoading(true);
    try {
      await authService.forgotMpin(digits);
      setStep('otp');
      setSeconds(60);
      Alert.alert('OTP Sent', `A 6-digit verification code has been sent to +91 ${digits}`);
    } catch (err: any) {
      Alert.alert('Error', getAuthErrorMessage(err) || 'Failed to send OTP for MPIN reset.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const digits = normalizeMobileDigits(mobile);
    if (!otp.trim() || otp.trim().length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter the 6-digit OTP code.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await authService.verifyResetMpinOtp(digits, otp.trim());
      setResetToken(res.resetToken);
      setStep('mpin');
    } catch (err: any) {
      Alert.alert('Verification Failed', getAuthErrorMessage(err) || 'Invalid or expired OTP code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetMpin = async () => {
    const digits = normalizeMobileDigits(mobile);
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
      await authService.resetMpin(digits, resetToken, newMpin);
      await mpinService.saveMpinForAccount({ mobile: digits, mpin: newMpin.trim() });
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
    <AppScreen contentStyle={styles.registrationFlowScreen} fullBleed backgroundColor={'#F7F8FA'} safeAreaEdges={['left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={'#F7F8FA'} />
      <RegistrationStepCard
        stepLabel={step === 'mobile' ? 'STEP 1 OF 3' : step === 'otp' ? 'STEP 2 OF 3' : 'STEP 3 OF 3'}
        title={step === 'mobile' ? 'Forgot MPIN' : step === 'otp' ? 'Verify Mobile OTP' : 'Set New MPIN'}
        subtitle={
          step === 'mobile'
            ? 'Enter your registered mobile number to verify your identity.'
            : step === 'otp'
            ? `Enter the 6-digit OTP code sent to +91 ${mobile}.`
            : 'Create and confirm your new 4-digit security MPIN.'
        }
        icon={step === 'mobile' ? 'keypad-outline' : step === 'otp' ? 'shield-checkmark-outline' : 'lock-closed-outline'}
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
              prefixText="+91"
              icon={<Ionicons name="call-outline" size={18} color={colors.cyan} />}
              placeholder="98765 43210"
            />
            <Text style={styles.registrationHint}>For security reasons, an OTP will be sent to your mobile number before you can create a new MPIN.</Text>
            <GradientButton
              label={isLoading ? 'Sending OTP...' : 'Send Verification OTP'}
              onPress={() => void handleSendOtp()}
              disabled={isLoading || mobile.length !== 10}
              icon={<Ionicons name="arrow-forward" size={18} color="#FFFFFF" />}
              iconPosition="end"
            />
            <Pressable onPress={() => router.replace('/(auth)/login')} style={{ alignItems: 'center', marginTop: 10 }}>
              <Text style={styles.registrationTextLink}>Remember your MPIN? Login</Text>
            </Pressable>
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
              icon={<Ionicons name="key-outline" size={18} color={colors.cyan} />}
              placeholder="Enter 6-digit code"
            />
            <View style={styles.otpMetaRow}>
              <Text style={[styles.timerText, seconds === 0 && { color: colors.muted }]}>
                {seconds > 0 ? `00:${seconds.toString().padStart(2, '0')}` : 'Expired'}
              </Text>
              <Pressable
                onPress={handleSendOtp}
                disabled={seconds > 0 || isLoading}
                style={({ pressed }) => [{ opacity: seconds > 0 || isLoading ? 0.4 : pressed ? 0.7 : 1 }]}
              >
                <Text style={[styles.registrationTextLink, (seconds > 0 || isLoading) && { color: colors.muted }]}>
                  {isLoading ? 'Sending...' : 'Resend OTP'}
                </Text>
              </Pressable>
            </View>
            <GradientButton
              label={isLoading ? 'Verifying...' : 'Verify & Continue'}
              onPress={() => void handleVerifyOtp()}
              disabled={isLoading || otp.length !== 6}
              icon={<Ionicons name="arrow-forward" size={18} color="#FFFFFF" />}
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
              icon={<Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />}
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
    backgroundColor: '#F7F8FA',
  },
  loginShell: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 540,
    minHeight: '100%',
    backgroundColor: '#F7F8FA',
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
    backgroundColor: '#1E40AF',
  },
  loginGlowOrbPrimary: {
    position: 'absolute',
    top: 54,
    right: -48,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  loginGlowOrbSecondary: {
    position: 'absolute',
    top: 138,
    left: -70,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(255,255,255,0.05)',
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
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
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
    letterSpacing: 1.4,
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'uppercase',
  },
  loginHeroTitle: {
    fontFamily: fontFamily.heading,
    fontSize: 32,
    lineHeight: 38,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  loginHeroSubtitle: {
    maxWidth: 340,
    fontFamily: fontFamily.body,
    fontSize: 14,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.80)',
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 28,
    gap: 18,
    minHeight: 440,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    color: '#374151',
  },
  registrationInputLabel: {
    color: '#374151',
  },
  loginInputShell: {
    minHeight: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
  },
  loginInputText: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 14.5,
    color: '#111827',
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
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    ...shadows.card,
  },
  loginUtilityCardPressed: {
    opacity: 0.9,
    backgroundColor: '#F8FAFC',
  },
  loginUtilityIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
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
    color: '#111827',
  },
  loginUtilitySubtitle: {
    fontFamily: fontFamily.body,
    fontSize: 11,
    color: colors.textSecondary,
  },
  loginSecurityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  loginSecurityIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
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
    color: '#111827',
  },
  loginSecurityText: {
    fontFamily: fontFamily.body,
    fontSize: 11,
    lineHeight: 16,
    color: colors.textSecondary,
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
    color: colors.textSecondary,
  },
  loginFooterLink: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 13,
    color: '#2563EB',
  },
  registrationFlowScreen: {
    flexGrow: 1,
    backgroundColor: '#F7F8FA',
  },
  registrationShell: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 540,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    paddingBottom: 28,
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  registrationBackButtonPressed: {
    opacity: 0.85,
  },
  registrationSpacer: {
    width: 38,
  },
  registrationStepLabel: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 12,
    letterSpacing: 1,
    color: '#6B7280',
    textTransform: 'uppercase',
  },
  registrationIconTile: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  registrationTitle: {
    marginTop: 4,
    fontFamily: fontFamily.heading,
    fontSize: 22,
    lineHeight: 28,
    color: '#111827',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  registrationSubtitle: {
    fontFamily: fontFamily.body,
    fontSize: 13.5,
    lineHeight: 21,
    color: '#6B7280',
    textAlign: 'center',
    maxWidth: 320,
  },
  registrationBody: {
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 26,
    gap: 16,
    backgroundColor: '#F7F8FA',
  },
  registrationBodyMobile: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingBottom: 20,
  },
  registrationProgressRail: {
    height: 4,
    width: '100%',
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  registrationProgressRailWrap: {
    width: '100%',
    paddingHorizontal: 22,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  registrationProgressFill: {
    height: '100%',
    backgroundColor: '#2563EB',
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
    color: '#374151',
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
    minHeight: 58,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  otpBoxFocused: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
  },
  otpBoxFilled: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  otpDigit: {
    fontFamily: fontFamily.heading,
    fontSize: 24,
    color: '#9CA3AF',
  },
  otpDigitFilled: {
    color: '#111827',
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
    minHeight: 380,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 18,
    backgroundColor: '#EFF6FF',
    borderRadius: 24,
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
    fontSize: 26,
    color: '#111827',
    textAlign: 'center',
  },
  glassSubtitle: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    lineHeight: 22,
    color: '#6B7280',
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
    borderColor: '#DBEAFE',
    backgroundColor: '#EFF6FF',
  },
  biometricStatusBadgeMuted: {
    borderColor: '#E5E7EB',
    backgroundColor: '#F8FAFC',
  },
  biometricStatusText: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 12,
    color: '#374151',
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  successModalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  successModalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    alignItems: 'center',
    gap: 12,
    ...shadows.card,
  },
  successModalBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderWidth: 2,
    borderColor: '#DBEAFE',
    ...shadows.card,
  },
  successModalTitle: {
    fontFamily: fontFamily.heading,
    fontSize: 22,
    lineHeight: 28,
    color: '#111827',
    textAlign: 'center',
  },
  successModalSubtitle: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    lineHeight: 21,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 6,
  },
  successModalPhoneCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginTop: 2,
    marginBottom: 4,
  },
  successModalPhoneText: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 13,
    color: '#374151',
  },
  successModalVerifiedDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
  },
  successModalVerifiedTag: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 11,
    color: '#2563EB',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});


