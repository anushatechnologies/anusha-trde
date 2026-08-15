import { Ionicons } from '@expo/vector-icons';
import { ReactNode, useState } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';

import { colors, fontFamily, radius, shadows } from '../../constants/theme';

type InputFieldProps = TextInputProps & {
  label: string;
  icon?: ReactNode;
  prefix?: ReactNode;
  prefixText?: string;
  trailing?: ReactNode;
  secure?: boolean;
  required?: boolean;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  shellStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
};

export const InputField = ({
  label,
  icon,
  prefix,
  prefixText,
  trailing,
  secure = false,
  required = false,
  error,
  containerStyle,
  labelStyle,
  shellStyle,
  inputStyle,
  onFocus,
  onBlur,
  ...props
}: InputFieldProps) => {
  const [hidden, setHidden] = useState(secure);
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.group, containerStyle]}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, labelStyle]}>
          {label}
          {required ? <Text style={styles.requiredMark}> *</Text> : null}
        </Text>
      </View>

      <View
        style={[
          styles.shell,
          isFocused && styles.shellFocused,
          Boolean(error) && styles.shellError,
          shellStyle,
        ]}
      >
        {icon ? <View style={styles.icon}>{icon}</View> : null}
        {prefixText ? (
          <View style={styles.prefixWrap}>
            <Text style={styles.prefixText}>{prefixText}</Text>
            <View style={styles.prefixDivider} />
          </View>
        ) : prefix ? (
          prefix
        ) : null}

        <TextInput
          placeholderTextColor="rgba(148, 163, 184, 0.65)"
          autoCapitalize="none"
          style={[styles.input, inputStyle]}
          secureTextEntry={hidden}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />

        {secure ? (
          <Pressable onPress={() => setHidden((value) => !value)} style={styles.icon} hitSlop={10}>
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={19} color={colors.textSecondary} />
          </Pressable>
        ) : trailing ? (
          <View style={styles.icon}>{trailing}</View>
        ) : null}
      </View>

      {error ? (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={13} color={colors.danger} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  group: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 13,
    color: '#E2E8F0',
  },
  requiredMark: {
    color: colors.cyan,
  },
  shell: {
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
  },
  shellFocused: {
    borderColor: colors.cyan,
    backgroundColor: '#131F37',
    ...shadows.glow,
  },
  shellError: {
    borderColor: colors.danger,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  icon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefixWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prefixText: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 14,
    color: '#FFFFFF',
  },
  prefixDivider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  input: {
    flex: 1,
    fontFamily: fontFamily.body,
    fontSize: 15,
    color: '#FFFFFF',
    minHeight: 54,
    paddingVertical: 0,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  errorText: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    color: colors.dangerLight,
  },
});
