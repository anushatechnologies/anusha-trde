import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { colors, gradients, radius, shadows } from '../../constants/theme';

type SurfaceCardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  gradient?: readonly [string, string] | readonly [string, string, string];
  glass?: boolean;
};

export const SurfaceCard = ({ children, style, gradient, glass = false }: SurfaceCardProps) => {
  if (gradient) {
    return (
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.card, style]}>
        {children}
      </LinearGradient>
    );
  }

  return <View style={[styles.card, glass && styles.glassCard, style]}>{children}</View>;
};

export const gradientSets = gradients;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.92)',
    padding: 18,
    gap: 14,
    ...shadows.card,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.52)',
    borderColor: 'rgba(255,255,255,0.28)',
  },
});
