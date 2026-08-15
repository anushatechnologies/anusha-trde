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

export const NumericKeypad: React.FC<NumericKeypadProps> = ({
  onKeyPress,
  onBackspace,
  onBiometricPress,
  showBiometric = false,
}) => {
  const keypadRows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['biometric', '0', 'backspace'],
  ];

  return (
    <View style={styles.container}>
      {keypadRows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((item) => {
            if (item === 'biometric') {
              return showBiometric && onBiometricPress ? (
                <Pressable
                  key={item}
                  onPress={onBiometricPress}
                  style={({ pressed }) => [styles.keyButton, styles.specialKey, pressed && styles.keyPressed]}
                >
                  <MaterialCommunityIcons name="face-recognition" size={24} color={colors.primary} />
                </Pressable>
              ) : (
                <View key={item} style={styles.keyButtonEmpty} />
              );
            }

            if (item === 'backspace') {
              return (
                <Pressable
                  key={item}
                  onPress={onBackspace}
                  style={({ pressed }) => [styles.keyButton, styles.specialKey, pressed && styles.keyPressed]}
                >
                  <Ionicons name="backspace-outline" size={24} color={colors.text} />
                </Pressable>
              );
            }

            return (
              <Pressable
                key={item}
                onPress={() => onKeyPress(item)}
                style={({ pressed }) => [styles.keyButton, pressed && styles.keyPressed]}
              >
                <Text style={styles.keyText}>{item}</Text>
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
    gap: 12,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  keyButton: {
    flex: 1,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  keyButtonEmpty: {
    flex: 1,
    height: 60,
  },
  specialKey: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E5E7EB',
  },
  keyPressed: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
    transform: [{ scale: 0.94 }],
  },
  keyText: {
    fontFamily: fontFamily.heading,
    fontSize: 22,
    color: colors.text,
  },
});



