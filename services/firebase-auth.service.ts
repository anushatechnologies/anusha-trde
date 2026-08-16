import type { FirebaseAuthTypes } from '@react-native-firebase/auth';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

type FirebaseAuthModule = typeof import('@react-native-firebase/auth');
type PendingPhoneConfirmation = FirebaseAuthTypes.ConfirmationResult;

export type PhoneOtpRequestResult = {
  target: string;
};

export type PhoneOtpVerificationResult = {
  firebaseUid: string;
  idToken: string;
  phoneNumber: string;
};

const DEFAULT_COUNTRY_CODE = '+91';

export const EXPO_GO_AUTH_MESSAGE =
  'Firebase phone authentication needs a custom Expo development build or a release build. Expo Go can open the app, but it cannot complete native Firebase OTP verification.';

const isPreviewAuthMode =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
  Platform.OS === 'web';

let pendingPhoneConfirmation: PendingPhoneConfirmation | null = null;

const canUseNativePhoneAuth = () => {
  if (isPreviewAuthMode) {
    return false;
  }

  try {
    require('@react-native-firebase/auth');
    return true;
  } catch {
    return false;
  }
};

const loadFirebaseAuthModule = (): FirebaseAuthModule => {
  if (!canUseNativePhoneAuth()) {
    throw new Error(EXPO_GO_AUTH_MESSAGE);
  }

  try {
    return require('@react-native-firebase/auth') as FirebaseAuthModule;
  } catch {
    throw new Error(EXPO_GO_AUTH_MESSAGE);
  }
};

const getFirebaseAuth = () => loadFirebaseAuthModule().getAuth();

const requirePendingPhoneConfirmation = () => {
  if (!pendingPhoneConfirmation) {
    throw new Error('OTP session expired. Please request a new OTP.');
  }

  return pendingPhoneConfirmation;
};

const clearPendingPhoneConfirmation = () => {
  pendingPhoneConfirmation = null;
};

const confirmPendingPhoneOtp = async (otpCode: string) => {
  const confirmation = requirePendingPhoneConfirmation();

  if (otpCode.trim().length !== 6) {
    throw new Error('Enter the 6-digit OTP sent to your mobile.');
  }

  return confirmation.confirm(otpCode.trim());
};

const configureTestingSettings = (authInstance: ReturnType<typeof getFirebaseAuth>) => {
  try {
    // Enable real SMS OTP delivery to real mobile numbers via Google Play Integrity
    authInstance.settings.appVerificationDisabledForTesting = false;
  } catch {
    // ignore
  }
};

export const getAuthErrorMessage = (error: unknown) => {
  const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
  const networkCode = typeof error === 'object' && error && 'name' in error ? String(error.name) : '';
  const responseData =
    typeof error === 'object' && error && 'response' in error
      ? (error as { response?: { data?: unknown } }).response?.data
      : undefined;

  if (responseData && typeof responseData === 'object') {
    const errorResponse = responseData as { error?: unknown; message?: unknown };

    if (typeof errorResponse.message === 'string' && errorResponse.message.trim()) {
      return errorResponse.message;
    }

    if (typeof errorResponse.error === 'string' && errorResponse.error.trim()) {
      return errorResponse.error;
    }

    if (typeof errorResponse.error === 'object' && errorResponse.error !== null) {
      const nestedErr = errorResponse.error as { message?: string; details?: string[] | string };
      if (Array.isArray(nestedErr.details) && nestedErr.details.length > 0) {
        return nestedErr.details.join('. ');
      }
      if (typeof nestedErr.message === 'string' && nestedErr.message.trim()) {
        return nestedErr.message;
      }
    }
  }

  switch (code) {
    case 'auth/invalid-phone-number':
      return 'The mobile number format is invalid. Include the correct country code.';
    case 'auth/missing-phone-number':
      return 'Enter your mobile number first.';
    case 'auth/missing-client-identifier':
    case 'auth/app-not-authorized':
    case 'auth/captcha-check-failed':
    case 'auth/invalid-app-credential':
    case 'auth/missing-app-credential':
    case 'auth/app-not-verified':
      return 'Firebase phone verification is not fully configured for this Android app build. Please try again, or use the backend OTP flow.';
    case 'auth/too-many-requests':
      return 'Too many OTP attempts were made. Please wait and try again.';
    case 'auth/invalid-verification-code':
      return 'The OTP you entered is invalid.';
    case 'auth/code-expired':
    case 'auth/session-expired':
      return 'This OTP has expired. Please tap "Resend OTP" to request a new code.';
    case 'auth/invalid-credential':
      return 'The email, mobile number, or MPIN is incorrect.';
    case 'auth/user-not-found':
      return 'No account was found for that mobile number or email.';
    case 'auth/wrong-password':
      return 'The password or MPIN is incorrect.';
    case 'auth/email-already-in-use':
      return 'That email address is already linked to another account.';
    case 'auth/provider-already-linked':
      return 'This account is already linked.';
    case 'auth/requires-recent-login':
      return 'Please sign in again before changing your password.';
    case 'ERR_NETWORK':
      return 'Could not connect to the server. Check the API base URL and your internet connection.';
    default:
      if (networkCode === 'AxiosError') {
        const defaultMsg = (error as Error)?.message;
        return defaultMsg && !defaultMsg.includes('Request failed with status code')
          ? defaultMsg
          : 'The request could not be completed. Please try again.';
      }

      return error instanceof Error ? error.message : 'Something went wrong. Please try again.';
  }
};

export const firebaseAuthService = {
  canUseNativePhoneAuth,
  normalizePhoneNumber: (value: string) => {
    const trimmed = value.trim();
    const normalized = trimmed.replace(/[^\d+]/g, '');

    if (!normalized) {
      throw new Error('Enter your mobile number to receive the OTP.');
    }

    if (normalized.startsWith('00')) {
      return `+${normalized.slice(2)}`;
    }

    if (normalized.startsWith('+')) {
      return normalized;
    }

    const digits = normalized.replace(/\D/g, '');

    if (digits.length === 10) {
      return `${DEFAULT_COUNTRY_CODE}${digits}`;
    }

    if (digits.length >= 11) {
      return `+${digits}`;
    }

    throw new Error('Enter a valid mobile number with country code.');
  },
  requestPhoneOtp: async (phoneNumber: string, forceResend = false): Promise<PhoneOtpRequestResult> => {
    const normalizedPhone = firebaseAuthService.normalizePhoneNumber(phoneNumber);
    const authInstance = getFirebaseAuth();

    configureTestingSettings(authInstance);

    pendingPhoneConfirmation = await authInstance.signInWithPhoneNumber(normalizedPhone, forceResend);

    return {
      target: normalizedPhone,
    };
  },
  confirmPhoneOtp: async (otpCode: string): Promise<PhoneOtpVerificationResult> => {
    const result = await confirmPendingPhoneOtp(otpCode);

    if (!result) {
      throw new Error('OTP verification did not return a user session.');
    }

    clearPendingPhoneConfirmation();

    return {
      firebaseUid: result.user.uid,
      idToken: await result.user.getIdToken(true),
      phoneNumber: result.user.phoneNumber || '',
    };
  },
  getCurrentIdToken: async (forceRefresh = false) => {
    if (isPreviewAuthMode) {
      throw new Error(EXPO_GO_AUTH_MESSAGE);
    }

    const currentUser = getFirebaseAuth().currentUser;

    if (!currentUser) {
      throw new Error('Your mobile verification session expired. Please verify OTP again.');
    }

    return currentUser.getIdToken(forceRefresh);
  },
  signOut: async () => {
    clearPendingPhoneConfirmation();

    if (isPreviewAuthMode) {
      return;
    }

    try {
      const firebaseAuth = loadFirebaseAuthModule();
      await firebaseAuth.signOut(getFirebaseAuth());
    } catch {
      return;
    }
  },
};
