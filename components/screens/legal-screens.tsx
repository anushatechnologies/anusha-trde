import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontFamily, radius } from '../../constants/theme';
import { legalService } from '../../services/legal.service';
import { useAuthStore } from '../../store/use-auth-store';
import { AppScreen } from '../ui/app-screen';
import { SurfaceCard } from '../ui/surface-card';

const getParam = (value: string | string[] | undefined, fallback = '') =>
  Array.isArray(value) ? value[0] || fallback : value || fallback;

const useLegalReturnConfig = () => {
  const params = useLocalSearchParams<{
    returnTo?: string;
    returnLabel?: string;
  }>();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const returnTo = getParam(params.returnTo, isAuthenticated ? '/settings' : '/(auth)/register');
  const returnLabel = getParam(params.returnLabel, isAuthenticated ? 'Back to Settings' : 'Back to Signup');

  return {
    returnTo,
    returnLabel,
  };
};

const LegalScaffold = ({
  documentKey,
  titleFallback,
  introFallback,
}: {
  documentKey: string;
  titleFallback: string;
  introFallback: string;
}) => {
  const router = useRouter();
  const { returnTo, returnLabel } = useLegalReturnConfig();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['legal', documentKey],
    queryFn: () => legalService.getLegalDocument(documentKey),
  });

  return (
    <AppScreen contentStyle={styles.screen}>
      <SurfaceCard style={styles.card}>
        <Text style={styles.eyebrow}>Legal</Text>
        <Text style={styles.title}>{data?.title || titleFallback}</Text>
        <Text style={styles.intro}>{data?.summary || introFallback}</Text>
        
        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ padding: 24 }} />
        ) : isError ? (
          <Text style={styles.noteText}>Failed to load legal document. Please try again later.</Text>
        ) : (
          <Text style={styles.sectionBody}>{data?.content}</Text>
        )}
        
        <Pressable onPress={() => router.replace(returnTo as never)} style={styles.backLinkWrap}>
          <Text style={styles.backLink}>{returnLabel}</Text>
        </Pressable>
      </SurfaceCard>
    </AppScreen>
  );
};

export const TermsAndConditionsScreen = () => (
  <LegalScaffold
    documentKey="terms"
    titleFallback="Terms and Conditions"
    introFallback="By creating an account or using Anusha Trade services, you agree to these terms."
  />
);

export const PrivacyPolicyScreen = () => (
  <LegalScaffold
    documentKey="privacy"
    titleFallback="Privacy Policy"
    introFallback="This policy explains how Anusha Trade collects, uses, stores, and protects your data."
  />
);

const styles = StyleSheet.create({
  screen: {
    gap: 0,
  },
  card: {
    gap: 24,
    padding: 22,
  },
  eyebrow: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 2,
    color: colors.primary,
  },
  title: {
    fontFamily: fontFamily.heading,
    fontSize: 28,
    color: colors.text,
  },
  intro: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    lineHeight: 24,
    color: colors.muted,
  },
  sectionBody: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    lineHeight: 24,
    color: colors.muted,
  },
  noteText: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    lineHeight: 24,
    color: colors.danger || '#EF4444',
  },
  backLinkWrap: {
    alignSelf: 'flex-start',
    paddingTop: 4,
  },
  backLink: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 15,
    color: colors.primary,
  },
});
