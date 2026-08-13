import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, fontFamily, gradients } from '../../constants/theme';
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
      <View style={[styles.glassWrapper, { width: containerWidth, marginBottom: bottomPadding }]}>
        {Platform.OS === 'ios' || Platform.OS === 'android' ? (
          <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFillObject} />
        ) : null}

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
                    <LinearGradient
                      colors={[colors.primary, '#60A5FA']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.activeDot}
                    />
                  </View>
                ) : (
                  <View style={styles.activeDotPlaceholder} />
                )}

                {/* Icon Tile */}
                {isFocused ? (
                  <LinearGradient
                    colors={gradients.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.iconTileActive, isCompact && styles.iconTileCompact]}
                  >
                    <IconComp name={meta.activeIcon as any} size={isCompact ? 18 : 20} color={colors.surface} />
                  </LinearGradient>
                ) : (
                  <View style={[styles.iconTileInactive, isCompact && styles.iconTileCompact]}>
                    <IconComp name={meta.inactiveIcon as any} size={isCompact ? 18 : 20} color="#64748B" />
                  </View>
                )}

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
  glassWrapper: {
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: Platform.OS === 'web' ? 'rgba(255, 255, 255, 0.88)' : 'rgba(255, 255, 255, 0.82)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 12,
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
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  tabItemActive: {
    backgroundColor: 'rgba(238, 242, 255, 0.65)',
  },
  tabItemPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.94 }],
  },
  activeDotContainer: {
    height: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  activeDotPlaceholder: {
    height: 4,
    marginBottom: 2,
  },
  activeDot: {
    width: 14,
    height: 3.5,
    borderRadius: 2,
  },
  iconTileActive: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  iconTileInactive: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconTileCompact: {
    width: 34,
    height: 34,
    borderRadius: 12,
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
    color: colors.primary,
    letterSpacing: 0.2,
  },
  labelInactive: {
    color: '#64748B',
  },
});
