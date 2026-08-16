import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';

import { colors, fontFamily, gradients, radius, shadows } from '../../constants/theme';
import { authService } from '../../services/auth.service';
import { getAuthErrorMessage } from '../../services/firebase-auth.service';
import { useAuthStore } from '../../store/use-auth-store';
import { AppScreen } from '../ui/app-screen';
import { PinBoxesInput } from '../ui/pin-boxes-input';
import { ProfileAvatar } from '../ui/profile-avatar';

export const MpinVerificationScreen = () => {
  const MPIN_LENGTH = 4;
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const requiresMpinVerification = useAuthStore((state) => state.requiresMpinVerification);
  const markMpinVerified = useAuthStore((state) => state.markMpinVerified);
  const setTokens = useAuthStore((state) => state.setTokens);
  const signOut = useAuthStore((state) => state.signOut);
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const expiresAt = useAuthStore((state) => state.expiresAt);

  const [mpin, setMpin] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [hasBiometric, setHasBiometric] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('Biometric');

  useEffect(() => {
    if (!requiresMpinVerification) {
      router.replace('/(tabs)');
    }
  }, [requiresMpinVerification, router]);

  useEffect(() => {
    const checkBiometric = async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType('Face ID');
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType('Fingerprint');
        } else {
          setBiometricType('Biometrics');
        }

        const available = hasHardware && isEnrolled;
        setHasBiometric(available);

        // Auto-prompt biometric if user previously enabled it
        if (available && user?.biometricEnabled) {
          setTimeout(() => {
            void handleBiometricAuthenticate();
          }, 300);
        }
      } catch {
        setHasBiometric(false);
      }
    };
    void checkBiometric();
  }, []);

  const executeVerify = useCallback(
    async (pinToVerify: string) => {
      if (!user) return;

      if (pinToVerify.length !== MPIN_LENGTH) {
        setErrorMessage('Please enter all 4 digits.');
        return;
      }

      if (!accessToken) {
        Alert.alert('Session Expired', 'Please sign in again before verifying your MPIN.');
        return;
      }

      setIsVerifying(true);
      setErrorMessage('');

      try {
        const verifiedSession = await authService.verifyMpin(
          {
            user,
            tokens: {
              accessToken,
              refreshToken: refreshToken ?? '',
              expiresAt: expiresAt ?? Date.now(),
            },
          },
          pinToVerify
        );

        await setTokens(verifiedSession.tokens);
        markMpinVerified();
        setMpin('');
        router.replace('/(tabs)');
      } catch (error) {
        setErrorMessage(getAuthErrorMessage(error) || 'Incorrect MPIN. Please try again.');
        setMpin('');
      } finally {
        setIsVerifying(false);
      }
    },
    [user, accessToken, refreshToken, expiresAt, setTokens, markMpinVerified, router]
  );

  const handleBiometricAuthenticate = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Unlock Anusha Trade with ${biometricType}`,
        fallbackLabel: 'Enter 4-Digit MPIN',
      });

      if (result.success) {
        markMpinVerified();
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.warn('Biometric authentication failed:', error);
    }
  };

  const displayName = user?.name || 'Investor';
  const displayMobile = user?.mobile
    ? `+91 ${user.mobile.replace(/\D/g, '').slice(-10)}`
    : 'Authenticated Account';

  return (
    <AppScreen scrollable={false} contentStyle={styles.screen}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Top Brand & Security Header */}
            <View style={styles.headerSection}>
              <View style={styles.logoBadgeWrap}>
                <Image
                  source={require('../../assets/brand-logo.png')}
                  style={styles.brandLogo}
                  resizeMode="contain"
                />
                <View style={styles.shieldMiniIcon}>
                  <Ionicons name="shield-checkmark" size={14} color="#FFFFFF" />
                </View>
              </View>

              <Text style={styles.brandName}>ANUSHA TRADE</Text>
              <Text style={styles.greetingText}>Welcome Back, {displayName}</Text>

              {/* User Identity Chip */}
              <View style={styles.userChip}>
                <ProfileAvatar
                  name={displayName}
                  photoUrl={user?.profilePhoto}
                  size={24}
                  borderRadius={12}
                />
                <Text style={styles.userChipText}>{displayMobile}</Text>
                <View style={styles.userChipBadge}>
                  <Text style={styles.userChipBadgeText}>SECURE</Text>
                </View>
              </View>

              <Text style={styles.instructionText}>
                Enter your 4-digit security MPIN to unlock your investment account.
              </Text>
            </View>

            {/* Central PIN Input Card */}
            <View style={styles.pinCard}>
              <Text style={styles.pinCardLabel}>ENTER 4-DIGIT MPIN</Text>

              <PinBoxesInput
                value={mpin}
                onChangeText={(val) => {
                  setMpin(val);
                  setErrorMessage('');
                  if (val.length === MPIN_LENGTH) {
                    void executeVerify(val);
                  }
                }}
                length={MPIN_LENGTH}
                secureTextEntry
                autoFocus={true}
                hasError={Boolean(errorMessage)}
              />

              {/* Feedback State (Verifying / Error / Security Note) */}
              <View style={styles.feedbackContainer}>
                {isVerifying ? (
                  <View style={styles.verifyingPill}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={styles.verifyingText}>Verifying MPIN securely...</Text>
                  </View>
                ) : errorMessage ? (
                  <View style={styles.errorPill}>
                    <Ionicons name="alert-circle" size={16} color="#DC2626" />
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                ) : (
                  <View style={styles.securityPill}>
                    <Ionicons name="lock-closed" size={12} color="#10B981" />
                    <Text style={styles.securityPillText}>256-Bit Hardware Encrypted Security</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Quick Biometric Unlock Button */}
            {hasBiometric ? (
              <Pressable
                onPress={() => void handleBiometricAuthenticate()}
                style={({ pressed }) => [
                  styles.biometricButton,
                  pressed && styles.biometricButtonPressed,
                ]}
              >
                <MaterialCommunityIcons
                  name={biometricType === 'Face ID' ? 'face-recognition' : 'fingerprint'}
                  size={24}
                  color={colors.primary}
                />
                <Text style={styles.biometricButtonText}>
                  Unlock with {biometricType}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.primary} />
              </Pressable>
            ) : null}

            {/* Footer Navigation Links */}
            <View style={styles.footerSection}>
              <Pressable
                onPress={() => router.push('/(auth)/forgot-mpin')}
                style={({ pressed }) => [
                  styles.footerLink,
                  pressed && styles.footerLinkPressed,
                ]}
              >
                <Ionicons name="key-outline" size={15} color={colors.primary} />
                <Text style={styles.footerLinkText}>Forgot MPIN? Reset via OTP</Text>
              </Pressable>

              <Pressable
                onPress={() => void signOut()}
                style={({ pressed }) => [
                  styles.logoutLink,
                  pressed && styles.logoutLinkPressed,
                ]}
              >
                <Ionicons name="log-out-outline" size={14} color="#64748B" />
                <Text style={styles.logoutLinkText}>Switch Account or Sign Out</Text>
              </Pressable>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  keyboardAvoid: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
    maxWidth: 400,
  },
  logoBadgeWrap: {
    position: 'relative',
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  brandLogo: {
    width: 50,
    height: 50,
  },
  shieldMiniIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  brandName: {
    fontFamily: fontFamily.heading,
    fontSize: 15,
    letterSpacing: 2,
    color: colors.primary,
    marginBottom: 4,
  },
  greetingText: {
    fontFamily: fontFamily.heading,
    fontSize: 23,
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  userChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.pill,
    paddingVertical: 5,
    paddingLeft: 6,
    paddingRight: 12,
    marginBottom: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  userChipText: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12.5,
    color: '#334155',
  },
  userChipBadge: {
    backgroundColor: '#DCFCE7',
    borderRadius: radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  userChipBadgeText: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 9.5,
    color: '#15803D',
    letterSpacing: 0.5,
  },
  instructionText: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 19,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  pinCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingVertical: 22,
    paddingHorizontal: 16,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
    marginBottom: 16,
  },
  pinCardLabel: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 11,
    letterSpacing: 1.5,
    color: '#64748B',
    marginBottom: 4,
  },
  feedbackContainer: {
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  verifyingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  verifyingText: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12.5,
    color: colors.primary,
  },
  errorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  errorText: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 12.5,
    color: '#DC2626',
    textAlign: 'center',
  },
  securityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  securityPillText: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    color: '#166534',
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#EFF6FF',
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginBottom: 16,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  biometricButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },
  biometricButtonText: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 14.5,
    color: colors.primary,
    flex: 1,
    textAlign: 'center',
  },
  footerSection: {
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
    width: '100%',
  },
  footerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  footerLinkPressed: {
    opacity: 0.7,
  },
  footerLinkText: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 13.5,
    color: colors.primary,
  },
  logoutLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  logoutLinkPressed: {
    opacity: 0.7,
  },
  logoutLinkText: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    color: '#64748B',
  },
});
