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

export const SurfaceCard = ({ children, style, gradient, glass = 'dark' }: SurfaceCardProps) => {
  if (gradient) {
    return (
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.card, styles.gradientCard, style]}>
        {children}
      </LinearGradient>
    );
  }

  if (glass === 'light') {
    return (
      <View style={[styles.card, styles.lightGlassCard, style]}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.95)', 'rgba(248, 250, 252, 0.82)']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        {children}
      </View>
    );
  }

  return (
    <View style={[styles.card, styles.darkGlassCard, style]}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.07)', 'rgba(255, 255, 255, 0.02)']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      {children}
    </View>
  );
};

export const gradientSets = gradients;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0F172A',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 18,
    gap: 14,
    overflow: 'hidden',
    ...shadows.glass,
  },
  gradientCard: {
    borderWidth: 0,
  },
  lightGlassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    borderColor: 'rgba(255, 255, 255, 0.65)',
  },
  darkGlassCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
});
