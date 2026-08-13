import { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  ScrollViewProps,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { Edge, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../../constants/theme';
import { useResponsive } from '../../utils/responsive';

type AppScreenProps = {
  children: ReactNode;
  scrollable?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: ViewStyle;
  backgroundColor?: string;
  fullBleed?: boolean;
  contentBottomInset?: number;
  keyboardVerticalOffset?: number;
  safeAreaEdges?: Edge[];
  scrollViewProps?: Omit<ScrollViewProps, 'contentContainerStyle'>;
};

export const AppScreen = ({
  children,
  scrollable = true,
  refreshing,
  onRefresh,
  contentStyle,
  backgroundColor,
  fullBleed = false,
  contentBottomInset = 0,
  keyboardVerticalOffset = 0,
  safeAreaEdges = ['top', 'left', 'right'],
  scrollViewProps,
}: AppScreenProps) => {
  const { horizontalPadding } = useResponsive();
  const insets = useSafeAreaInsets();
  const bottomSpacing = Math.max(insets.bottom + 118, 138);
  const baseContentStyle: ViewStyle = {
    flexGrow: 1,
    paddingHorizontal: fullBleed ? 0 : horizontalPadding,
    paddingBottom: fullBleed ? contentBottomInset : bottomSpacing + contentBottomInset,
    paddingTop: fullBleed ? 0 : 12,
    gap: fullBleed ? 0 : 18,
  };
  const safeAreaStyle = [styles.safeArea, backgroundColor ? { backgroundColor } : null];

  if (!scrollable) {
    return (
      <SafeAreaView style={safeAreaStyle} edges={safeAreaEdges}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={keyboardVerticalOffset}
        >
          <View style={[baseContentStyle, { flex: 1 }, contentStyle]}>{children}</View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={safeAreaStyle} edges={safeAreaEdges}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={keyboardVerticalOffset}
      >
        <ScrollView
          contentContainerStyle={[baseContentStyle, contentStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps={scrollViewProps?.keyboardShouldPersistTaps ?? 'handled'}
          keyboardDismissMode={scrollViewProps?.keyboardDismissMode ?? (Platform.OS === 'ios' ? 'interactive' : 'on-drag')}
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={Boolean(refreshing)} onRefresh={onRefresh} tintColor={colors.primary} />
            ) : undefined
          }
          {...scrollViewProps}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
