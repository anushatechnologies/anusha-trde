import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';

import { colors, fontFamily, radius, shadows } from '../../constants/theme';
import { authService } from '../../services/auth.service';
import { getAuthErrorMessage } from '../../services/firebase-auth.service';
import { useAuthStore } from '../../store/use-auth-store';
import { AppScreen } from '../ui/app-screen';
import { NumericKeypad } from '../ui/numeric-keypad';
import { PinBoxesInput } from '../ui/pin-boxes-input';

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
        setHasBiometric(hasHardware && isEnrolled);
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

  const handleKeyPress = (key: string) => {
    if (mpin.length < MPIN_LENGTH && !isVerifying) {
      const nextMpin = mpin + key;
      setMpin(nextMpin);
      if (nextMpin.length === MPIN_LENGTH) {
        void executeVerify(nextMpin);
      }
    }
  };

  const handleBackspace = () => {
    if (!isVerifying && mpin.length > 0) {
      setMpin((prev) => prev.slice(0, -1));
      setErrorMessage('');
    }
  };

  const handleBiometricAuthenticate = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate with Face ID / Fingerprint to open Anusha Trade',
        fallbackLabel: 'Use MPIN',
      });

      if (result.success) {
        markMpinVerified();
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Biometric authentication failed:', error);
    }
  };

  return (
    <AppScreen scrollable={false} contentStyle={styles.screen}>
      <View style={styles.container}>
        {/* Brand Logo & Lock Badge */}
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
          <Text style={styles.greetingText}>Welcome Back, {user?.name || 'Investor'}</Text>
          <Text style={styles.subtitleText}>Enter your 4-digit security MPIN to unlock your account.</Text>
        </View>

        {/* 4-Digit PIN Boxes */}
        <View style={styles.pinSection}>
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
            autoFocus
          />

          {/* Loading or Error Feedback */}
          <View style={styles.feedbackRow}>
            {isVerifying ? (
              <View style={styles.verifyingPill}>
                <ActivityIndicator size="small" color={colors.cyan} />
                <Text style={styles.verifyingText}>Verifying MPIN...</Text>
              </View>
            ) : errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : (
              <Text style={styles.securityNote}>🔒 End-to-end 256-bit encrypted security</Text>
            )}
          </View>
        </View>

        {/* On-Screen Numeric Keypad */}
        <NumericKeypad
          onKeyPress={handleKeyPress}
          onBackspace={handleBackspace}
          showBiometric={hasBiometric}
          onBiometricPress={handleBiometricAuthenticate}
        />

        {/* Footer Actions */}
        <View style={styles.footerRow}>
          <Pressable
            onPress={() => router.push('/(auth)/forgot-mpin')}
            style={({ pressed }) => [styles.actionLink, pressed && styles.actionLinkPressed]}
          >
            <Ionicons name="key-outline" size={15} color={colors.cyan} />
            <Text style={styles.actionLinkText}>Forgot MPIN?</Text>
          </Pressable>

          <Pressable
            onPress={() => void signOut()}
            style={({ pressed }) => [styles.logoutBtn, pressed && styles.logoutBtnPressed]}
          >
            <Ionicons name="log-out-outline" size={15} color={colors.dangerLight} />
            <Text style={styles.logoutBtnText}>Switch Account / Logout</Text>
          </Pressable>
        </View>
      </View>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  screen: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#080D1A',
  },
  container: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoBadgeWrap: {
    position: 'relative',
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    ...shadows.card,
  },
  brandLogo: {
    width: 54,
    height: 54,
  },
  shieldMiniIcon: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0F172A',
  },
  brandName: {
    fontFamily: fontFamily.heading,
    fontSize: 16,
    letterSpacing: 1.5,
    color: colors.cyan,
    marginBottom: 2,
  },
  greetingText: {
    fontFamily: fontFamily.heading,
    fontSize: 22,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitleText: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  pinSection: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 10,
  },
  feedbackRow: {
    minHeight: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  verifyingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  verifyingText: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    color: colors.cyan,
  },
  errorText: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 12,
    color: colors.dangerLight,
    textAlign: 'center',
  },
  securityNote: {
    fontFamily: fontFamily.body,
    fontSize: 11,
    color: colors.textSecondary,
  },
  footerRow: {
    marginTop: 16,
    alignItems: 'center',
    gap: 10,
  },
  actionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  actionLinkPressed: {
    opacity: 0.8,
  },
  actionLinkText: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 13,
    color: colors.cyan,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  logoutBtnPressed: {
    opacity: 0.8,
  },
  logoutBtnText: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 12.5,
    color: colors.dangerLight,
  },
});
