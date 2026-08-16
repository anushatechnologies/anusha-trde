import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontFamily, radius, shadows } from '../../constants/theme';

export type NumericKeypadProps = {
  onKeyPress: (key: string) => void;
  onBackspace: () => void;
  onBiometricPress?: () => void;
  showBiometric?: boolean;
};

type KeyData = {
  digit: string;
  letters?: string;
  type: 'digit' | 'biometric' | 'backspace' | 'empty';
};

const KEYPAD_LAYOUT: KeyData[][] = [
  [
    { digit: '1', type: 'digit' },
    { digit: '2', letters: 'A B C', type: 'digit' },
    { digit: '3', letters: 'D E F', type: 'digit' },
  ],
  [
    { digit: '4', letters: 'G H I', type: 'digit' },
    { digit: '5', letters: 'J K L', type: 'digit' },
    { digit: '6', letters: 'M N O', type: 'digit' },
  ],
  [
    { digit: '7', letters: 'P Q R S', type: 'digit' },
    { digit: '8', letters: 'T U V', type: 'digit' },
    { digit: '9', letters: 'W X Y Z', type: 'digit' },
  ],
  [
    { digit: 'biometric', type: 'biometric' },
    { digit: '0', type: 'digit' },
    { digit: 'backspace', type: 'backspace' },
  ],
];

export const NumericKeypad: React.FC<NumericKeypadProps> = ({
  onKeyPress,
  onBackspace,
  onBiometricPress,
  showBiometric = false,
}) => {
  return (
    <View style={styles.container}>
      {KEYPAD_LAYOUT.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((keyItem, colIndex) => {
            if (keyItem.type === 'biometric') {
              if (showBiometric && onBiometricPress) {
                return (
                  <Pressable
                    key="biometric"
                    onPress={onBiometricPress}
                    style={({ pressed }) => [
                      styles.circleKey,
                      styles.specialCircleKey,
                      pressed && styles.keyPressed,
                    ]}
                  >
                    <MaterialCommunityIcons name="face-recognition" size={26} color={colors.primary} />
                  </Pressable>
                );
              }
              return <View key={`empty-${colIndex}`} style={styles.circleKeyEmpty} />;
            }

            if (keyItem.type === 'backspace') {
              return (
                <Pressable
                  key="backspace"
                  onPress={onBackspace}
                  style={({ pressed }) => [
                    styles.circleKey,
                    styles.specialCircleKey,
                    pressed && styles.keyPressed,
                  ]}
                >
                  <Ionicons name="backspace-outline" size={26} color="#475569" />
                </Pressable>
              );
            }

            return (
              <Pressable
                key={keyItem.digit}
                onPress={() => onKeyPress(keyItem.digit)}
                style={({ pressed }) => [
                  styles.circleKey,
                  pressed && styles.keyPressed,
                ]}
              >
                <Text style={styles.digitText}>{keyItem.digit}</Text>
                {keyItem.letters ? (
                  <Text style={styles.lettersText}>{keyItem.letters}</Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 320,
    gap: 16,
    alignSelf: 'center',
    marginTop: 14,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
  },
  circleKey: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  circleKeyEmpty: {
    width: 68,
    height: 68,
  },
  specialCircleKey: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  keyPressed: {
    backgroundColor: '#EFF6FF',
    borderColor: colors.primary,
    transform: [{ scale: 0.92 }],
    shadowOpacity: 0.15,
    elevation: 5,
  },
  digitText: {
    fontFamily: fontFamily.heading,
    fontSize: 24,
    color: '#0F172A',
    lineHeight: 28,
  },
  lettersText: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 9,
    letterSpacing: 1.2,
    color: '#94A3B8',
    marginTop: -2,
  },
});



