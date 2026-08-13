import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { colors, fontFamily, gradients, radius } from '../../constants/theme';
import { authService } from '../../services/auth.service';
import { getAuthErrorMessage } from '../../services/firebase-auth.service';
import { mpinService } from '../../services/mpin.service';
import { useAuthStore } from '../../store/use-auth-store';
import { AppScreen } from '../ui/app-screen';
import { GradientButton } from '../ui/gradient-button';
import { PinBoxesInput } from '../ui/pin-boxes-input';
import { ScreenHeader } from '../ui/screen-header';
import { SurfaceCard } from '../ui/surface-card';

const MPIN_LENGTH = 4;
const simpleMpins = new Set(['0000', '1111', '1234', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999']);
const normalizeDigits = (value: string) => value.replace(/\D/g, '').slice(0, MPIN_LENGTH);

const isSequentialMpin = (value: string) => {
  if (value.length < 4) {
    return false;
  }

  const digits = value.split('').map((digit) => Number(digit));
  const isAscending = digits.every((digit, index) => index === 0 || digit === digits[index - 1] + 1);
  const isDescending = digits.every((digit, index) => index === 0 || digit === digits[index - 1] - 1);

  return isAscending || isDescending;
};

export const MpinManagementScreen = () => {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const setTokens = useAuthStore((state) => state.setTokens);
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const expiresAt = useAuthStore((state) => state.expiresAt);
  const [currentMpin, setCurrentMpin] = useState('');
  const [newMpin, setNewMpin] = useState('');
  const [confirmMpin, setConfirmMpin] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const hasExistingMpin = Boolean(user?.mpinConfigured);
  const title = hasExistingMpin ? 'Reset MPIN' : 'Set MPIN';
  const subtitle = hasExistingMpin
    ? 'Update your MPIN for dashboard access and account security.'
    : 'Create an MPIN so the app can ask for it before opening the dashboard.';

  const validationMessage = useMemo(() => {
    if (!newMpin) {
      return 'Use a 4 digit MPIN.';
    }

    if (!new RegExp(`^\\d{${MPIN_LENGTH}}$`).test(newMpin)) {
      return 'MPIN must be 4 digits.';
    }

    if (simpleMpins.has(newMpin) || isSequentialMpin(newMpin)) {
      return 'Avoid weak MPIN patterns like 1111 or 1234.';
    }

    if (confirmMpin && newMpin !== confirmMpin) {
      return 'New MPIN and confirm MPIN must match.';
    }

    return 'MPIN format looks good.';
  }, [confirmMpin, newMpin]);

  const saveMpin = async () => {
    if (!user || !accessToken) {
      return;
    }

    let session = {
      user,
      tokens: {
        accessToken,
        refreshToken: refreshToken ?? '',
        expiresAt: expiresAt ?? Date.now(),
      },
    };

    if (hasExistingMpin) {
      try {
        const verifiedSession = await authService.verifyMpin(session, currentMpin);
        await setTokens(verifiedSession.tokens);
        session = verifiedSession;
      } catch (error) {
        Alert.alert('Incorrect current MPIN', getAuthErrorMessage(error));
        return;
      }
    }

    if (!new RegExp(`^\\d{${MPIN_LENGTH}}$`).test(newMpin)) {
      Alert.alert('Invalid MPIN', 'Create a 4 digit MPIN.');
      return;
    }

    if (simpleMpins.has(newMpin) || isSequentialMpin(newMpin)) {
      Alert.alert('Weak MPIN', 'Avoid simple MPIN patterns such as 1111, 1234, or consecutive sequences.');
      return;
    }

    if (newMpin !== confirmMpin) {
      Alert.alert('MPIN mismatch', 'Make sure the new MPIN and confirm MPIN match.');
      return;
    }

    setIsSaving(true);

    try {
      const nextSession = await authService.setMpin(session, newMpin);
      await mpinService.saveMpinForAccount({
        email: user.email,
        mobile: user.mobile,
        mpin: newMpin,
      });
      await updateUser(nextSession.user);
      Alert.alert(hasExistingMpin ? 'MPIN updated' : 'MPIN created', hasExistingMpin ? 'Your MPIN has been reset successfully.' : 'Your MPIN is now ready for dashboard security.');
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/security-center');
      }
    } catch (error) {
      Alert.alert('MPIN update failed', getAuthErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <AppScreen>
        <ScreenHeader title="Manage MPIN" subtitle="Sign in again to manage your MPIN." onBackPress={() => (router.canGoBack() ? router.back() : router.replace('/security-center'))} />
      </AppScreen>
    );
  }

  return (
    <AppScreen contentStyle={styles.screen}>
      <ScreenHeader title={title} subtitle={subtitle} onBackPress={() => (router.canGoBack() ? router.back() : router.replace('/security-center'))} />

      <SurfaceCard gradient={gradients.primary}>
        <Text style={styles.heroTitle}>{hasExistingMpin ? 'Change your security code' : 'Protect dashboard access'}</Text>
        <Text style={styles.heroSubtitle}>{hasExistingMpin ? 'Your new MPIN will be required after future logins before the dashboard opens.' : 'Once saved, the app can require MPIN verification before showing the dashboard.'}</Text>
      </SurfaceCard>

      <SurfaceCard>
        {hasExistingMpin ? (
          <View style={styles.inputSection}>
            <Text style={styles.fieldLabel}>Current MPIN</Text>
            <PinBoxesInput
              value={currentMpin}
              onChangeText={(val) => setCurrentMpin(normalizeDigits(val))}
              length={MPIN_LENGTH}
              autoFocus={false}
            />
          </View>
        ) : null}

        <View style={styles.inputSection}>
          <Text style={styles.fieldLabel}>New MPIN</Text>
          <PinBoxesInput
            value={newMpin}
            onChangeText={(val) => setNewMpin(normalizeDigits(val))}
            length={MPIN_LENGTH}
            autoFocus={!hasExistingMpin}
          />
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.fieldLabel}>Confirm MPIN</Text>
          <PinBoxesInput
            value={confirmMpin}
            onChangeText={(val) => setConfirmMpin(normalizeDigits(val))}
            length={MPIN_LENGTH}
            autoFocus={false}
          />
        </View>

        <View style={styles.noteCard}>
          <Text style={styles.noteTitle}>MPIN rules</Text>
          <Text style={styles.noteText}>Use 4 digits and avoid weak patterns such as 1111, 1234, or simple ascending sequences.</Text>
          <Text style={styles.validationText}>{validationMessage}</Text>
        </View>

        <GradientButton label={isSaving ? 'Saving...' : hasExistingMpin ? 'Reset MPIN' : 'Set MPIN'} onPress={() => void saveMpin()} />
      </SurfaceCard>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  screen: {
    gap: 18,
  },
  heroTitle: {
    fontFamily: fontFamily.heading,
    fontSize: 26,
    lineHeight: 32,
    color: colors.surface,
  },
  heroSubtitle: {
    marginTop: 6,
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.84)',
  },
  inputSection: {
    alignItems: 'center',
    marginBottom: 10,
  },
  fieldLabel: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 13,
    color: colors.text,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  noteCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    backgroundColor: '#F8FAFC',
    padding: 14,
    gap: 6,
    marginVertical: 10,
  },
  noteTitle: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 13,
    color: colors.text,
  },
  noteText: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    lineHeight: 18,
    color: colors.muted,
  },
  validationText: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    lineHeight: 18,
    color: colors.primary,
  },
});
