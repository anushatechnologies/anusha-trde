import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors, fontFamily, gradients, radius, shadows } from '../../constants/theme';

type GradientButtonProps = {
  label: string;
  onPress?: () => void;
  icon?: ReactNode;
  iconPosition?: 'start' | 'end';
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
  disabled?: boolean;
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
}: GradientButtonProps) => {
  const sizeStyles = compact ? styles.compact : undefined;
  const resolvedPrimaryIcon = icon ?? <Ionicons name="arrow-forward" size={18} color={colors.surface} />;
  const primaryChildren =
    iconPosition === 'end' ? (
      <>
        <Text style={styles.primaryLabel}>{label}</Text>
        {resolvedPrimaryIcon}
      </>
    ) : (
      <>
        {resolvedPrimaryIcon}
        <Text style={styles.primaryLabel}>{label}</Text>
      </>
    );
  const secondaryChildren =
    iconPosition === 'end' ? (
      <>
        <Text style={[styles.secondaryLabel, variant === 'ghost' && styles.ghostLabel]}>{label}</Text>
        {icon}
      </>
    ) : (
      <>
        {icon}
        <Text style={[styles.secondaryLabel, variant === 'ghost' && styles.ghostLabel]}>{label}</Text>
      </>
    );

  if (variant === 'secondary' || variant === 'ghost') {
    return (
      <Pressable
        onPress={disabled ? undefined : onPress}
        style={({ pressed }) => [styles.wrap, pressed && !disabled && styles.pressed, disabled && styles.disabledWrap, style]}
      >
        <View style={[variant === 'secondary' ? styles.secondary : styles.ghost, sizeStyles]}>
          {secondaryChildren}
        </View>
      </Pressable>
    );
  }

  const colorSet = variant === 'danger' ? ([colors.danger, '#F87171'] as const) : gradients.primary;

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [styles.wrap, pressed && !disabled && styles.pressed, disabled && styles.disabledWrap, style]}
    >
      <LinearGradient colors={colorSet} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.primary, sizeStyles]}>
        {primaryChildren}
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  primary: {
    minHeight: 56,
    paddingHorizontal: 18,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    ...shadows.glow,
  },
  secondary: {
    minHeight: 56,
    paddingHorizontal: 18,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  ghost: {
    minHeight: 56,
    paddingHorizontal: 18,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#EEF2FF',
  },
  compact: {
    minHeight: 48,
  },
  primaryLabel: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 15,
    color: colors.surface,
  },
  secondaryLabel: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 15,
    color: colors.primary,
  },
  ghostLabel: {
    color: colors.secondary,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  disabledWrap: {
    opacity: 0.45,
  },
});
