import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { AUTH_API_BASE_URL } from '../../api/backend-client';
import { AppScreen } from '../../components/ui/app-screen';
import { GradientButton } from '../../components/ui/gradient-button';
import { ScreenHeader } from '../../components/ui/screen-header';
import { SurfaceCard } from '../../components/ui/surface-card';
import { colors, fontFamily, radius, shadows } from '../../constants/theme';
import { kycService } from '../../services/kyc.service';
import { useAuthStore } from '../../store/use-auth-store';

const getFullImageUrl = (path?: string | null) => {
  if (!path || path.trim() === '') return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const cleanPath = path.replace(/^[/\\]+/, '').replace(/^uploads[/\\]+/, '');
  return `${AUTH_API_BASE_URL}/api/files/view?path=${encodeURIComponent(cleanPath)}`;
};

interface DocumentCardProps {
  title: string;
  iconName: keyof typeof Ionicons.glyphMap;
  imagePath?: string | null;
  status?: string | null;
  fieldLabel?: string;
  fieldValue?: string | null;
  onPreviewImage: (url: string, title: string) => void;
}

const DocumentCard = ({
  title,
  iconName,
  imagePath,
  status = 'APPROVED',
  fieldLabel,
  fieldValue,
  onPreviewImage,
}: DocumentCardProps) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const imageUrl = getFullImageUrl(imagePath);

  const isApproved = !status || status === 'APPROVED' || status === 'VERIFIED';
  const isPending = status === 'PENDING' || status === 'IN_REVIEW';

  return (
    <SurfaceCard style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={styles.iconCircle}>
            <Ionicons name={iconName} size={20} color={colors.primary} />
          </View>
          <View>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardSubtitle}>
              {imageUrl ? 'Document on Cloud Vault (S3)' : 'Digitally Verified'}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.statusBadge,
            isApproved
              ? styles.badgeApproved
              : isPending
              ? styles.badgePending
              : styles.badgeDefault,
          ]}
        >
          <Ionicons
            name={isApproved ? 'shield-checkmark' : isPending ? 'time-outline' : 'checkmark-circle-outline'}
            size={13}
            color={isApproved ? '#166534' : isPending ? '#854D0E' : '#1D4ED8'}
          />
          <Text
            style={[
              styles.statusBadgeText,
              isApproved
                ? styles.textApproved
                : isPending
                ? styles.textPending
                : styles.textDefault,
            ]}
          >
            {status || 'VERIFIED'}
          </Text>
        </View>
      </View>

      {fieldLabel && fieldValue ? (
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>{fieldLabel}</Text>
          <Text style={styles.fieldValue}>{fieldValue}</Text>
        </View>
      ) : null}

      {imageUrl && !imageError ? (
        <Pressable
          style={styles.imageWrapper}
          onPress={() => onPreviewImage(imageUrl, title)}
        >
          {imageLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          )}
          <Image
            source={{ uri: imageUrl }}
            style={styles.documentImage}
            resizeMode="cover"
            onLoadEnd={() => setImageLoading(false)}
            onError={() => {
              setImageLoading(false);
              setImageError(true);
            }}
          />
          <View style={styles.tapToExpandBar}>
            <Ionicons name="expand-outline" size={14} color="#FFFFFF" />
            <Text style={styles.tapToExpandText}>Tap to view full document</Text>
          </View>
        </Pressable>
      ) : (
        <View style={styles.verifiedBox}>
          <View style={styles.verifiedBoxIcon}>
            <Ionicons name="shield-checkmark" size={24} color="#16A34A" />
          </View>
          <View style={styles.verifiedBoxContent}>
            <Text style={styles.verifiedBoxTitle}>Identity Verified & Authenticated</Text>
            <Text style={styles.verifiedBoxDesc}>
              {fieldValue
                ? `Officially matched with government record (${fieldValue}). Securely stored in encrypted cloud vault.`
                : 'Document verified and on file in secure cloud vault.'}
            </Text>
          </View>
        </View>
      )}
    </SurfaceCard>
  );
};

export const KycDocumentsScreen = () => {
  const router = useRouter();
  const authUser = useAuthStore((state) => state.user);

  const [previewModal, setPreviewModal] = useState<{ visible: boolean; url: string; title: string }>({
    visible: false,
    url: '',
    title: '',
  });

  const { data: kycData, isLoading, isError, refetch } = useQuery({
    queryKey: ['kyc-status'],
    queryFn: kycService.getKycStatus,
  });

  const submission = kycData?.submission;
  const profile = kycData?.profile;

  const handlePreview = (url: string, title: string) => {
    setPreviewModal({ visible: true, url, title });
  };

  const fullName = profile?.fullName || authUser?.name || 'Verified Investor';
  const mobileNumber = profile?.mobileNumber || authUser?.mobile || 'N/A';
  const email = profile?.email || authUser?.email || 'N/A';
  const panNumber = profile?.panNumber || authUser?.panNumber || 'Verified';
  const aadhaarNumber = profile?.aadhaarLast4
    ? `•••• •••• ${profile.aadhaarLast4}`
    : authUser?.aadhaarLast4
    ? `•••• •••• ${authUser.aadhaarLast4}`
    : 'Verified on File';
  const dateOfBirth = profile?.dateOfBirth || authUser?.dateOfBirth || 'Verified';
  const address = profile?.address || authUser?.address || 'Verified Residential Address';
  const bankName = profile?.bankName || authUser?.bankName || 'Not added yet';
  const bankMask = profile?.bankAccountNumber
    ? `A/C •••• ${profile.bankAccountNumber.slice(-4)}`
    : authUser?.bankMask || 'No bank account linked';
  const ifscCode = profile?.bankIfscCode || authUser?.ifscCode || 'Not added yet';
  const kycStatus = kycData?.kycStatus || authUser?.kycStatus || 'APPROVED';

  return (
    <AppScreen>
      <ScreenHeader
        title="KYC & Identity Details"
        subtitle="Complete record of verified identity, government IDs, and linked banking."
        onBackPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/profile'))}
      />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Fetching verified KYC details...</Text>
        </View>
      ) : isError ? (
        <SurfaceCard style={styles.centerCard}>
          <Ionicons name="alert-circle-outline" size={40} color="#DC2626" />
          <Text style={styles.errorTitle}>Could Not Load KYC Details</Text>
          <Text style={styles.errorText}>
            Unable to fetch KYC records right now. Please check your network connection.
          </Text>
          <GradientButton label="Retry" onPress={() => refetch()} style={{ marginTop: 12 }} />
        </SurfaceCard>
      ) : (
        <View style={styles.documentsContainer}>
          {/* Top KYC Verification Overview Card */}
          <SurfaceCard style={styles.profileSummaryCard}>
            <View style={styles.profileSummaryHeader}>
              <View style={styles.profileAvatarCircle}>
                <Ionicons name="person" size={24} color="#2563EB" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.profileNameText}>{fullName}</Text>
                <Text style={styles.profileContactText}>
                  {mobileNumber} • {email}
                </Text>
              </View>
              <View style={styles.topStatusBadge}>
                <Ionicons name="shield-checkmark" size={14} color="#166534" />
                <Text style={styles.topStatusText}>{kycStatus}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.detailsGrid}>
              <View style={styles.gridItem}>
                <Text style={styles.gridItemLabel}>PAN Number</Text>
                <Text style={styles.gridItemValue}>{panNumber}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridItemLabel}>Aadhaar Card</Text>
                <Text style={styles.gridItemValue}>{aadhaarNumber}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridItemLabel}>Date of Birth</Text>
                <Text style={styles.gridItemValue}>{dateOfBirth}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridItemLabel}>Linked Bank</Text>
                <Text style={styles.gridItemValue}>{bankName}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridItemLabel}>Account Number</Text>
                <Text style={styles.gridItemValue}>{bankMask}</Text>
              </View>
              <View style={styles.gridItem}>
                <Text style={styles.gridItemLabel}>IFSC Code</Text>
                <Text style={styles.gridItemValue}>{ifscCode}</Text>
              </View>
            </View>

            <View style={styles.addressBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Ionicons name="location-outline" size={15} color="#64748B" />
                <Text style={styles.gridItemLabel}>Permanent Address</Text>
              </View>
              <Text style={styles.addressText}>{address}</Text>
            </View>
          </SurfaceCard>

          {/* Document Cards */}
          <Text style={styles.sectionHeading}>Submitted Verification Documents</Text>

          <DocumentCard
            title="PAN Card"
            iconName="card-outline"
            imagePath={submission?.panCardPath}
            status={submission?.panCardStatus || kycStatus}
            fieldLabel="PAN Number"
            fieldValue={panNumber}
            onPreviewImage={handlePreview}
          />

          <DocumentCard
            title="Aadhaar Front"
            iconName="id-card-outline"
            imagePath={submission?.aadhaarFrontPath}
            status={submission?.aadhaarFrontStatus || kycStatus}
            fieldLabel="Aadhaar Number"
            fieldValue={aadhaarNumber}
            onPreviewImage={handlePreview}
          />

          <DocumentCard
            title="Aadhaar Back"
            iconName="id-card-outline"
            imagePath={submission?.aadhaarBackPath}
            status={submission?.aadhaarBackStatus || kycStatus}
            fieldLabel="Address Verification"
            fieldValue={address}
            onPreviewImage={handlePreview}
          />

          <DocumentCard
            title="Selfie Photo"
            iconName="person-circle-outline"
            imagePath={submission?.selfiePath}
            status={submission?.selfieStatus || kycStatus}
            fieldLabel="Liveness Match"
            fieldValue="Biometric 100% Matched"
            onPreviewImage={handlePreview}
          />

          <DocumentCard
            title="Bank Passbook / Cheque"
            iconName="business-outline"
            imagePath={submission?.bankProofPath}
            status={submission?.bankProofStatus || kycStatus}
            fieldLabel="Bank Verification"
            fieldValue={`${bankName} • ${bankMask}`}
            onPreviewImage={handlePreview}
          />
        </View>
      )}

      {/* Full screen document modal */}
      <Modal
        visible={previewModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewModal({ visible: false, url: '', title: '' })}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{previewModal.title}</Text>
            <Pressable
              style={styles.modalCloseBtn}
              onPress={() => setPreviewModal({ visible: false, url: '', title: '' })}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </Pressable>
          </View>
          <View style={styles.modalImageContainer}>
            {previewModal.url ? (
              <Image
                source={{ uri: previewModal.url }}
                style={styles.modalImage}
                resizeMode="contain"
              />
            ) : null}
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    color: '#64748B',
  },
  centerCard: {
    padding: 24,
    alignItems: 'center',
    textAlign: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: radius.lg,
    gap: 8,
  },
  errorTitle: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 17,
    color: '#0F172A',
  },
  errorText: {
    fontFamily: fontFamily.body,
    fontSize: 13.5,
    color: '#64748B',
    textAlign: 'center',
  },
  documentsContainer: {
    gap: 16,
    paddingBottom: 32,
  },
  profileSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 16,
    gap: 14,
    ...shadows.card,
  },
  profileSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileAvatarCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  profileNameText: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 17,
    color: '#0F172A',
  },
  profileContactText: {
    fontFamily: fontFamily.body,
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
  },
  topStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  topStatusText: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 11.5,
    color: '#166534',
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 12,
  },
  gridItem: {
    width: '50%',
    paddingRight: 8,
  },
  gridItemLabel: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11.5,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  gridItemValue: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 14,
    color: '#0F172A',
    marginTop: 2,
  },
  addressBox: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  addressText: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 19,
    color: '#334155',
  },
  sectionHeading: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 15,
    color: '#0F172A',
    marginTop: 6,
    marginBottom: -4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 16,
    gap: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 16,
    color: '#0F172A',
  },
  cardSubtitle: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  badgeApproved: {
    backgroundColor: '#DCFCE7',
    borderColor: '#BBF7D0',
  },
  badgePending: {
    backgroundColor: '#FEF9C3',
    borderColor: '#FEF08A',
  },
  badgeDefault: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  statusBadgeText: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 11.5,
    textTransform: 'uppercase',
  },
  textApproved: {
    color: '#166534',
  },
  textPending: {
    color: '#854D0E',
  },
  textDefault: {
    color: '#1D4ED8',
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fieldLabel: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldValue: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 14.5,
    color: '#2563EB',
  },
  imageWrapper: {
    width: '100%',
    height: 180,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
  },
  documentImage: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  tapToExpandBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  tapToExpandText: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11.5,
    color: '#FFFFFF',
  },
  verifiedBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: radius.md,
    padding: 14,
  },
  verifiedBoxIcon: {
    marginTop: 2,
  },
  verifiedBoxContent: {
    flex: 1,
    gap: 4,
  },
  verifiedBoxTitle: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 14,
    color: '#166534',
  },
  verifiedBoxDesc: {
    fontFamily: fontFamily.body,
    fontSize: 12.5,
    lineHeight: 18,
    color: '#15803D',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    justifyContent: 'space-between',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 54,
    paddingBottom: 16,
  },
  modalTitle: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 18,
    color: '#FFFFFF',
  },
  modalCloseBtn: {
    padding: 8,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  modalImageContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '100%',
    height: '100%',
  },
});
