import { useEffect, useState } from 'react';
import { Image, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, fontFamily, gradients } from '../../constants/theme';
import { getInitials } from '../../utils/format';

type ProfileAvatarProps = {
  name: string;
  photoUrl?: string;
  size?: number;
  borderRadius?: number;
  variant?: 'soft' | 'gradient';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export const ProfileAvatar = ({
  name,
  photoUrl,
  size = 52,
  borderRadius = 16,
  variant = 'soft',
  style,
  textStyle,
}: ProfileAvatarProps) => {
  const normalizedPhotoUrl = photoUrl?.trim();
  const [showImage, setShowImage] = useState(Boolean(normalizedPhotoUrl));

  useEffect(() => {
    setShowImage(Boolean(normalizedPhotoUrl));
  }, [normalizedPhotoUrl]);

  const containerStyle = {
    width: size,
    height: size,
    borderRadius,
  };
  const fallbackTextSize = Math.max(Math.round(size * 0.36), 16);
  const initials = getInitials(name);

  if (showImage && normalizedPhotoUrl) {
    return (
      <View style={[styles.base, containerStyle, style]}>
        <Image source={{ uri: normalizedPhotoUrl }} style={styles.image} resizeMode="cover" onError={() => setShowImage(false)} />
      </View>
    );
  }

  if (variant === 'gradient') {
    return (
      <LinearGradient colors={gradients.primary} style={[styles.base, containerStyle, style]}>
        <Text style={[styles.gradientText, { fontSize: fallbackTextSize }, textStyle]}>{initials}</Text>
      </LinearGradient>
    );
  }

  return (
    <View style={[styles.base, styles.softBase, containerStyle, style]}>
      <Text style={[styles.softText, { fontSize: fallbackTextSize }, textStyle]}>{initials}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  softBase: {
    backgroundColor: '#EEF2FF',
  },
  softText: {
    fontFamily: fontFamily.headingSemi,
    color: colors.primary,
  },
  gradientText: {
    fontFamily: fontFamily.headingSemi,
    color: colors.surface,
  },
});
