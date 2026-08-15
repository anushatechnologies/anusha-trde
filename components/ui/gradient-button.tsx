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
      variant === 'secondary' || variant === 'ghost' || variant === 'outline' ? colors.primary : '#FFFFFF';

    return (
      <View style={[styles.wrap, style]}>
        <View
          style={[
            styles.primary,
            variant === 'secondary' || variant === 'outline' ? styles.secondary : null,
            sizeStyles,
            styles.loadingState,
          ]}
        >
          <ActivityIndicator size="small" color={spinnerColor} />
          <Text style={[styles.loadingLabel, { color: spinnerColor }]}>{label}</Text>
        </View>
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
        <View style={[styles.secondary, sizeStyles]}>{renderContent('#374151')}</View>
      </Pressable>
    );
  }

  if (variant === 'outline') {
    return (
      <Pressable
        onPress={isInteractive ? onPress : undefined}
        style={({ pressed }) => [styles.wrap, pressed && isInteractive && styles.pressed, disabled && styles.disabledWrap, style]}
      >
        <View style={[styles.outline, sizeStyles]}>{renderContent('#374151')}</View>
      </Pressable>
    );
  }

  if (variant === 'profit') {
    return (
      <Pressable
        onPress={isInteractive ? onPress : undefined}
        style={({ pressed }) => [styles.wrap, pressed && isInteractive && styles.pressed, disabled && styles.disabledWrap, style]}
      >
        <View style={[styles.profitBtn, sizeStyles]}>
          {renderContent('#FFFFFF')}
        </View>
      </Pressable>
    );
  }

  if (variant === 'danger') {
    return (
      <Pressable
        onPress={isInteractive ? onPress : undefined}
        style={({ pressed }) => [styles.wrap, pressed && isInteractive && styles.pressed, disabled && styles.disabledWrap, style]}
      >
        <View style={[styles.dangerBtn, sizeStyles]}>
          {renderContent('#FFFFFF')}
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={isInteractive ? onPress : undefined}
      style={({ pressed }) => [styles.wrap, pressed && isInteractive && styles.pressed, disabled && styles.disabledWrap, style]}
    >
      <View style={[styles.primary, sizeStyles]}>
        {renderContent('#FFFFFF')}
      </View>
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
    minHeight: 52,
    paddingHorizontal: 20,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    ...shadows.soft,
  },
  secondary: {
    minHeight: 52,
    paddingHorizontal: 20,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  outline: {
    minHeight: 52,
    paddingHorizontal: 20,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  profitBtn: {
    minHeight: 52,
    paddingHorizontal: 20,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
  },
  dangerBtn: {
    minHeight: 52,
    paddingHorizontal: 20,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
  },
  compact: {
    minHeight: 44,
    paddingHorizontal: 14,
  },
  label: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 15,
    letterSpacing: 0.1,
  },
  loadingState: {
    flexDirection: 'row',
    gap: 10,
    opacity: 0.88,
  },
  loadingLabel: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 14,
    color: '#FFFFFF',
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.92,
  },
  disabledWrap: {
    opacity: 0.45,
  },
});
