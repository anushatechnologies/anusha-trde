import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { colors, fontFamily, gradients, radius, shadows } from '../../constants/theme';
import { useAppStore } from '../../store/use-app-store';
import { useAuthStore } from '../../store/use-auth-store';
import { AppScreen } from '../ui/app-screen';
import { BrandLogo } from '../ui/brand-logo';
import { GradientButton } from '../ui/gradient-button';
import { SurfaceCard } from '../ui/surface-card';

const onboardingSlides = [
  {
    title: 'Invest Smartly',
    subtitle: 'Track secure returns, wallet balance, and growth insights from one premium dashboard.',
    badge: 'Portfolio intelligence',
    icon: 'analytics-outline' as const,
  },
  {
    title: 'Build Your Referral Network',
    subtitle: 'Grow a 6-level team structure, monitor earnings, and scale commissions with clarity.',
    badge: 'Referral growth',
    icon: 'people-outline' as const,
  },
  {
    title: 'Earn Daily Rewards',
    subtitle: 'Stay on top of payouts, profit projections, and secure withdrawals with confidence.',
    badge: 'Daily rewards',
    icon: 'gift-outline' as const,
  },
];

const LoadingDots = () => {
  const progress = useSharedValue(0.4);

  useEffect(() => {
    progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 650, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 650, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [progress]);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.92 + progress.value * 0.18 }],
  }));

  return (
    <View style={styles.dotRow}>
      {[0, 1, 2].map((item) => (
        <Animated.View key={item} style={[styles.dot, dotStyle]} />
      ))}
    </View>
  );
};

export const SplashScreen = () => {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasCompletedOnboarding = useAppStore((state) => state.hasCompletedOnboarding);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasCompletedOnboarding) {
        router.replace('/onboarding');
        return;
      }

      router.replace(isAuthenticated ? '/(tabs)' : '/(auth)/login');
    }, 1600);

    return () => clearTimeout(timer);
  }, [hasCompletedOnboarding, isAuthenticated, router]);

  return (
    <AppScreen scrollable={false} contentStyle={styles.splashScreen}>
      <LinearGradient colors={['rgba(30,64,255,0.18)', 'rgba(255,255,255,0)']} style={styles.orbTop} />
      <LinearGradient colors={['rgba(106,92,255,0.16)', 'rgba(255,255,255,0)']} style={styles.orbBottom} />

      <View style={styles.splashCenter}>
        <BrandLogo size={128} />
        <Text style={styles.brandTitle}>Anusha Trade</Text>
        <Text style={styles.brandSubtitle}>Secure Investments & Smart Earnings</Text>
        <View style={styles.badge}>
          <Ionicons name="shield-checkmark-outline" size={14} color={colors.primary} />
          <Text style={styles.badgeText}>Premium investment platform</Text>
        </View>
        <LoadingDots />
      </View>

      <View style={styles.splashFooter}>
        <Text style={styles.version}>Version 1.0.0</Text>
        <Text style={styles.footerCopy}>Launching secure portfolio experience</Text>
      </View>
    </AppScreen>
  );
};

export const OnboardingScreen = () => {
  const [index, setIndex] = useState(0);
  const router = useRouter();
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);

  const activeSlide = useMemo(() => onboardingSlides[index], [index]);

  const continueFlow = async () => {
    if (index === onboardingSlides.length - 1) {
      await completeOnboarding();
      router.replace('/(auth)/login');
      return;
    }

    setIndex((value) => value + 1);
  };

  return (
    <AppScreen contentStyle={styles.onboardingScreen}>
      <View className="flex-row items-center justify-between">
        <BrandLogo size={60} />
        <Pressable onPress={continueFlow}>
          <Text style={styles.skipText}>{index === onboardingSlides.length - 1 ? 'Done' : 'Skip'}</Text>
        </Pressable>
      </View>

      <LinearGradient colors={['#EEF2FF', '#FFFFFF']} style={styles.onboardingHero}>
        <View style={styles.heroBackCard} />
        <SurfaceCard style={styles.heroFrontCard}>
          <View style={styles.heroIconWrap}>
            {activeSlide.icon === 'gift-outline' ? (
              <MaterialCommunityIcons name="gift-outline" size={34} color={colors.primary} />
            ) : (
              <Ionicons name={activeSlide.icon} size={34} color={colors.primary} />
            )}
          </View>
          <Text style={styles.heroBadge}>{activeSlide.badge}</Text>
        </SurfaceCard>
      </LinearGradient>

      <View style={styles.onboardingCopy}>
        <Text style={styles.onboardingTitle}>{activeSlide.title}</Text>
        <Text style={styles.onboardingSubtitle}>{activeSlide.subtitle}</Text>
      </View>

      <View style={styles.indicatorRow}>
        {onboardingSlides.map((item, itemIndex) => (
          <Pressable
            key={item.title}
            onPress={() => setIndex(itemIndex)}
            style={[styles.indicator, itemIndex === index && styles.indicatorActive]}
          />
        ))}
      </View>

      <View style={styles.featureRow}>
        <SurfaceCard style={styles.featureCard}>
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
          <Text style={styles.featureTitle}>JWT secure session</Text>
        </SurfaceCard>
        <SurfaceCard style={styles.featureCard}>
          <Ionicons name="finger-print-outline" size={18} color={colors.primary} />
          <Text style={styles.featureTitle}>Biometric ready</Text>
        </SurfaceCard>
      </View>

      <GradientButton label={index === onboardingSlides.length - 1 ? 'Continue to Login' : 'Continue'} onPress={continueFlow} />
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  splashScreen: {
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  orbTop: {
    position: 'absolute',
    top: 0,
    left: -80,
    width: 240,
    height: 240,
    borderRadius: 120,
  },
  orbBottom: {
    position: 'absolute',
    bottom: 40,
    right: -90,
    width: 270,
    height: 270,
    borderRadius: 135,
  },
  splashCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  brandTitle: {
    fontFamily: fontFamily.heading,
    fontSize: 34,
    color: colors.text,
  },
  brandSubtitle: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 16,
    color: colors.muted,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#EEF2FF',
  },
  badgeText: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 12,
    color: colors.primary,
  },
  dotRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  splashFooter: {
    paddingBottom: 16,
    alignItems: 'center',
    gap: 4,
  },
  version: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 13,
    color: colors.text,
  },
  footerCopy: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    color: colors.muted,
  },
  onboardingScreen: {
    paddingTop: 8,
    gap: 24,
  },
  skipText: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 14,
    color: colors.primary,
  },
  onboardingHero: {
    minHeight: 280,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  heroBackCard: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 36,
    backgroundColor: 'rgba(30,64,255,0.08)',
    transform: [{ rotate: '-9deg' }],
  },
  heroFrontCard: {
    width: 210,
    height: 210,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
  },
  heroIconWrap: {
    width: 86,
    height: 86,
    borderRadius: 28,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadge: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 13,
    color: colors.primary,
  },
  onboardingCopy: {
    gap: 10,
  },
  onboardingTitle: {
    fontFamily: fontFamily.heading,
    fontSize: 30,
    color: colors.text,
  },
  onboardingSubtitle: {
    fontFamily: fontFamily.body,
    fontSize: 15,
    lineHeight: 24,
    color: colors.muted,
  },
  indicatorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#CBD5E1',
  },
  indicatorActive: {
    width: 28,
    backgroundColor: colors.primary,
  },
  featureRow: {
    flexDirection: 'row',
    gap: 12,
  },
  featureCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureTitle: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 13,
    color: colors.text,
    flex: 1,
  },
});
