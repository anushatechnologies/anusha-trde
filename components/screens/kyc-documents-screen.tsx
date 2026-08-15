import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '../../components/ui/app-screen';
import { ScreenHeader } from '../../components/ui/screen-header';
import { StatusBadge } from '../../components/ui/status-badge';
import { SurfaceCard } from '../../components/ui/surface-card';
import { AUTH_API_BASE_URL } from '../../api/backend-client';
import { colors, fontFamily, radius, shadows } from '../../constants/theme';
import { kycService } from '../../services/kyc.service';

const getFullImageUrl = (path?: string | null) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${AUTH_API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

export const KycDocumentsScreen = () => {
  const router = useRouter();

  const { data: kycData, isLoading, isError } = useQuery({
    queryKey: ['kyc-status'],
    queryFn: kycService.getKycStatus,
  });

  const submission = kycData?.submission;
  const profile = kycData?.profile;

  const renderDocumentCard = (
    title: string,
    imagePath?: string | null,
    status?: string | null,
    fieldLabel?: string,
    fieldValue?: string | null
  ) => {
    const imageUrl = getFullImageUrl(imagePath);

    return (
      <SurfaceCard glass="dark" style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{title}</Text>
          {status ? <StatusBadge status={status} size="sm" /> : null}
        </View>

        {fieldLabel && fieldValue ? (
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>{fieldLabel}</Text>
            <Text style={styles.fieldValue}>{fieldValue}</Text>
          </View>
        ) : null}

        {imageUrl ? (
          <View style={styles.imageContainer}>
            <Image source={{ uri: imageUrl }} style={styles.documentImage} resizeMode="contain" />
          </View>
        ) : (
          <View style={styles.noImageContainer}>
            <Ionicons name="image-outline" size={32} color={colors.textSecondary} />
            <Text style={styles.noImageText}>No image uploaded</Text>
          </View>
        )}
      </SurfaceCard>
    );
  };

  return (
    <AppScreen>
      <ScreenHeader
        title="KYC Documents"
        subtitle="Review your submitted identity and banking documents."
        onBackPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'))}
      />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.cyan} />
        </View>
      ) : isError ? (
        <SurfaceCard glass="dark">
          <Text style={styles.errorText}>Failed to load KYC documents. Please try again later.</Text>
        </SurfaceCard>
      ) : !submission ? (
        <SurfaceCard glass="dark">
          <Text style={styles.errorText}>No KYC submission found for this account.</Text>
        </SurfaceCard>
      ) : (
        <View style={styles.documentsContainer}>
          {renderDocumentCard(
            'PAN Card',
            submission.panCardPath,
            submission.panCardStatus,
            'PAN Number',
            profile?.panNumber
          )}
          {renderDocumentCard(
            'Aadhaar Front',
            submission.aadhaarFrontPath,
            submission.aadhaarFrontStatus,
            'Aadhaar Last 4',
            profile?.aadhaarLast4
          )}
          {renderDocumentCard(
            'Aadhaar Back',
            submission.aadhaarBackPath,
            submission.aadhaarBackStatus
          )}
          {renderDocumentCard(
            'Selfie Photo',
            submission.selfiePath,
            submission.selfieStatus
          )}
          {renderDocumentCard(
            'Bank Proof / Passbook',
            submission.bankProofPath,
            submission.bankProofStatus
          )}
        </View>
      )}
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  documentsContainer: {
    gap: 16,
    paddingBottom: 24,
  },
  card: {
    padding: 16,
    gap: 12,
    ...shadows.glass,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 16,
    color: '#FFFFFF',
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  fieldLabel: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 14,
    color: colors.cyan,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  documentImage: {
    width: '100%',
    height: '100%',
  },
  noImageContainer: {
    width: '100%',
    height: 120,
    borderRadius: radius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  noImageText: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    color: colors.textSecondary,
  },
});

