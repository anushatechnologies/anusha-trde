import { ReactNode } from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

type FadeInViewProps = {
  children: ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
};

export const FadeInView = ({ children, delay = 0, style }: FadeInViewProps) => (
  <Animated.View entering={FadeInDown.delay(delay).springify().damping(18)} style={style}>
    {children}
  </Animated.View>
);
