import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors, fontFamily, gradients, radius, shadows } from '../../constants/theme';

type GradientButtonProps = {
  label: string;
  onPress?: () => void;
  icon?: ReactNode;
  iconPosition?: 'start' | 'end';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'profit' | 'glass';
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
  disabled?: boolean;
  loading?: boolean;
};

export const GradientButton = ({
  label,
  onPress,
  icon,
  iconPosition = 'start',
  variant = 'primary',
  style,
  compact = false,
  disabled = false,
  loading = false,
}: GradientButtonProps) => {
  const sizeStyles = compact ? styles.compact : undefined;
  const isInteractive = !disabled && !loading;

  if (loading) {
    const spinnerColor =
      variant === 'secondary' || variant === 'ghost' || variant === 'outline' ? colors.cyan : colors.surface;

    return (
      <View style={[styles.wrap, style]}>
        <LinearGradient
          colors={variant === 'secondary' || variant === 'ghost' ? ['#131F37', '#0F172A'] : gradients.primary}
          style={[styles.primary, sizeStyles, styles.loadingState]}
        >
          <ActivityIndicator size="small" color={spinnerColor} />
          <Text style={styles.loadingLabel}>{label}</Text>
        </LinearGradient>
      </View>
    );
  }

  const resolvedIcon =
    icon ?? (variant === 'primary' ? <Ionicons name="arrow-forward" size={18} color="#FFFFFF" /> : null);

  const renderContent = (textColor: string) => (
    <View style={styles.contentRow}>
      {iconPosition === 'start' && resolvedIcon}
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      {iconPosition === 'end' && resolvedIcon}
    </View>
  );

  if (variant === 'secondary') {
    return (
      <Pressable
        onPress={isInteractive ? onPress : undefined}
        style={({ pressed }) => [styles.wrap, pressed && isInteractive && styles.pressed, disabled && styles.disabledWrap, style]}
      >
        <View style={[styles.secondary, sizeStyles]}>{renderContent(colors.cyan)}</View>
      </Pressable>
    );
  }

  if (variant === 'outline') {
    return (
      <Pressable
        onPress={isInteractive ? onPress : undefined}
        style={({ pressed }) => [styles.wrap, pressed && isInteractive && styles.pressed, disabled && styles.disabledWrap, style]}
      >
        <View style={[styles.outline, sizeStyles]}>{renderContent('#FFFFFF')}</View>
      </Pressable>
    );
  }

  if (variant === 'glass') {
    return (
      <Pressable
        onPress={isInteractive ? onPress : undefined}
        style={({ pressed }) => [styles.wrap, pressed && isInteractive && styles.pressed, disabled && styles.disabledWrap, style]}
      >
        <LinearGradient
          colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.03)']}
          style={[styles.glassBtn, sizeStyles]}
        >
          {renderContent('#FFFFFF')}
        </LinearGradient>
      </Pressable>
    );
  }

  if (variant === 'profit') {
    return (
      <Pressable
        onPress={isInteractive ? onPress : undefined}
        style={({ pressed }) => [styles.wrap, pressed && isInteractive && styles.pressed, disabled && styles.disabledWrap, style]}
      >
        <LinearGradient colors={gradients.emeraldProfit} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.primary, sizeStyles]}>
          {renderContent('#FFFFFF')}
        </LinearGradient>
      </Pressable>
    );
  }

  if (variant === 'danger') {
    return (
      <Pressable
        onPress={isInteractive ? onPress : undefined}
        style={({ pressed }) => [styles.wrap, pressed && isInteractive && styles.pressed, disabled && styles.disabledWrap, style]}
      >
        <LinearGradient colors={['#EF4444', '#DC2626']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.primary, sizeStyles]}>
          {renderContent('#FFFFFF')}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={isInteractive ? onPress : undefined}
      style={({ pressed }) => [styles.wrap, pressed && isInteractive && styles.pressed, disabled && styles.disabledWrap, style]}
    >
      <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.primary, sizeStyles]}>
        {renderContent('#FFFFFF')}
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primary: {
    minHeight: 54,
    paddingHorizontal: 20,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glow,
  },
  secondary: {
    minHeight: 54,
    paddingHorizontal: 20,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  outline: {
    minHeight: 54,
    paddingHorizontal: 20,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  glassBtn: {
    minHeight: 54,
    paddingHorizontal: 20,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  compact: {
    minHeight: 46,
    paddingHorizontal: 14,
  },
  label: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 15,
    letterSpacing: 0.2,
  },
  loadingState: {
    flexDirection: 'row',
    gap: 10,
    opacity: 0.88,
  },
  loadingLabel: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 14,
    color: colors.surface,
  },
  pressed: {
    transform: [{ scale: 0.975 }],
    opacity: 0.92,
  },
  disabledWrap: {
    opacity: 0.45,
  },
});
