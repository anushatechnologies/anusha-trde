import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontFamily, gradients, radius, shadows } from '../../constants/theme';
import { authService } from '../../services/auth.service';
import { getAuthErrorMessage } from '../../services/firebase-auth.service';
import { useAuthStore } from '../../store/use-auth-store';
import { PinBoxesInput } from '../ui/pin-boxes-input';
import { SurfaceCard } from '../ui/surface-card';

export const MpinGate = () => {
  const MPIN_LENGTH = 4;
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

  useEffect(() => {
    if (!requiresMpinVerification) {
      setMpin('');
      setErrorMessage('');
    }
  }, [requiresMpinVerification]);

  const verifyMpin = async (pinValue?: string) => {
    const pinToVerify = (pinValue || mpin).trim();
    if (!user) {
      return;
    }

    if (pinToVerify.length !== MPIN_LENGTH) {
      setErrorMessage('Enter your 4 digit MPIN.');
      return;
    }

    if (!accessToken) {
      Alert.alert('Session expired', 'Please sign in again before verifying your MPIN.');
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
      setErrorMessage('');
    } catch (error) {
      setErrorMessage(getAuthErrorMessage(error) || 'Incorrect MPIN. Please try again.');
      setMpin('');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Modal visible={requiresMpinVerification} transparent animationType="fade" onRequestClose={() => undefined}>
      <View style={styles.overlay}>
        <View style={styles.backdrop} />
        <SurfaceCard style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="shield-checkmark" size={32} color="#FFFFFF" />
          </View>
          <Text style={styles.title}>Unlock Anusha Trade</Text>
          <Text style={styles.subtitle}>Enter your 4-digit security MPIN to continue.</Text>

          <PinBoxesInput
            value={mpin}
            onChangeText={(val) => {
              setMpin(val);
              setErrorMessage('');
              if (val.length === MPIN_LENGTH) {
                void verifyMpin(val);
              }
            }}
            length={MPIN_LENGTH}
            secureTextEntry
            autoFocus={true}
            hasError={Boolean(errorMessage)}
          />

          {isVerifying ? (
            <View style={styles.verifyingRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.verifyingText}>Verifying MPIN...</Text>
            </View>
          ) : errorMessage ? (
            <View style={styles.errorPill}>
              <Ionicons name="alert-circle" size={15} color="#DC2626" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <Pressable onPress={() => void signOut()} style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutPressed]}>
            <Ionicons name="log-out-outline" size={15} color="#DC2626" />
            <Text style={styles.logoutText}>Sign Out / Switch Account</Text>
          </Pressable>
        </SurfaceCard>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 17, 43, 0.72)',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
  },
  iconWrap: {
    width: 68,
    height: 68,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    marginBottom: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  title: {
    fontFamily: fontFamily.heading,
    fontSize: 22,
    color: '#0F172A',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 19,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 12,
  },
  verifyingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
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
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    marginVertical: 4,
  },
  errorText: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 12,
    color: '#DC2626',
    textAlign: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  logoutPressed: {
    opacity: 0.7,
  },
  logoutText: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 13,
    color: '#DC2626',
  },
});
