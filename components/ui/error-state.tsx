import { Ionicons } from '@expo/vector-icons';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors, fontFamily, radius } from '../../constants/theme';
import { GradientButton } from './gradient-button';
import { SurfaceCard } from './surface-card';

type ErrorStateProps = {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export const ErrorState = ({
  title = 'Unable to Load Data',
  message = 'Please check your internet connection or try again shortly.',
  onRetry,
  retryLabel = 'Try Again',
  style,
}: ErrorStateProps) => {
  return (
    <SurfaceCard glass="dark" style={[styles.card, style]}>
      <View style={styles.iconTile}>
        <Ionicons name="cloud-offline-outline" size={32} color={colors.dangerLight} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
      {onRetry ? (
        <GradientButton
          label={retryLabel}
          onPress={onRetry}
          compact
          variant="secondary"
          icon={<Ionicons name="refresh-outline" size={16} color={colors.cyan} />}
          style={styles.btn}
        />
      ) : null}
    </SurfaceCard>
  );
};

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 22,
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.22)',
    borderRadius: radius.lg,
  },
  iconTile: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    alignItems: 'center',
    gap: 6,
    maxWidth: 300,
  },
  title: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 17,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  message: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  btn: {
    marginTop: 4,
    minWidth: 140,
  },
});
