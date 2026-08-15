import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
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
    title: 'Invest Smarter',
    subtitle: 'Grow your wealth with curated daily ROI plans, transparent forecasting, and capital protection.',
    badge: 'Portfolio Intelligence',
    icon: 'trending-up' as const,
    accent: colors.cyan,
  },
  {
    title: 'Track Your Wealth',
    subtitle: 'Monitor live portfolio valuation, daily returns, and payout history from one unified dashboard.',
    badge: 'Real-Time Analytics',
    icon: 'analytics-outline' as const,
    accent: colors.successLight,
  },
  {
    title: 'Grow Your Network',
    subtitle: 'Earn passive multi-tier income through our transparent 6-level referral commission hierarchy.',
    badge: '6-Level Referral Tree',
    icon: 'people-outline' as const,
    accent: '#A78BFA',
  },
  {
    title: 'Secure Your Account',
    subtitle: 'Bank-grade 256-bit encryption, instant KYC verification, 4-digit MPIN, and direct bank payouts.',
    badge: 'Bank-Grade Security',
    icon: 'shield-checkmark-outline' as const,
    accent: '#38BDF8',
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

  // Reanimated shared values for fluid entry and exit
  const entryY = useSharedValue(50);
  const entryOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.85);
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0.6);
  const exitY = useSharedValue(0);
  const exitOpacity = useSharedValue(1);

  useEffect(() => {
    // 1. Fluid Entry Animation
    entryY.value = withTiming(0, { duration: 700, easing: Easing.out(Easing.cubic) });
    entryOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) });
    logoScale.value = withTiming(1, { duration: 750, easing: Easing.out(Easing.back(1.5)) });

    // 2. Continuous Halo Pulse Animation
    ringScale.value = withRepeat(
      withSequence(
        withTiming(1.35, { duration: 1100, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    ringOpacity.value = withRepeat(
      withSequence(
        withTiming(0.15, { duration: 1100, easing: Easing.out(Easing.ease) }),
        withTiming(0.6, { duration: 900, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // 3. Fluid Exit: Bottom-to-Top goes out seamlessly into login/dashboard
    const exitTimer = setTimeout(() => {
      exitY.value = withTiming(-80, { duration: 380, easing: Easing.in(Easing.cubic) });
      exitOpacity.value = withTiming(0, { duration: 350, easing: Easing.in(Easing.ease) });

      setTimeout(() => {
        router.replace(isAuthenticated ? '/(tabs)' : '/(auth)/login');
      }, 360);
    }, 1800);

    return () => clearTimeout(exitTimer);
  }, [entryOpacity, entryY, exitOpacity, exitY, isAuthenticated, logoScale, ringOpacity, ringScale, router]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: entryOpacity.value * exitOpacity.value,
    transform: [{ translateY: entryY.value + exitY.value }],
  }));

  const animatedLogoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  const animatedRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  return (
    <AppScreen scrollable={false} contentStyle={styles.splashScreen} fullBleed backgroundColor="#080D1A">
      <LinearGradient colors={['#0F1E4A', '#080D1A']} style={StyleSheet.absoluteFillObject} />

      {/* Ambient Radial Glows */}
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <Animated.View style={[styles.splashMain, animatedContainerStyle]}>
        {/* Brand Logo with Pulsing Halo Ring */}
        <View style={styles.logoWrapper}>
          <Animated.View style={[styles.haloRing, animatedRingStyle]} />
          <Animated.View style={[styles.haloRingInner, animatedRingStyle]} />
          <Animated.View style={[styles.logoCard, animatedLogoStyle]}>
            <BrandLogo size={108} />
          </Animated.View>
        </View>

        {/* Brand Typography */}
        <View style={styles.brandTextBlock}>
          <Text style={styles.brandTitle}>Anusha Trade</Text>
          <Text style={styles.brandTagline}>SMART INVESTMENTS & SECURE RETURNS</Text>
          <Text style={styles.brandSubtitle}>India's Premier Investment & Wealth Platform</Text>
        </View>

        {/* Trust & Security Badges */}
        <View style={styles.trustBadge}>
          <Ionicons name="shield-checkmark" size={15} color="#38BDF8" />
          <Text style={styles.trustBadgeText}>Bank-Grade 256-Bit Security</Text>
        </View>

        {/* Shimmer Loading Dots */}
        <View style={styles.loadingSection}>
          <LoadingDots />
          <Text style={styles.loadingText}>Initializing secure portfolio engine...</Text>
        </View>
      </Animated.View>

      {/* Footer */}
      <Animated.View style={[styles.splashFooter, animatedContainerStyle]}>
        <Text style={styles.version}>Version 1.0.13</Text>
        <Text style={styles.footerCopy}>© 2026 Anusha Trade • All Rights Reserved</Text>
      </Animated.View>
    </AppScreen>
  );
};

export const OnboardingScreen = () => {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const completeOnboarding = useAppStore((state) => state.completeOnboarding);
  const { width } = useWindowDimensions();

  const handleFinishOnboarding = () => {
    void completeOnboarding();
    router.replace('/(auth)/login');
  };

  const handleNext = () => {
    if (currentIndex < onboardingSlides.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      handleFinishOnboarding();
    }
  };

  const currentSlide = onboardingSlides[currentIndex];

  return (
    <AppScreen scrollable={false} contentStyle={styles.onboardingContainer} fullBleed backgroundColor="#080D1A">
      <LinearGradient colors={['#0F1E4A', '#080D1A']} style={StyleSheet.absoluteFillObject} />

      {/* Ambient Glow */}
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      {/* Top Header Row with Skip */}
      <View style={styles.onboardingHeader}>
        <View style={styles.brandBadgeSmall}>
          <BrandLogo size={36} />
          <Text style={styles.brandBadgeText}>Anusha Trade</Text>
        </View>
        <Pressable onPress={handleFinishOnboarding} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>

      {/* Center Slide Stage */}
      <View style={styles.slideStage}>
        {/* Glass Hero Visual Card */}
        <SurfaceCard glass="dark" style={styles.illustrationCard}>
          <View style={[styles.illustrationGlow, { backgroundColor: currentSlide.accent }]} />
          <View style={[styles.iconBubble, { borderColor: `${currentSlide.accent}55` }]}>
            <Ionicons name={currentSlide.icon} size={64} color={currentSlide.accent} />
          </View>
          <View style={styles.pillBadge}>
            <Ionicons name="sparkles" size={12} color={currentSlide.accent} />
            <Text style={[styles.pillBadgeText, { color: currentSlide.accent }]}>{currentSlide.badge}</Text>
          </View>
        </SurfaceCard>

        {/* Slide Copy */}
        <View style={styles.slideCopyBlock}>
          <Text style={styles.slideTitle}>{currentSlide.title}</Text>
          <Text style={styles.slideSubtitle}>{currentSlide.subtitle}</Text>
        </View>

        {/* Progress Indicator Dots */}
        <View style={styles.indicatorRow}>
          {onboardingSlides.map((_, index) => (
            <Pressable key={`slide-dot-${index}`} onPress={() => setCurrentIndex(index)}>
              <View style={[styles.indicator, index === currentIndex && styles.indicatorActive]} />
            </Pressable>
          ))}
        </View>
      </View>

      {/* Bottom CTA Row */}
      <View style={styles.onboardingFooter}>
        <GradientButton
          label={currentIndex === onboardingSlides.length - 1 ? 'Get Started' : 'Continue'}
          onPress={handleNext}
          iconPosition="end"
          icon={<Ionicons name="arrow-forward" size={18} color="#FFFFFF" />}
        />
        <View style={styles.loginRedirectRow}>
          <Text style={styles.loginRedirectText}>Already registered?</Text>
          <Pressable onPress={handleFinishOnboarding}>
            <Text style={styles.loginRedirectLink}>Sign In</Text>
          </Pressable>
        </View>
      </View>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  splashScreen: {
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#080D1A',
    paddingVertical: 36,
    paddingHorizontal: 24,
  },
  glowTop: {
    position: 'absolute',
    top: -60,
    left: '15%',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(37,99,235,0.22)',
  },
  glowBottom: {
    position: 'absolute',
    bottom: -60,
    right: '15%',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(79,70,229,0.18)',
  },
  splashMain: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: 22,
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 170,
    height: 170,
    marginBottom: 6,
  },
  haloRing: {
    position: 'absolute',
    width: 164,
    height: 164,
    borderRadius: 82,
    borderWidth: 2,
    borderColor: 'rgba(56,189,248,0.4)',
  },
  haloRingInner: {
    position: 'absolute',
    width: 136,
    height: 136,
    borderRadius: 68,
    backgroundColor: 'rgba(30,64,255,0.12)',
  },
  logoCard: {
    width: 120,
    height: 120,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.card,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  brandTextBlock: {
    alignItems: 'center',
    gap: 6,
  },
  brandTitle: {
    fontFamily: fontFamily.heading,
    fontSize: 36,
    lineHeight: 42,
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  brandTagline: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 11,
    letterSpacing: 2.2,
    color: '#38BDF8',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  brandSubtitle: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
    marginTop: 2,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(30,58,138,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.25)',
  },
  trustBadgeText: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12.5,
    color: '#E0F2FE',
  },
  loadingSection: {
    alignItems: 'center',
    gap: 10,
    marginTop: 12,
  },
  dotRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#38BDF8',
  },
  loadingText: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
  },
  splashFooter: {
    alignItems: 'center',
    gap: 4,
    paddingBottom: 8,
  },
  version: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 1,
  },
  footerCopy: {
    fontFamily: fontFamily.body,
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
  },

  // Onboarding Styles
  onboardingContainer: {
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 36,
    backgroundColor: '#080D1A',
  },
  onboardingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  brandBadgeSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandBadgeText: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 18,
    color: '#FFFFFF',
  },
  skipBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  skipText: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 13,
    color: colors.cyan,
  },
  slideStage: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  illustrationCard: {
    width: '100%',
    maxWidth: 320,
    height: 240,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
  },
  illustrationGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    opacity: 0.22,
  },
  iconBubble: {
    width: 110,
    height: 110,
    borderRadius: 36,
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glow,
    marginBottom: 12,
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  pillBadgeText: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 11.5,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  slideCopyBlock: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
  },
  slideTitle: {
    fontFamily: fontFamily.heading,
    fontSize: 28,
    lineHeight: 34,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  slideSubtitle: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 310,
  },
  indicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  indicatorActive: {
    width: 26,
    backgroundColor: colors.cyan,
  },
  onboardingFooter: {
    gap: 14,
  },
  loginRedirectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  loginRedirectText: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
  loginRedirectLink: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 13,
    color: colors.cyan,
  },
});
