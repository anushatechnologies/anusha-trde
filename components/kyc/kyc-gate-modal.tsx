import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors, fontFamily, gradients, radius, shadows } from '../../constants/theme';
import { GradientButton } from '../ui/gradient-button';

export interface KycGateModalProps {
  visible: boolean;
  onClose: () => void;
  onProceedInvest?: () => void;
  kycStatus?: string | null;
  planName?: string;
}

export const KycGateModal: React.FC<KycGateModalProps> = ({
  visible,
  onClose,
  onProceedInvest,
  kycStatus = 'NOT_SUBMITTED',
  planName,
}) => {
  const router = useRouter();

  const isApproved = kycStatus === 'APPROVED';
  const isPending = kycStatus === 'PENDING';
  const isRejected = kycStatus === 'REJECTED' || kycStatus === 'REUPLOAD_REQUIRED';
  const isNotSubmitted = !kycStatus || kycStatus === 'NOT_SUBMITTED';

  const getStatusConfig = () => {
    if (isApproved) {
      return {
        badgeColor: colors.successLight,
        badgeBg: 'rgba(16, 185, 129, 0.15)',
        badgeBorder: 'rgba(52, 211, 153, 0.35)',
        badgeText: 'VERIFIED INVESTOR',
        iconName: 'shield-checkmark' as const,
        iconColor: colors.successLight,
        iconBg: 'rgba(16, 185, 129, 0.18)',
        title: 'KYC Verified & Ready',
        subtitle: planName
          ? `Your account is fully verified to invest in the ${planName} and earn daily returns.`
          : 'Your account is fully verified to activate any premium investment plan.',
        primaryLabel: 'Proceed to Investment',
        primaryAction: () => {
          onClose();
          onProceedInvest?.();
        },
      };
    }

    if (isPending) {
      return {
        badgeColor: colors.cyan,
        badgeBg: 'rgba(56, 189, 248, 0.15)',
        badgeBorder: 'rgba(56, 189, 248, 0.35)',
        badgeText: 'UNDER VERIFICATION',
        iconName: 'time' as const,
        iconColor: colors.cyan,
        iconBg: 'rgba(56, 189, 248, 0.18)',
        title: 'KYC Under Review',
        subtitle:
          'Your KYC identity documents have been submitted and are currently being reviewed by our compliance team. Investment will be enabled immediately upon approval.',
        primaryLabel: 'View KYC Status',
        primaryAction: () => {
          onClose();
          router.push('/kyc-documents');
        },
      };
    }

    if (isRejected) {
      return {
        badgeColor: colors.danger,
        badgeBg: 'rgba(239, 68, 68, 0.15)',
        badgeBorder: 'rgba(239, 68, 68, 0.35)',
        badgeText: 'ACTION REQUIRED',
        iconName: 'alert-circle' as const,
        iconColor: colors.danger,
        iconBg: 'rgba(239, 68, 68, 0.18)',
        title: 'KYC Reupload Needed',
        subtitle:
          'Your previous document submission needs an update before you can activate investment plans. Please reupload clear photos of your PAN and ID.',
        primaryLabel: 'Reupload KYC Documents',
        primaryAction: () => {
          onClose();
          router.push('/kyc-documents');
        },
      };
    }

    // Default: NOT_SUBMITTED
    return {
      badgeColor: colors.warningLight,
      badgeBg: 'rgba(245, 158, 11, 0.15)',
      badgeBorder: 'rgba(251, 191, 36, 0.35)',
      badgeText: 'KYC REQUIRED TO INVEST',
      iconName: 'id-card' as const,
      iconColor: colors.warningLight,
      iconBg: 'rgba(245, 158, 11, 0.18)',
      title: 'Complete KYC to Invest',
      subtitle: planName
        ? `To activate the ${planName} and receive automated daily wallet payouts, regulatory compliance requires a 1-time KYC verification.`
        : 'To activate investment plans and receive automated daily wallet payouts, regulatory compliance requires a 1-time KYC verification.',
      primaryLabel: 'Complete KYC Now (2 Mins)',
      primaryAction: () => {
        onClose();
        router.push('/kyc-documents');
      },
    };
  };

  const config = getStatusConfig();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropPressable} onPress={onClose} />

        <View style={styles.modalCard}>
          {/* Status Header Badge */}
          <View style={styles.topRow}>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: config.badgeBg,
                  borderColor: config.badgeBorder,
                },
              ]}
            >
              <Ionicons name={config.iconName} size={13} color={config.badgeColor} />
              <Text style={[styles.badgeText, { color: config.badgeColor }]}>
                {config.badgeText}
              </Text>
            </View>

            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={10}>
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Hero Icon */}
          <View style={styles.iconCenterWrap}>
            <View style={[styles.largeIconWrap, { backgroundColor: config.iconBg }]}>
              <Ionicons name={config.iconName} size={36} color={config.iconColor} />
            </View>
          </View>

          {/* Title & Explanation */}
          <Text style={styles.titleText}>{config.title}</Text>
          <Text style={styles.subtitleText}>{config.subtitle}</Text>

          {/* Checklist Feature Box */}
          <View style={styles.featureBox}>
            <View style={styles.featureRow}>
              <Ionicons
                name={isApproved ? 'checkmark-circle' : 'shield-outline'}
                size={16}
                color={isApproved ? colors.successLight : colors.cyan}
              />
              <Text style={styles.featureText}>100% Capital & ROI Protection</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons
                name={isApproved ? 'checkmark-circle' : 'flash-outline'}
                size={16}
                color={isApproved ? colors.successLight : colors.cyan}
              />
              <Text style={styles.featureText}>Instant automated daily ROI credits</Text>
            </View>
            <View style={styles.featureRow}>
              <Ionicons
                name={isApproved ? 'checkmark-circle' : 'document-text-outline'}
                size={16}
                color={isApproved ? colors.successLight : colors.cyan}
              />
              <Text style={styles.featureText}>Official digital investment certificates</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionColumn}>
            <GradientButton
              label={config.primaryLabel}
              onPress={config.primaryAction}
              icon={<Ionicons name="arrow-forward" size={17} color="#FFFFFF" />}
              iconPosition="end"
            />

            <Pressable onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>
                {isApproved ? 'Cancel' : 'Explore Dashboard First'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(8, 13, 26, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backdropPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 22,
    ...shadows.card,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  badgeText: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 10.5,
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCenterWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  largeIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...shadows.glow,
  },
  titleText: {
    fontFamily: fontFamily.heading,
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 6,
  },
  subtitleText: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 6,
  },
  featureBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  featureText: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12.5,
    color: '#F1F5F9',
  },
  actionColumn: {
    gap: 10,
  },
  cancelBtn: {
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 13,
    color: colors.textSecondary,
  },
});


