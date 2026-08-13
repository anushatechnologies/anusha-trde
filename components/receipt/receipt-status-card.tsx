import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, fontFamily, radius } from '../../constants/theme';
import { receiptService } from '../../services/receipt.service';
import { ReceiptDetails, WhatsAppReceiptStatus } from '../../types';
import { GradientButton } from '../ui/gradient-button';
import { SectionTitle } from '../ui/section-title';
import { SurfaceCard } from '../ui/surface-card';

interface ReceiptStatusCardProps {
  receipt?: ReceiptDetails;
  investmentId?: string;
  amount?: number;
  showActions?: boolean;
  compact?: boolean;
  style?: ViewStyle;
  title?: string;
}

export const ReceiptStatusCard: React.FC<ReceiptStatusCardProps> = ({
  receipt,
  investmentId,
  showActions = true,
  compact = false,
  style,
  title = 'Receipt & Notifications',
}) => {
  const [isOpeningView, setIsOpeningView] = useState(false);
  const [isOpeningDownload, setIsOpeningDownload] = useState(false);

  const receiptNumber = receipt?.receiptNumber || (investmentId ? `ATR-${investmentId.slice(-6).toUpperCase()}` : 'ATR-2026-000001');
  const receiptUrl = receipt?.receiptUrl || 'https://anusha.trade/receipts/sample-receipt.pdf';
  const emailStatus = receipt?.emailStatus || 'SENT';
  const whatsappStatus: WhatsAppReceiptStatus = receipt?.whatsappStatus || 'DELIVERED';

  const handleViewReceipt = async () => {
    setIsOpeningView(true);
    try {
      const success = await receiptService.viewReceipt(receiptUrl);
      if (!success) {
        Alert.alert('Receipt Viewer', 'Receipt PDF is available. If your browser does not open automatically, please check your network connection.');
      }
    } catch {
      Alert.alert('Error', 'Unable to open receipt viewer right now.');
    } finally {
      setIsOpeningView(false);
    }
  };

  const handleDownloadReceipt = async () => {
    setIsOpeningDownload(true);
    try {
      const success = await receiptService.downloadReceipt(receiptUrl);
      if (!success) {
        Alert.alert('Receipt Download', 'Downloading receipt... Check your device downloads folder.');
      }
    } catch {
      Alert.alert('Error', 'Unable to download receipt right now.');
    } finally {
      setIsOpeningDownload(false);
    }
  };

  const renderWhatsAppBadge = () => {
    switch (whatsappStatus) {
      case 'QUEUED':
        return (
          <View style={[styles.statusBadgeRow, styles.badgePending]}>
            <Ionicons name="time-outline" size={16} color="#D97706" />
            <View style={styles.badgeTextWrap}>
              <Text style={styles.badgeLabel}>WhatsApp Receipt</Text>
              <Text style={[styles.badgeValue, { color: '#D97706' }]}>⏳ Preparing...</Text>
            </View>
          </View>
        );
      case 'SENDING':
        return (
          <View style={[styles.statusBadgeRow, styles.badgePending]}>
            <ActivityIndicator size="small" color="#2563EB" />
            <View style={styles.badgeTextWrap}>
              <Text style={styles.badgeLabel}>WhatsApp Receipt</Text>
              <Text style={[styles.badgeValue, { color: '#2563EB' }]}>⏳ Sending...</Text>
            </View>
          </View>
        );
      case 'SENT':
        return (
          <View style={[styles.statusBadgeRow, styles.badgeSuccess]}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <View style={styles.badgeTextWrap}>
              <Text style={styles.badgeLabel}>WhatsApp Receipt</Text>
              <Text style={[styles.badgeValue, { color: colors.success }]}>✓ Sent to WhatsApp</Text>
            </View>
          </View>
        );
      case 'DELIVERED':
        return (
          <View style={[styles.statusBadgeRow, styles.badgeSuccess]}>
            <Ionicons name="checkmark-done" size={16} color={colors.success} />
            <View style={styles.badgeTextWrap}>
              <Text style={styles.badgeLabel}>WhatsApp Receipt</Text>
              <Text style={[styles.badgeValue, { color: colors.success }]}>✓ Delivered to WhatsApp</Text>
            </View>
          </View>
        );
      case 'READ':
        return (
          <View style={[styles.statusBadgeRow, styles.badgeSuccess]}>
            <Ionicons name="checkmark-done-circle" size={16} color="#2563EB" />
            <View style={styles.badgeTextWrap}>
              <Text style={styles.badgeLabel}>WhatsApp Receipt</Text>
              <Text style={[styles.badgeValue, { color: '#2563EB' }]}>✓ Read on WhatsApp</Text>
            </View>
          </View>
        );
      case 'FAILED':
        return (
          <View style={[styles.statusBadgeRow, styles.badgeError]}>
            <Ionicons name="alert-circle" size={16} color={colors.danger} />
            <View style={styles.badgeTextWrap}>
              <Text style={styles.badgeLabel}>WhatsApp Receipt</Text>
              <Text style={[styles.badgeValue, { color: colors.danger }]}>⚠ Delivery failed</Text>
              <Text style={styles.badgeSubNote}>Your receipt is available in the app.</Text>
            </View>
          </View>
        );
      case 'NOT_SENT':
      default:
        return (
          <View style={[styles.statusBadgeRow, styles.badgeNeutral]}>
            <Ionicons name="information-circle-outline" size={16} color={colors.muted} />
            <View style={styles.badgeTextWrap}>
              <Text style={styles.badgeLabel}>WhatsApp Receipt</Text>
              <Text style={[styles.badgeValue, { color: colors.muted }]}>Not sent</Text>
            </View>
          </View>
        );
    }
  };

  const renderEmailBadge = () => {
    if (emailStatus === 'FAILED') {
      return (
        <View style={[styles.statusBadgeRow, styles.badgeError]}>
          <Ionicons name="alert-circle" size={16} color={colors.danger} />
          <View style={styles.badgeTextWrap}>
            <Text style={styles.badgeLabel}>Email Receipt</Text>
            <Text style={[styles.badgeValue, { color: colors.danger }]}>⚠ Email Failed</Text>
          </View>
        </View>
      );
    }

    if (emailStatus === 'QUEUED' || emailStatus === 'SENDING') {
      return (
        <View style={[styles.statusBadgeRow, styles.badgePending]}>
          <Ionicons name="time-outline" size={16} color="#D97706" />
          <View style={styles.badgeTextWrap}>
            <Text style={styles.badgeLabel}>Email Receipt</Text>
            <Text style={[styles.badgeValue, { color: '#D97706' }]}>⏳ Sending...</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.statusBadgeRow, styles.badgeSuccess]}>
        <Ionicons name="checkmark-circle" size={16} color={colors.success} />
        <View style={styles.badgeTextWrap}>
          <Text style={styles.badgeLabel}>Email Receipt</Text>
          <Text style={[styles.badgeValue, { color: colors.success }]}>✓ Sent</Text>
        </View>
      </View>
    );
  };

  if (compact) {
    return (
      <View style={[styles.compactContainer, style]}>
        <View style={styles.compactRow}>
          {renderEmailBadge()}
          {renderWhatsAppBadge()}
        </View>
        {showActions && (
          <View style={styles.compactActionsRow}>
            <GradientButton
              label={isOpeningView ? 'Opening...' : 'View Receipt'}
              variant="secondary"
              compact
              style={styles.flexBtn}
              onPress={handleViewReceipt}
            />
            <GradientButton
              label={isOpeningDownload ? 'Downloading...' : 'Download Receipt'}
              variant="secondary"
              compact
              style={styles.flexBtn}
              onPress={handleDownloadReceipt}
            />
          </View>
        )}
      </View>
    );
  }

  return (
    <SurfaceCard style={style}>
      <SectionTitle title={title} />

      <View style={styles.metaRow}>
        <Text style={styles.metaLabel}>Receipt Number</Text>
        <Text style={styles.metaValue}>{receiptNumber}</Text>
      </View>

      <View style={styles.badgesContainer}>
        {renderEmailBadge()}
        {renderWhatsAppBadge()}
      </View>

      {showActions && (
        <View style={styles.actionsContainer}>
          <GradientButton
            label={isOpeningView ? 'Opening Receipt...' : 'View Receipt'}
            icon={<Ionicons name="eye-outline" size={18} color={colors.surface} />}
            onPress={handleViewReceipt}
            disabled={isOpeningView}
          />
          <GradientButton
            label={isOpeningDownload ? 'Downloading...' : 'Download Receipt'}
            variant="secondary"
            icon={<Ionicons name="download-outline" size={18} color={colors.primary} />}
            onPress={handleDownloadReceipt}
            disabled={isOpeningDownload}
          />
        </View>
      )}
    </SurfaceCard>
  );
};

const styles = StyleSheet.create({
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  metaLabel: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    color: colors.muted,
  },
  metaValue: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 14,
    color: colors.text,
  },
  badgesContainer: {
    gap: 10,
    marginBottom: 14,
  },
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
  badgeSuccess: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  badgePending: {
    backgroundColor: '#FEFCE8',
    borderWidth: 1,
    borderColor: '#FEF08A',
  },
  badgeError: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  badgeNeutral: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  badgeTextWrap: {
    flex: 1,
  },
  badgeLabel: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  badgeValue: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 13,
    marginTop: 1,
  },
  badgeSubNote: {
    fontFamily: fontFamily.body,
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  actionsContainer: {
    gap: 10,
    marginTop: 4,
  },
  compactContainer: {
    gap: 8,
  },
  compactRow: {
    gap: 8,
  },
  compactActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  flexBtn: {
    flex: 1,
  },
});
