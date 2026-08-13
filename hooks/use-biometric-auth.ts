import * as LocalAuthentication from 'expo-local-authentication';

export const useBiometricAuth = () => {
  const authenticate = async (promptMessage = 'Authenticate to continue') => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !enrolled) {
      return {
        success: false,
        error: 'Biometric authentication is not available on this device.',
      };
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: 'Use device passcode',
      cancelLabel: 'Cancel',
    });

    return result.success
      ? { success: true, error: null }
      : {
          success: false,
          error: result.error || 'Biometric verification was cancelled.',
        };
  };

  return { authenticate };
};
