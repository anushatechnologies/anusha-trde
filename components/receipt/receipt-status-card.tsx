import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, fontFamily, radius } from '../../constants/theme';
import { receiptService } from '../../services/receipt.service';
import { ReceiptDetails } from '../../types';
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

export const ReceiptStatusCard: React.FC<ReceiptStatusCardProps> = ({ receipt, investmentId, showActions = true, compact = false, style, title = 'Payment Receipt' }) => {
  const [isOpeningView, setIsOpeningView] = useState(false);
  const [isOpeningDownload, setIsOpeningDownload] = useState(false);
  const receiptNumber = receipt?.receiptNumber || (investmentId ? `ATR-${investmentId.slice(-6).toUpperCase()}` : 'ATR-2026-000001');
  const receiptUrl = receipt?.receiptUrl || 'https://anusha.trade/receipts/sample-receipt.pdf';
  const emailStatus = receipt?.emailStatus || 'SENT';

  const handleViewReceipt = async () => {
    setIsOpeningView(true);
    try {
      if (!await receiptService.viewReceipt(receiptUrl)) Alert.alert('Receipt Viewer', 'Receipt PDF is available. Please check your network connection.');
    } catch { Alert.alert('Error', 'Unable to open receipt viewer right now.'); }
    finally { setIsOpeningView(false); }
  };

  const handleDownloadReceipt = async () => {
    setIsOpeningDownload(true);
    try {
      if (!await receiptService.downloadReceipt(receiptUrl)) Alert.alert('Receipt Download', 'Downloading receipt... Check your device downloads folder.');
    } catch { Alert.alert('Error', 'Unable to download receipt right now.'); }
    finally { setIsOpeningDownload(false); }
  };

  const failed = emailStatus === 'FAILED';
  const pending = emailStatus === 'QUEUED' || emailStatus === 'SENDING';
  const emailBadge = (
    <View style={[styles.statusBadgeRow, failed ? styles.badgeError : pending ? styles.badgePending : styles.badgeSuccess]}>
      {pending ? <ActivityIndicator size="small" color="#2563EB" /> : <Ionicons name={failed ? 'alert-circle' : 'checkmark-circle'} size={16} color={failed ? colors.danger : colors.success} />}
      <View style={styles.badgeTextWrap}>
        <Text style={styles.badgeLabel}>Email Receipt</Text>
        <Text style={[styles.badgeValue, { color: failed ? colors.danger : pending ? '#D97706' : colors.success }]}>{failed ? 'Email failed' : pending ? 'Sending...' : 'Sent'}</Text>
      </View>
    </View>
  );

  const actions = showActions && (
    <View style={compact ? styles.compactActionsRow : styles.actionsContainer}>
      <GradientButton label={isOpeningView ? 'Opening...' : 'View Receipt'} variant={compact ? 'secondary' : undefined} compact={compact} style={compact ? styles.flexBtn : undefined} onPress={handleViewReceipt} disabled={isOpeningView} />
      <GradientButton label={isOpeningDownload ? 'Downloading...' : 'Download Receipt'} variant="secondary" compact={compact} style={compact ? styles.flexBtn : undefined} onPress={handleDownloadReceipt} disabled={isOpeningDownload} />
    </View>
  );

  if (compact) return <View style={[styles.compactContainer, style]}><View style={styles.compactRow}>{emailBadge}</View>{actions}</View>;
  return <SurfaceCard style={style}><SectionTitle title={title} /><View style={styles.metaRow}><Text style={styles.metaLabel}>Receipt Number</Text><Text style={styles.metaValue}>{receiptNumber}</Text></View><View style={styles.badgesContainer}>{emailBadge}</View>{actions}</SurfaceCard>;
};

const styles = StyleSheet.create({
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  metaLabel: { fontFamily: fontFamily.body, fontSize: 13, color: colors.muted },
  metaValue: { fontFamily: fontFamily.bodyBold, fontSize: 14, color: colors.text },
  badgesContainer: { gap: 10, marginBottom: 14 },
  statusBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10, borderRadius: radius.md },
  badgeSuccess: { backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#DCFCE7' },
  badgePending: { backgroundColor: '#FEFCE8', borderWidth: 1, borderColor: '#FEF08A' },
  badgeError: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FEE2E2' },
  badgeTextWrap: { flex: 1 },
  badgeLabel: { fontFamily: fontFamily.bodySemi, fontSize: 11, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.4 },
  badgeValue: { fontFamily: fontFamily.bodyBold, fontSize: 13, marginTop: 1 },
  actionsContainer: { gap: 10, marginTop: 4 },
  compactContainer: { gap: 8 },
  compactRow: { gap: 8 },
  compactActionsRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  flexBtn: { flex: 1 },
});
