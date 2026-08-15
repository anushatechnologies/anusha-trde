import { Stack, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { AppProviders } from '../components/providers/app-providers';
import { useAppBootstrap } from '../hooks/use-app-bootstrap';
import { authService } from '../services/auth.service';
import { useAppStore } from '../store/use-app-store';
import { useAuthStore } from '../store/use-auth-store';

const publicSegments = new Set(['(auth)', 'splash', 'onboarding', 'success', 'privacy-policy', 'terms-and-conditions']);
const protectedSegments = new Set([
  '(tabs)',
  'notifications',
  'security-center',
  'referrals',
  'settings',
  'transactions',
  'withdraw',
  'sessions',
  'devices',
  'personal-info',
  'bank-details',
  'kyc-documents',
  'manage-mpin',
  'monthly-interest',
  'referral-tree',
  'withdrawal-history',
  'payment-receipts',
  'invest-apply',
  'investment-status',
  'dashboard',
]);

function RootNavigator() {
  const { ready } = useAppBootstrap();
  const router = useRouter();
  const segments = useSegments();
  const rootNavigationState = useRootNavigationState();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const requiresMpinVerification = useAuthStore((state) => state.requiresMpinVerification);
  const hasCompletedOnboarding = useAppStore((state) => state.hasCompletedOnboarding);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!ready || !rootNavigationState?.key) {
      return;
    }

    const topSegment = segments[0] ?? '';
    const segmentPath = segments.join('/');
    const isMpinVerificationRoute = topSegment === '(auth)' && segmentPath.includes('mpin-verification');

    // 1. Unauthenticated Users Routing
    if (!isAuthenticated) {
      if (isMpinVerificationRoute) {
        router.replace('/(auth)/login');
        return;
      }
      if (topSegment === 'onboarding') {
        router.replace('/(auth)/login');
        return;
      }
      // Prevent unauthenticated access to protected areas
      if (protectedSegments.has(topSegment)) {
        router.replace('/(auth)/login');
        return;
      }
      return;
    }

    // 2. Authenticated Users Routing
    if (requiresMpinVerification && !isMpinVerificationRoute && topSegment !== 'splash') {
      router.replace('/(auth)/mpin-verification');
      return;
    }

    if (user) {
      const onboardingRoute = authService.resolveOnboardingRoute(user);
      
      // STRICT ENFORCEMENT: If account registration is not fully complete
      if (onboardingRoute !== '/(tabs)') {
        // We match against the segmentPath because routes like /signup/kyc map to segment paths like signup/kyc
        const currentPath = `/${segmentPath}`;
        if (currentPath !== onboardingRoute && !isMpinVerificationRoute) {
          router.replace(onboardingRoute);
        }
        return;
      }
      
      // Account is fully active
      if (isMpinVerificationRoute && !requiresMpinVerification) {
        router.replace('/(tabs)');
        return;
      }

      if (topSegment === '(auth)') {
        if (requiresMpinVerification && isMpinVerificationRoute) {
          return; // Stay on MPIN verification
        }
        const fullAuthPath = (segments as string[]).join('/');
        if (fullAuthPath.endsWith('login') || fullAuthPath.endsWith('register') || fullAuthPath === '(auth)') {
          router.replace('/(tabs)');
          return;
        }
      }
    }

    if (topSegment === '' && !publicSegments.has(topSegment)) {
      router.replace('/splash');
    }
  }, [hasCompletedOnboarding, isAuthenticated, ready, requiresMpinVerification, rootNavigationState?.key, router, segments, user]);

  if (!ready || !rootNavigationState?.key) {
    return null;
  }

  return <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />;
}

export default function RootLayout() {
  return (
    <AppProviders>
      <View style={Platform.OS === 'web' ? styles.webWrapper : styles.flex}>
        <View style={Platform.OS === 'web' ? styles.webContainer : styles.flex}>
          <RootNavigator />
        </View>
      </View>
    </AppProviders>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  webWrapper: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  webContainer: {
    width: '100%',
    maxWidth: 440,
    height: '100%',
    overflow: 'hidden',
    backgroundColor: '#fff',
    boxShadow: '0px 0px 40px rgba(0,0,0,0.5)',
  },
});
