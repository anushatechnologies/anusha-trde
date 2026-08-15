import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { colors, gradients, radius, shadows } from '../../constants/theme';

type SurfaceCardProps = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  gradient?: readonly [string, string] | readonly [string, string, string];
  glass?: boolean | 'dark' | 'light';
};

export const SurfaceCard = ({ children, style, gradient, glass }: SurfaceCardProps) => {
  if (gradient) {
    return (
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.card, styles.gradientCard, style]}>
        {children}
      </LinearGradient>
    );
  }

  if (glass === 'light') {
    return (
      <View style={[styles.card, styles.lightCard, style]}>
        {children}
      </View>
    );
  }

  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
};

export const gradientSets = gradients;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 18,
    gap: 14,
    overflow: 'hidden',
    ...shadows.card,
  },
  gradientCard: {
    borderWidth: 0,
  },
  lightCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E5E7EB',
  },
});
