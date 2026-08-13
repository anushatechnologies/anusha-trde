import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { colors, fontFamily, shadows } from '../../constants/theme';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  onBackPress?: () => void;
  onRightPress?: () => void;
  rightIcon?: keyof typeof Ionicons.glyphMap;
};

export const ScreenHeader = ({
  title,
  subtitle,
  onBackPress,
  onRightPress,
  rightIcon = 'notifications-outline',
}: ScreenHeaderProps) => {
  const { width } = useWindowDimensions();
  const isCompact = width < 390;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.leading}>
          {onBackPress ? (
            <Pressable
              onPress={onBackPress}
              style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={20} color={colors.text} />
            </Pressable>
          ) : null}

          <View style={styles.copyWrap}>
            <Text style={[styles.title, isCompact && styles.titleCompact]} numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={[styles.subtitle, isCompact && styles.subtitleCompact]} numberOfLines={2}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>

        {onRightPress ? (
          <Pressable
            onPress={onRightPress}
            style={({ pressed }) => [styles.iconButton, styles.iconButtonAccent, pressed && styles.iconButtonPressed]}
            accessibilityRole="button"
            accessibilityLabel="Open header action"
          >
            <Ionicons name={rightIcon} size={18} color={colors.primary} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 4,
    paddingTop: Platform.OS === 'android' ? 2 : 0,
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  leading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.95)',
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  iconButtonAccent: {
    backgroundColor: '#F3F7FF',
    borderColor: 'rgba(191, 219, 254, 0.75)',
  },
  iconButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.96 }],
  },
  copyWrap: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  title: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 22,
    lineHeight: 28,
    color: colors.text,
  },
  titleCompact: {
    fontSize: 20,
    lineHeight: 26,
  },
  subtitle: {
    fontFamily: fontFamily.body,
    fontSize: 12.5,
    lineHeight: 17,
    color: colors.muted,
    paddingRight: 4,
  },
  subtitleCompact: {
    fontSize: 11.5,
    lineHeight: 16,
  },
});
