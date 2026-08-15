import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fontFamily, gradients, shadows } from '../../constants/theme';
import { useResponsive } from '../../utils/responsive';

const tabMeta = {
  index: {
    label: 'Home',
    activeIcon: 'home',
    inactiveIcon: 'home-outline',
    IconComponent: Ionicons,
  },
  invest: {
    label: 'Invest',
    activeIcon: 'analytics',
    inactiveIcon: 'analytics-outline',
    IconComponent: Ionicons,
  },
  team: {
    label: 'Team',
    activeIcon: 'people',
    inactiveIcon: 'people-outline',
    IconComponent: Ionicons,
  },
  wallet: {
    label: 'Wallet',
    activeIcon: 'wallet',
    inactiveIcon: 'wallet-outline',
    IconComponent: MaterialCommunityIcons,
  },
  profile: {
    label: 'Profile',
    activeIcon: 'person',
    inactiveIcon: 'person-outline',
    IconComponent: Ionicons,
  },
};

export const FloatingTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();
  const { width } = useResponsive();
  const isCompact = width < 390;
  const horizontalMargin = width >= 768 ? 32 : 16;
  const containerWidth = Math.min(width - horizontalMargin * 2, 680);
  const bottomPadding = Math.max(insets.bottom, 12);

  return (
    <View pointerEvents="box-none" style={styles.outerContainer}>
      <View style={[styles.barWrapper, { width: containerWidth, marginBottom: bottomPadding }]}>
        <View style={styles.tabBarContent}>
          {state.routes.map((route, index) => {
            const descriptor = descriptors[route.key];
            const isFocused = state.index === index;
            const meta = tabMeta[route.name as keyof typeof tabMeta] || {
              label: route.name,
              activeIcon: 'square',
              inactiveIcon: 'square-outline',
              IconComponent: Ionicons,
            };

            const IconComp = meta.IconComponent;

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, route.params);
              }
            };

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                style={({ pressed }) => [
                  styles.tabItem,
                  isFocused ? styles.tabItemActive : null,
                  pressed && styles.tabItemPressed,
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: isFocused }}
                accessibilityLabel={descriptor.options.title || meta.label}
              >
                {/* Active Indicator Bar at Top */}
                {isFocused ? (
                  <View style={styles.activeDotContainer}>
                    <View style={styles.activeDot} />
                  </View>
                ) : (
                  <View style={styles.activeDotPlaceholder} />
                )}

                {/* Icon Tile */}
                <View style={[styles.iconTile, isFocused && styles.iconTileActive, isCompact && styles.iconTileCompact]}>
                  <IconComp
                    name={(isFocused ? meta.activeIcon : meta.inactiveIcon) as any}
                    size={isCompact ? 20 : 22}
                    color={isFocused ? '#2563EB' : '#6B7280'}
                  />
                </View>

                {/* Tab Label */}
                <Text
                  style={[
                    styles.label,
                    isCompact && styles.labelCompact,
                    isFocused ? styles.labelActive : styles.labelInactive,
                  ]}
                  numberOfLines={1}
                >
                  {descriptor.options.title || meta.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    ...shadows.card,
  },
  tabBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    borderRadius: 16,
    gap: 3,
  },
  tabItemActive: {
    backgroundColor: '#EFF6FF',
  },
  tabItemPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.95 }],
  },
  activeDotContainer: {
    height: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  activeDotPlaceholder: {
    height: 3,
    marginBottom: 2,
  },
  activeDot: {
    width: 14,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#2563EB',
  },
  iconTile: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconTileActive: {
    backgroundColor: 'transparent',
  },
  iconTileCompact: {
    width: 32,
    height: 32,
  },
  label: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    textAlign: 'center',
  },
  labelCompact: {
    fontSize: 10,
  },
  labelActive: {
    fontFamily: fontFamily.bodyBold,
    color: '#2563EB',
    letterSpacing: 0.1,
  },
  labelInactive: {
    color: '#6B7280',
  },
});
