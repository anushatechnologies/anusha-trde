import Constants from 'expo-constants';

type ExpoExtraConfig = {
  authApiBaseUrl?: string;
  enableTestingOtp?: boolean;
  testingOtpCode?: string;
  useMockApi?: boolean;
};

const extra = (Constants.expoConfig?.extra as ExpoExtraConfig | undefined) ?? {};

const sanitizeTestingOtpCode = (value: string | undefined) => {
  const digits = String(value ?? '')
    .replace(/\D/g, '')
    .slice(0, 6);

  return digits.length === 6 ? digits : '123456';
};

const envAuthApiBaseUrl =
  process.env.EXPO_PUBLIC_AUTH_API_BASE_URL ||
  process.env.EXPO_PUBLIC_API_URL ||
  process.env.AUTH_API_BASE_URL ||
  process.env.API_URL;

export const runtimeConfig = {
  authApiBaseUrl: String(envAuthApiBaseUrl || extra.authApiBaseUrl || 'https://api.anushatrade.com').trim().replace(/\/+$|\s+$/g, ''),
  enableTestingOtp: process.env.EXPO_PUBLIC_ENABLE_TESTING_OTP
    ? process.env.EXPO_PUBLIC_ENABLE_TESTING_OTP === 'true'
    : Boolean(extra.enableTestingOtp),
  testingOtpCode: sanitizeTestingOtpCode(process.env.EXPO_PUBLIC_TESTING_OTP_CODE || extra.testingOtpCode),
  useMockApi: process.env.EXPO_PUBLIC_USE_MOCK_API
    ? process.env.EXPO_PUBLIC_USE_MOCK_API === 'true'
    : Boolean(extra.useMockApi),
  razorpayKeyId: String(process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_TO6q7NUVnPM6bA').trim(),
};

export const isTestingOtpMode = runtimeConfig.useMockApi && runtimeConfig.enableTestingOtp;
