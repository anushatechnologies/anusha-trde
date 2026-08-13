import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, fontFamily, radius } from '../../constants/theme';
import { numberToWordsINR } from '../../utils/format';

export type InvestmentPaymentReceiptProps = {
  receiptNo?: string;
  receiptDate?: string;
  status?: string;
  currency?: string;
  investorName?: string;
  address?: string;
  mobile?: string;
  email?: string;
  description?: string;
  paymentMode?: string;
  referenceNo?: string;
  amount?: number;
  style?: ViewStyle;
};

export const InvestmentPaymentReceipt: React.FC<InvestmentPaymentReceiptProps> = ({
  receiptNo = 'AT-INV-2026-0001',
  receiptDate,
  status = 'PAID / RECEIVED',
  currency = 'INR',
  investorName = 'Rajesh Kumar',
  address = 'Hyderabad, Telangana, India',
  mobile = '98XXXXXXXX',
  email = 'investor@example.com',
  description = 'Business Investment',
  paymentMode = 'Bank Transfer',
  referenceNo = 'EXAMPLE20260810001',
  amount = 500000,
  style,
}) => {
  const displayDate = receiptDate || new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const formattedAmount = (amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const amountInWords = numberToWordsINR(amount);

  return (
    <View style={[styles.cardContainer, style]}>
      {/* Header Frame */}
      <View style={styles.headerFrame}>
        <View style={styles.logoWrap}>
          <Image
            source={require('../../assets/brand-logo.png')}
            style={styles.logoImg}
            resizeMode="contain"
          />
        </View>
        <View style={styles.companyInfo}>
          <Text style={styles.companyTitle}>ANUSHA TRADE</Text>
          <Text style={styles.companyAddress}>
            Rd No. 5, Laxminagar Colony, Vivekananda Nagar Extension, Kukatpally, Hyderabad, Telangana - 500072
          </Text>
          <Text style={styles.companyContact}>
            🌐 Website: https://anushatrade.com/{'\n'}
            ✉️ Email: anushamilktrading@gmail.com
          </Text>
        </View>
      </View>

      {/* Document Title */}
      <View style={styles.titleBlock}>
        <Text style={styles.mainTitle}>INVESTMENT PAYMENT RECEIPT</Text>
        <Text style={styles.subTitle}>SYSTEM GENERATED RECEIPT</Text>
      </View>

      {/* Receipt Meta Grid */}
      <View style={styles.tableBox}>
        <View style={styles.tableRow}>
          <View style={[styles.cell, styles.labelCell]}>
            <Text style={styles.labelText}>Receipt No.</Text>
          </View>
          <View style={[styles.cell, styles.valueCell]}>
            <Text style={styles.valueText}>{receiptNo}</Text>
          </View>
          <View style={[styles.cell, styles.labelCell]}>
            <Text style={styles.labelText}>Receipt Date</Text>
          </View>
          <View style={[styles.cell, styles.valueCell]}>
            <Text style={styles.valueText}>{displayDate}</Text>
          </View>
        </View>
        <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
          <View style={[styles.cell, styles.labelCell]}>
            <Text style={styles.labelText}>Status</Text>
          </View>
          <View style={[styles.cell, styles.valueCell]}>
            <Text style={styles.statusSuccess}>{status}</Text>
          </View>
          <View style={[styles.cell, styles.labelCell]}>
            <Text style={styles.labelText}>Currency</Text>
          </View>
          <View style={[styles.cell, styles.valueCell]}>
            <Text style={styles.valueText}>{currency}</Text>
          </View>
        </View>
      </View>

      {/* INVESTOR DETAILS */}
      <Text style={styles.sectionHeader}>INVESTOR DETAILS</Text>
      <View style={styles.tableBox}>
        <View style={styles.tableRow}>
          <View style={[styles.cell, styles.labelCellFull]}>
            <Text style={styles.labelText}>Investor Name</Text>
          </View>
          <View style={[styles.cell, styles.valueCellFull]}>
            <Text style={styles.valueText}>{investorName}</Text>
          </View>
        </View>
        <View style={styles.tableRow}>
          <View style={[styles.cell, styles.labelCellFull]}>
            <Text style={styles.labelText}>Address</Text>
          </View>
          <View style={[styles.cell, styles.valueCellFull]}>
            <Text style={styles.valueText}>{address}</Text>
          </View>
        </View>
        <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
          <View style={[styles.cell, styles.labelCellFull]}>
            <Text style={styles.labelText}>Mobile / Email</Text>
          </View>
          <View style={[styles.cell, styles.valueCellFull]}>
            <Text style={styles.valueText}>{mobile} | {email}</Text>
          </View>
        </View>
      </View>

      {/* INVESTMENT / PAYMENT DETAILS */}
      <Text style={styles.sectionHeader}>INVESTMENT / PAYMENT DETAILS</Text>
      <View style={styles.tableBox}>
        {/* Table Header */}
        <View style={styles.tableHeaderRow}>
          <Text style={[styles.headerCellText, { flex: 2.2 }]}>Description</Text>
          <Text style={[styles.headerCellText, { flex: 1.5 }]}>Payment Mode</Text>
          <Text style={[styles.headerCellText, { flex: 2 }]}>Reference / UTR</Text>
          <Text style={[styles.headerCellText, { flex: 1.8, textAlign: 'right' }]}>Amount</Text>
        </View>

        {/* Data Row */}
        <View style={styles.tableRow}>
          <Text style={[styles.dataCellText, { flex: 2.2 }]}>{description}</Text>
          <Text style={[styles.dataCellText, { flex: 1.5 }]}>{paymentMode}</Text>
          <Text style={[styles.dataCellText, { flex: 2 }]}>{referenceNo}</Text>
          <Text style={[styles.dataCellText, { flex: 1.8, textAlign: 'right', fontFamily: fontFamily.heading }]}>
            Rs. {formattedAmount}
          </Text>
        </View>

        {/* Amount in Words Row */}
        <View style={styles.tableRow}>
          <View style={[styles.cell, { flex: 2, backgroundColor: '#F8FAFC' }]}>
            <Text style={styles.labelText}>Amount in Words</Text>
          </View>
          <View style={[styles.cell, { flex: 4 }]}>
            <Text style={[styles.valueText, { fontFamily: fontFamily.bodySemi }]}>{amountInWords}</Text>
          </View>
        </View>

        {/* Total Amount Received Row */}
        <View style={[styles.tableRow, { backgroundColor: '#EFF6FF', borderBottomWidth: 0 }]}>
          <View style={[styles.cell, { flex: 3.5, backgroundColor: 'transparent' }]}>
            <Text style={[styles.labelText, { fontSize: 12, color: '#1E3A8A' }]}>TOTAL AMOUNT RECEIVED</Text>
          </View>
          <View style={[styles.cell, { flex: 2.5, alignItems: 'flex-end', backgroundColor: 'transparent' }]}>
            <Text style={[styles.valueText, { fontFamily: fontFamily.heading, fontSize: 15, color: '#1E3A8A' }]}>
              Rs. {formattedAmount}
            </Text>
          </View>
        </View>
      </View>

      {/* Notice Text */}
      <Text style={styles.noticeText}>
        This receipt acknowledges an investment/payment received by ANUSHA TRADE. For an actual transaction, replace the example investor, amount, payment reference and purpose with the genuine transaction details and maintain applicable supporting records.
      </Text>

      {/* Signature Section */}
      <View style={styles.signatureRow}>
        <View style={styles.signatureBlock}>
          <Text style={styles.sigTitle}>Investor / Payer</Text>
          <View style={styles.sigLine} />
          <Text style={styles.sigLabel}>Signature</Text>
        </View>

        <View style={[styles.signatureBlock, { alignItems: 'flex-end' }]}>
          <Text style={[styles.sigTitle, { color: '#1E3A8A' }]}>For ANUSHA TRADE</Text>
          <View style={styles.sigLine} />
          <Text style={styles.sigLabel}>Authorized Signatory</Text>
        </View>
      </View>

      {/* Bottom Footer Note */}
      <Text style={styles.footerNote}>
        System-generated document. Transaction data is verified.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginVertical: 10,
  },
  headerFrame: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1E40AF',
    borderRadius: radius.md,
    padding: 12,
    gap: 14,
    marginBottom: 16,
  },
  logoWrap: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImg: {
    width: 54,
    height: 54,
  },
  companyInfo: {
    flex: 1,
  },
  companyTitle: {
    fontFamily: fontFamily.heading,
    fontSize: 18,
    color: '#1E3A8A',
    letterSpacing: 0.5,
  },
  companyAddress: {
    fontFamily: fontFamily.body,
    fontSize: 10,
    color: '#334155',
    lineHeight: 14,
    marginTop: 2,
  },
  companyContact: {
    fontFamily: fontFamily.body,
    fontSize: 10,
    color: '#475569',
    lineHeight: 14,
    marginTop: 3,
  },
  titleBlock: {
    alignItems: 'center',
    marginBottom: 16,
  },
  mainTitle: {
    fontFamily: fontFamily.heading,
    fontSize: 18,
    color: '#1E3A8A',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  subTitle: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 10,
    color: colors.success,
    letterSpacing: 1,
    marginTop: 2,
  },
  sectionHeader: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 11,
    color: '#0F172A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 10,
    marginBottom: 6,
  },
  tableBox: {
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    overflow: 'hidden',
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E3A8A',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  headerCellText: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 11,
    color: colors.surface,
    textTransform: 'uppercase',
  },
  dataCellText: {
    fontFamily: fontFamily.body,
    fontSize: 11,
    color: '#334155',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  cell: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    justifyContent: 'center',
  },
  labelCell: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRightWidth: 1,
    borderRightColor: '#CBD5E1',
  },
  valueCell: {
    flex: 1.5,
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderRightColor: '#CBD5E1',
  },
  labelCellFull: {
    width: '32%',
    backgroundColor: '#F8FAFC',
    borderRightWidth: 1,
    borderRightColor: '#CBD5E1',
  },
  valueCellFull: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  labelText: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 11,
    color: '#0F172A',
  },
  valueText: {
    fontFamily: fontFamily.body,
    fontSize: 11,
    color: '#334155',
  },
  statusSuccess: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 11,
    color: colors.success,
  },
  noticeText: {
    fontFamily: fontFamily.body,
    fontSize: 10,
    color: '#64748B',
    lineHeight: 14,
    marginTop: 6,
    marginBottom: 16,
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 10,
  },
  signatureBlock: {
    width: '45%',
  },
  sigTitle: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 11,
    color: '#0F172A',
    marginBottom: 32,
  },
  sigLine: {
    width: '100%',
    height: 1,
    backgroundColor: '#94A3B8',
    marginBottom: 4,
  },
  sigLabel: {
    fontFamily: fontFamily.body,
    fontSize: 10,
    color: '#64748B',
  },
  footerNote: {
    fontFamily: fontFamily.body,
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 10,
  },
});
