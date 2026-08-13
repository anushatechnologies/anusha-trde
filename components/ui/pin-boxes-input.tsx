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
      <Pressable onPress={handlePress} style={styles.boxesRow}>
        {Array.from({ length }).map((_, index) => {
          const digit = digits[index] || '';
          const isBoxActive = isFocused && (index === digits.length || (index === length - 1 && digits.length === length));
          const isFilled = digit !== '';

          return (
            <View
              key={index}
              style={[
                styles.box,
                isFilled ? styles.boxFilled : null,
                isBoxActive ? styles.boxActive : null,
              ]}
            >
              {isFilled ? (
                showPin ? (
                  <Text style={styles.digitText}>{digit}</Text>
                ) : (
                  <View style={styles.bulletDot} />
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
          <Ionicons name={showPin ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.primary} />
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
    gap: 14,
    paddingVertical: 6,
  },
  box: {
    width: 62,
    height: 66,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  boxFilled: {
    borderColor: colors.primary,
    backgroundColor: '#EEF2FF',
  },
  boxActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    borderWidth: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  digitText: {
    fontFamily: fontFamily.heading,
    fontSize: 26,
    color: colors.primary,
  },
  bulletDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.primary,
  },
  activeCursor: {
    width: 2,
    height: 22,
    backgroundColor: colors.primary,
    borderRadius: 1,
  },
  eyeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: '#F1F5F9',
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
