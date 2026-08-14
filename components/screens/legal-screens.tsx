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

const DEFAULT_TERMS_CONTENT = `1. ACCEPTANCE OF TERMS
By accessing, registering, or investing on the Anusha Trade platform, you agree to comply with and be bound by these Terms and Conditions, all applicable laws, and regulations. If you do not agree, do not use our services.

2. ELIGIBILITY & REGISTRATION
• You must be at least 18 years of age and an Indian resident.
• You must provide accurate identity information (PAN, Aadhaar, verified mobile number).
• You are responsible for maintaining the confidentiality of your 4-digit MPIN and authentication credentials.

3. INVESTMENT POLICIES & RETURNS
• Minimum investment is Rs5,000; maximum investment is Rs10,00,000 per plan.
• Standard lock-in period is 6 months from the date of activation.
• Monthly interest credits are calculated as per the chosen plan and credited directly to your platform wallet.
• Early withdrawal prior to maturity is subject to a 30% penalty (70% principal returned).

4. WALLET & PAYOUT DISBURSEMENTS
• Minimum wallet withdrawal threshold is Rs1,000.
• Withdrawals are processed to verified bank accounts only and are subject to admin audit approval.
• Bank accounts must match the verified PAN holder name.

5. RISK DISCLOSURE & MARKET PARTICIPATION
• Trading and investment activities carry financial risk. Past returns are not guaranteed for future performance.
• Investors are advised to assess their risk tolerance before committing capital.

6. PROHIBITED CONDUCT & TERMINATION
• Platform abuse, duplicate accounts, forged documents, or fraudulent chargebacks will result in immediate account freeze and forfeiture of pending commissions.`;

const DEFAULT_PRIVACY_CONTENT = `1. INFORMATION WE COLLECT
• Personal Details: Full name, date of birth, residential address, email address, mobile number.
• KYC Documents: PAN number, Aadhaar number (last 4 digits masked), scanned ID proofs, and selfie photo.
• Banking Information: Account holder name, account number, IFSC code, and bank branch.
• Device & Security Data: Device IP address, operating system, login timestamps, and session tokens.

2. HOW WE USE YOUR INFORMATION
• To verify your identity and comply with KYC/AML financial regulations.
• To process deposits, investments, wallet payouts, and referral commission distributions.
• To deliver OTP verification codes and transaction notifications via SMS/Push.
• To protect against fraud, unauthorized logins, and platform security threats.

3. DATA PROTECTION & ENCRYPTION
• All sensitive financial data, passwords, and MPINs are encrypted using industry-standard AES-256 and bcrypt hashing.
• KYC documents are stored in secure access-controlled storage buckets.
• We do not sell or rent your personal data to third parties.

4. USER RIGHTS
• You may inspect, update, or request corrections to your profile data through the app settings.
• You can manage your push notification and communication preferences at any time.`;

const LegalScaffold = ({
  documentKey,
  titleFallback,
  introFallback,
  defaultContent,
}: {
  documentKey: string;
  titleFallback: string;
  introFallback: string;
  defaultContent: string;
}) => {
  const router = useRouter();
  const { returnTo, returnLabel } = useLegalReturnConfig();

  const { data, isLoading } = useQuery({
    queryKey: ['legal', documentKey],
    queryFn: () => legalService.getLegalDocument(documentKey),
    staleTime: 5 * 60 * 1000,
  });

  const contentText = data?.content?.trim() || defaultContent;

  return (
    <AppScreen contentStyle={styles.screen}>
      <SurfaceCard style={styles.card}>
        <Text style={styles.eyebrow}>Legal & Compliance</Text>
        <Text style={styles.title}>{data?.title || titleFallback}</Text>
        <Text style={styles.intro}>{data?.summary || introFallback}</Text>

        {isLoading && !data ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 12 }} />
        ) : null}

        <Text style={styles.sectionBody}>{contentText}</Text>

        <Pressable onPress={() => router.replace(returnTo as never)} style={styles.backLinkWrap}>
          <Text style={styles.backLink}>← {returnLabel}</Text>
        </Pressable>
      </SurfaceCard>
    </AppScreen>
  );
};

export const TermsAndConditionsScreen = () => (
  <LegalScaffold
    documentKey="terms"
    titleFallback="Terms and Conditions"
    introFallback="By creating an account or using Anusha Trade services, you agree to these terms and risk disclosures."
    defaultContent={DEFAULT_TERMS_CONTENT}
  />
);

export const PrivacyPolicyScreen = () => (
  <LegalScaffold
    documentKey="privacy"
    titleFallback="Privacy Policy"
    introFallback="This policy explains how Anusha Trade collects, uses, stores, and protects your personal and financial data."
    defaultContent={DEFAULT_PRIVACY_CONTENT}
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
