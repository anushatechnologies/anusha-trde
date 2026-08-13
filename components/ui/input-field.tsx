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
import { Ionicons } from '@expo/vector-icons';

import { colors, fontFamily, radius } from '../../constants/theme';

type InputFieldProps = TextInputProps & {
  label: string;
  icon?: ReactNode;
  prefix?: ReactNode;
  prefixText?: string;
  trailing?: ReactNode;
  secure?: boolean;
  required?: boolean;
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
  containerStyle,
  labelStyle,
  shellStyle,
  inputStyle,
  ...props
}: InputFieldProps) => {
  const [hidden, setHidden] = useState(secure);

  return (
    <View style={[styles.group, containerStyle]}>
      <Text style={[styles.label, labelStyle]}>
        {label}
        {required ? <Text style={styles.requiredMark}> *</Text> : null}
      </Text>
      <View style={[styles.shell, shellStyle]}>
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
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          style={[styles.input, inputStyle]}
          secureTextEntry={hidden}
          {...props}
        />
        {secure ? (
          <>
            {trailing ? <View style={styles.icon}>{trailing}</View> : null}
            <Pressable onPress={() => setHidden((value) => !value)} style={styles.icon}>
              <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={18} color={colors.muted} />
            </Pressable>
          </>
        ) : trailing ? (
          <View style={styles.icon}>{trailing}</View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  group: {
    gap: 8,
  },
  label: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 13,
    color: colors.text,
  },
  requiredMark: {
    color: colors.danger,
  },
  shell: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
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
    color: colors.text,
  },
  prefixDivider: {
    width: 1,
    height: 18,
    backgroundColor: '#CBD5E1',
  },
  input: {
    flex: 1,
    fontFamily: fontFamily.body,
    fontSize: 15,
    color: colors.text,
    minHeight: 56,
    paddingVertical: 0,
  },
});
