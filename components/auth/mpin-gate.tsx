import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, fontFamily, gradients, radius } from '../../constants/theme';
import { authService } from '../../services/auth.service';
import { getAuthErrorMessage } from '../../services/firebase-auth.service';
import { useAuthStore } from '../../store/use-auth-store';
import { GradientButton } from '../ui/gradient-button';
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

  useEffect(() => {
    if (!requiresMpinVerification) {
      setMpin('');
    }
  }, [requiresMpinVerification]);

  const verifyMpin = async () => {
    if (!user) {
      return;
    }

    if (!new RegExp(`^\\d{${MPIN_LENGTH}}$`).test(mpin.trim())) {
      Alert.alert('Invalid MPIN', 'Enter your 4 digit MPIN to open the dashboard.');
      return;
    }

    if (!accessToken) {
      Alert.alert('Session expired', 'Please sign in again before verifying your MPIN.');
      return;
    }

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
        mpin
      );

      await setTokens(verifiedSession.tokens);
      markMpinVerified();
      setMpin('');
    } catch (error) {
      Alert.alert('Incorrect MPIN', getAuthErrorMessage(error));
    }
  };

  return (
    <Modal visible={requiresMpinVerification} transparent animationType="fade" onRequestClose={() => undefined}>
      <View style={styles.overlay}>
        <View style={styles.backdrop} />
        <SurfaceCard style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="shield-checkmark-outline" size={28} color={colors.surface} />
          </View>
          <Text style={styles.title}>Enter MPIN</Text>
          <Text style={styles.subtitle}>For extra security, enter your MPIN before accessing the dashboard.</Text>
          <View style={styles.inputShell}>
            <TextInput
              value={mpin}
              onChangeText={(value) => setMpin(value.replace(/\D/g, '').slice(0, MPIN_LENGTH))}
              keyboardType="number-pad"
              maxLength={MPIN_LENGTH}
              secureTextEntry
              placeholder="Enter MPIN"
              placeholderTextColor={colors.muted}
              style={styles.input}
            />
          </View>
          <GradientButton label="Verify MPIN" onPress={() => void verifyMpin()} />
          <Pressable onPress={() => void signOut()} style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutPressed]}>
            <Text style={styles.logoutText}>Logout</Text>
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
    padding: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8, 17, 43, 0.58)',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    gap: 18,
    paddingTop: 24,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: gradients.primary[0],
  },
  title: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 24,
    color: colors.text,
  },
  subtitle: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    lineHeight: 22,
    color: colors.muted,
    textAlign: 'center',
  },
  inputShell: {
    width: '100%',
    minHeight: 56,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  input: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 18,
    color: colors.text,
    letterSpacing: 4,
    textAlign: 'center',
  },
  logoutButton: {
    paddingVertical: 6,
  },
  logoutPressed: {
    opacity: 0.8,
  },
  logoutText: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 14,
    color: colors.danger,
  },
});
