import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';

import { radius } from '../../constants/theme';

type SkeletonBlockProps = {
  height: number;
  width?: number;
  style?: StyleProp<ViewStyle>;
};

export const SkeletonBlock = ({ height, width, style }: SkeletonBlockProps) => {
  const opacity = useSharedValue(0.45);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.45, { duration: 700, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const sizeStyle: ViewStyle = {
    height,
    ...(width ? { width } : null),
  };

  return <Animated.View style={[styles.block, sizeStyle, animatedStyle, style]} />;
};

const styles = StyleSheet.create({
  block: {
    borderRadius: radius.md,
    backgroundColor: '#E2E8F0',
  },
});
