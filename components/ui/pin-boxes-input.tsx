import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  ViewStyle,
} from 'react-native';
import { colors, fontFamily, radius, shadows } from '../../constants/theme';

export type PinBoxesInputProps = {
  value: string;
  onChangeText: (value: string) => void;
  length?: number;
  secureTextEntry?: boolean;
  onComplete?: (code: string) => void;
  autoFocus?: boolean;
  style?: ViewStyle;
};

export const PinBoxesInput: React.FC<PinBoxesInputProps> = ({
  value,
  onChangeText,
  length = 4,
  secureTextEntry = true,
  onComplete,
  autoFocus = true,
  style,
}) => {
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [showPin, setShowPin] = useState(!secureTextEntry);

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
      {/* Hidden Invisible Input capturing native keyboard */}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChangeText}
        keyboardType="number-pad"
        maxLength={length}
        autoFocus={autoFocus}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={styles.hiddenInput}
        caretHidden
      />

      {/* Visual PIN Boxes Grid */}
      <Pressable onPress={handlePress} style={[styles.boxesRow, isSixDigit && styles.boxesRowSix]}>
        {Array.from({ length }).map((_, index) => {
          const digit = digits[index] || '';
          const isBoxActive = isFocused && (index === digits.length || (index === length - 1 && digits.length === length));
          const isFilled = digit !== '';

          return (
            <View
              key={index}
              style={[
                styles.box,
                isSixDigit && styles.boxSix,
                isFilled ? styles.boxFilled : null,
                isBoxActive ? styles.boxActive : null,
              ]}
            >
              {isFilled ? (
                showPin ? (
                  <Text style={[styles.digitText, isSixDigit && styles.digitTextSix]}>{digit}</Text>
                ) : (
                  <View style={[styles.bulletDot, isSixDigit && styles.bulletDotSix]} />
                )
              ) : isBoxActive ? (
                <View style={styles.activeCursor} />
              ) : null}
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
          <Ionicons name={showPin ? 'eye-off-outline' : 'eye-outline'} size={16} color={colors.cyan} />
          <Text style={styles.eyeBtnText}>{showPin ? 'Hide Code' : 'Show Code'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  outerWrap: {
    width: '100%',
    alignItems: 'center',
    marginVertical: 8,
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
  boxesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  boxesRowSix: {
    gap: 8,
  },
  box: {
    width: 60,
    height: 64,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  boxSix: {
    width: 48,
    height: 56,
    borderRadius: radius.sm,
  },
  boxFilled: {
    borderColor: '#2563EB',
    backgroundColor: '#F8FAFC',
  },
  boxActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
    borderWidth: 2,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  digitText: {
    fontFamily: fontFamily.heading,
    fontSize: 26,
    color: '#111827',
  },
  digitTextSix: {
    fontSize: 22,
  },
  bulletDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.cyan,
  },
  bulletDotSix: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  activeCursor: {
    width: 2,
    height: 22,
    backgroundColor: colors.cyan,
    borderRadius: 1,
  },
  eyeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.22)',
  },
  eyeBtnPressed: {
    opacity: 0.8,
  },
  eyeBtnText: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    color: colors.cyan,
  },
});



