import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import { colors, fontFamily, radius } from '../../constants/theme';

export type PinBoxesInputProps = {
  value: string;
  onChangeText: (value: string) => void;
  length?: number;
  secureTextEntry?: boolean;
  onComplete?: (code: string) => void;
  autoFocus?: boolean;
  hasError?: boolean;
  style?: ViewStyle;
};

export const PinBoxesInput: React.FC<PinBoxesInputProps> = ({
  value,
  onChangeText,
  length = 4,
  secureTextEntry = true,
  onComplete,
  autoFocus = true,
  hasError = false,
  style,
}) => {
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [showPin, setShowPin] = useState(!secureTextEntry);

  useEffect(() => {
    if (autoFocus) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  const handlePress = () => {
    inputRef.current?.focus();
  };

  const handleChangeText = (text: string) => {
    const sanitized = text.replace(/\D/g, '').slice(0, length);
    onChangeText(sanitized);
    if (sanitized.length === length && onComplete) {
      onComplete(sanitized);
    }
  };

  const digits = value.split('');
  const isSixDigit = length === 6;

  return (
    <View style={[styles.outerWrap, style]}>
      {/* Interactive PIN Boxes Area */}
      <Pressable onPress={handlePress} style={[styles.boxesRow, isSixDigit && styles.boxesRowSix]}>
        {/* Hidden Input overlaid across the entire touch surface for native keyboard focus */}
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={handleChangeText}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="sms-otp"
          maxLength={length}
          autoFocus={autoFocus}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={styles.hiddenInput}
          caretHidden
        />

        {Array.from({ length }).map((_, index) => {
          const digit = digits[index] || '';
          const isBoxActive =
            isFocused && (index === digits.length || (index === length - 1 && digits.length === length));
          const isFilled = digit !== '';

          return (
            <View
              key={index}
              style={[
                styles.box,
                isSixDigit && styles.boxSix,
                isFilled ? styles.boxFilled : null,
                isBoxActive ? styles.boxActive : null,
                hasError ? styles.boxError : null,
              ]}
            >
              {isFilled ? (
                showPin ? (
                  <Text style={[styles.digitText, isSixDigit && styles.digitTextSix, hasError && styles.digitTextError]}>
                    {digit}
                  </Text>
                ) : (
                  <View
                    style={[
                      styles.bulletDot,
                      isSixDigit && styles.bulletDotSix,
                      hasError && styles.bulletDotError,
                    ]}
                  />
                )
              ) : isBoxActive ? (
                <View style={[styles.activeCursor, hasError && styles.activeCursorError]} />
              ) : (
                <View style={styles.emptyPlaceholderDot} />
              )}
            </View>
          );
        })}
      </Pressable>

      {/* Toggle Hide/Show Eye Button */}
      {value.length > 0 && secureTextEntry ? (
        <Pressable
          onPress={() => setShowPin((prev) => !prev)}
          style={({ pressed }) => [styles.eyeBtn, pressed && styles.eyeBtnPressed]}
        >
          <Ionicons
            name={showPin ? 'eye-off-outline' : 'eye-outline'}
            size={16}
            color={colors.primary}
          />
          <Text style={styles.eyeBtnText}>{showPin ? 'Hide Digits' : 'Show Digits'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrap: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 12,
  },
  boxesRow: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 8,
    paddingHorizontal: 8,
    minHeight: 80,
  },
  boxesRowSix: {
    gap: 10,
  },
  hiddenInput: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.01,
    color: 'transparent',
  },
  box: {
    width: 66,
    height: 72,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  boxSix: {
    width: 50,
    height: 60,
    borderRadius: 16,
  },
  boxFilled: {
    borderColor: colors.primary,
    backgroundColor: '#F8FAFC',
    borderWidth: 2,
    shadowColor: colors.primary,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  boxActive: {
    borderColor: colors.primary,
    backgroundColor: '#EFF6FF',
    borderWidth: 2.5,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  boxError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
    shadowColor: '#DC2626',
    shadowOpacity: 0.2,
  },
  digitText: {
    fontFamily: fontFamily.heading,
    fontSize: 28,
    color: '#0F172A',
  },
  digitTextSix: {
    fontSize: 22,
  },
  digitTextError: {
    color: '#DC2626',
  },
  bulletDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  bulletDotSix: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  bulletDotError: {
    backgroundColor: '#DC2626',
  },
  emptyPlaceholderDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CBD5E1',
  },
  activeCursor: {
    width: 3,
    height: 28,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  activeCursorError: {
    backgroundColor: '#DC2626',
  },
  eyeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  eyeBtnPressed: {
    opacity: 0.8,
  },
  eyeBtnText: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    color: colors.primary,
  },
});
