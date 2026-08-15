import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { colors, fontFamily, radius, shadows } from '../../constants/theme';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  onBackPress?: () => void;
  onRightPress?: () => void;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  rightBadge?: boolean;
};

export const ScreenHeader = ({
  title,
  subtitle,
  onBackPress,
  onRightPress,
  rightIcon = 'notifications-outline',
  rightBadge = false,
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
              <Ionicons name="chevron-back" size={20} color="#374151" />
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
            style={({ pressed }) => [styles.iconButton, pressed && styles.iconButtonPressed]}
            accessibilityRole="button"
            accessibilityLabel="Open header action"
          >
            <Ionicons name={rightIcon} size={18} color="#374151" />
            {rightBadge ? <View style={styles.badgeDot} /> : null}
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 6,
    paddingTop: Platform.OS === 'android' ? 4 : 0,
    marginBottom: 6,
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
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.soft,
  },
  iconButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
    backgroundColor: '#F8FAFC',
  },
  badgeDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#DC2626',
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
    color: '#111827',
    letterSpacing: -0.3,
  },
  titleCompact: {
    fontSize: 20,
    lineHeight: 26,
  },
  subtitle: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 18,
    color: '#6B7280',
  },
  subtitleCompact: {
    fontSize: 12,
    lineHeight: 16,
  },
});
