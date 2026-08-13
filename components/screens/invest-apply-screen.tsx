import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { FadeInView } from '../../animations/fade-in-view';
import { runtimeConfig } from '../../constants/runtime-config';
import { colors, fontFamily, gradients, radius, shadows } from '../../constants/theme';
import { useInvestmentsQuery } from '../../hooks/use-app-queries';
import { useReceiptPolling } from '../../hooks/use-receipt-polling';
import { investmentService } from '../../services/investment.service';
import { Plan } from '../../types';
import { formatCurrency, formatPercent } from '../../utils/format';
import { useAuthStore } from '../../store/use-auth-store';
import { InvestmentPaymentReceipt } from '../receipt/investment-payment-receipt';
import { ReceiptStatusCard } from '../receipt/receipt-status-card';
import { AppScreen } from '../ui/app-screen';
import { GradientButton } from '../ui/gradient-button';
import { ScreenHeader } from '../ui/screen-header';
import { SectionTitle } from '../ui/section-title';
import { SkeletonBlock } from '../ui/skeleton-block';
import { SurfaceCard } from '../ui/surface-card';

type Step = 'amount' | 'payment' | 'receipt' | 'success';
type PaymentMode = 'NEFT' | 'RTGS' | 'IMPS' | 'UPI' | 'CASH' | 'CARD' | 'NETBANKING' | 'WALLET' | 'RAZORPAY';

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if ((window as any).Razorpay) return resolve(true);

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const COMPANY_PAYMENT_DETAILS = {
  accountName: 'Anusha Trades & Investments',
  bankName: 'ICICI Bank',
  accountNumber: '921020045618290',
  ifscCode: 'ICIC0000102',
  upiId: 'anushatrade@icici',
};

const PAYMENT_MODES: { value: PaymentMode; label: string; icon: string }[] = [
  { value: 'UPI', label: 'UPI', icon: 'qr-code-outline' },
  { value: 'NEFT', label: 'NEFT', icon: 'swap-horizontal-outline' },
  { value: 'RTGS', label: 'RTGS', icon: 'git-compare-outline' },
  { value: 'IMPS', label: 'IMPS', icon: 'flash-outline' },
  { value: 'NETBANKING', label: 'Net Banking', icon: 'globe-outline' },
  { value: 'CARD', label: 'Card', icon: 'card-outline' },
  { value: 'RAZORPAY', label: 'Razorpay Gateway', icon: 'card-sharp' },
];

const StepIndicator = ({ currentStep }: { currentStep: Step }) => {
  const steps: { key: Step; label: string }[] = [
    { key: 'amount', label: 'Amount' },
    { key: 'payment', label: 'Pay' },
    { key: 'receipt', label: 'Receipt' },
    { key: 'success', label: 'Done' },
  ];
  const currentIndex = steps.findIndex((s) => s.key === currentStep);

  return (
    <View style={stepStyles.container}>
      {steps.map((step, index) => {
        const isActive = index === currentIndex;
        const isCompleted = index < currentIndex;
        return (
          <View key={step.key} style={stepStyles.stepItem}>
            <View
              style={[
                stepStyles.dot,
                isActive && stepStyles.dotActive,
                isCompleted && stepStyles.dotCompleted,
              ]}
            >
              {isCompleted ? (
                <Ionicons name="checkmark" size={12} color={colors.surface} />
              ) : (
                <Text
                  style={[
                    stepStyles.dotText,
                    (isActive || isCompleted) && stepStyles.dotTextActive,
                  ]}
                >
                  {index + 1}
                </Text>
              )}
            </View>
            <Text
              style={[
                stepStyles.label,
                isActive && stepStyles.labelActive,
                isCompleted && stepStyles.labelCompleted,
              ]}
            >
              {step.label}
            </Text>
            {index < steps.length - 1 && (
              <View style={[stepStyles.line, isCompleted && stepStyles.lineCompleted]} />
            )}
          </View>
        );
      })}
    </View>
  );
};

const stepStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  dotActive: {
    borderColor: colors.primary,
    backgroundColor: '#EEF2FF',
  },
  dotCompleted: {
    borderColor: colors.success,
    backgroundColor: colors.success,
  },
  dotText: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 11,
    color: '#94A3B8',
  },
  dotTextActive: {
    color: colors.primary,
  },
  label: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    color: '#94A3B8',
  },
  labelActive: {
    color: colors.primary,
  },
  labelCompleted: {
    color: colors.success,
  },
  line: {
    width: 20,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 4,
    borderRadius: 1,
  },
  lineCompleted: {
    backgroundColor: colors.success,
  },
});

export const InvestApplyScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ planId?: string }>();
  const { data, isLoading } = useInvestmentsQuery();
  const user = useAuthStore((state) => state.user);

  const [step, setStep] = useState<Step>('amount');
  const [amountText, setAmountText] = useState('');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<PaymentMode>('UPI');
  const [bankReference, setBankReference] = useState('');
  const [receiptUri, setReceiptUri] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [investmentId, setInvestmentId] = useState('');
  const [paymentDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [couponCode, setCouponCode] = useState('');
  const [couponValidating, setCouponValidating] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; cashbackAmount: number; message: string } | null>(null);
  const [couponError, setCouponError] = useState('');

  const { receipt, setReceipt } = useReceiptPolling({
    investmentId,
    enabled: step === 'success',
  });

  const plan = useMemo(() => {
    if (!data?.plans?.length) return null;
    if (params.planId) {
      return data.plans.find((p) => p.id === params.planId) || data.plans[0];
    }
    return data.plans[0];
  }, [data?.plans, params.planId]);

  const amount = Number(amountText.replace(/[^0-9]/g, '')) || 0;

  const isAmountValid = plan ? amount >= plan.minInvestment && amount <= plan.maxInvestment : false;

  const dailyReturn = plan && isAmountValid ? (amount * plan.roi) / 100 : 0;
  const monthlyReturn = dailyReturn * 30;
  const totalReturn = plan ? dailyReturn * plan.termDays : 0;

  const handleValidateCoupon = async () => {
    if (!couponCode.trim() || !plan || !isAmountValid) return;
    setCouponValidating(true);
    setCouponError('');
    try {
      const result = await investmentService.validateCoupon(plan.id, amount, couponCode.trim());
      if (result.valid) {
        setAppliedCoupon({ code: result.couponCode, cashbackAmount: result.cashbackAmount, message: result.message });
        setCouponCode('');
      } else {
        setCouponError(result.message || 'Invalid coupon');
        setAppliedCoupon(null);
      }
    } catch (err: any) {
      setCouponError(err?.response?.data?.message || err?.message || 'Failed to validate coupon');
      setAppliedCoupon(null);
    } finally {
      setCouponValidating(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
  };

  const handleApplyInvestment = useCallback(async () => {
    if (!plan || !isAmountValid) return;

    setIsSubmitting(true);
    try {
      const result = await investmentService.applyManualInvestment(plan.id, amount, appliedCoupon?.code);
      setInvestmentId(result.id);
      setStep('payment');
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to apply investment.';
      Alert.alert('Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  }, [plan, amount, isAmountValid, appliedCoupon]);

  const handleCopyText = useCallback(async (text: string, label: string) => {
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert('Copied to Clipboard', `${label}: ${text}`);
    } catch {
      Alert.alert('Error', 'Unable to copy text.');
    }
  }, []);

  const handleInitiateRazorpay = useCallback(async () => {
    if (!plan || !isAmountValid) return;

    setIsSubmitting(true);
    try {
      // 1. Create Razorpay order on backend
      const checkoutData = await investmentService.createRazorpayCheckout(plan.id, amount, appliedCoupon?.code);
      setInvestmentId(checkoutData.investment.id);

      const razorpayKey = runtimeConfig.razorpayKeyId || checkoutData.checkout.keyId || 'rzp_live_TO6q7NUVnPM6bA';

      if (Platform.OS === 'web') {
        const loaded = await loadRazorpayScript();
        if (loaded && (window as any).Razorpay) {
          const options = {
            key: razorpayKey,
            amount: checkoutData.checkout.amount || amount * 100,
            currency: checkoutData.checkout.currency || 'INR',
            name: 'Anusha Trade',
            description: checkoutData.checkout.description || `Investment in ${plan.name}`,
            order_id: checkoutData.checkout.orderId,
            prefill: {
              name: checkoutData.checkout.investorName,
              email: checkoutData.checkout.investorEmail,
              contact: checkoutData.checkout.investorContact,
            },
            notes: {
              investmentId: checkoutData.investment.id,
              planId: plan.id,
            },
            handler: async (response: any) => {
              setIsSubmitting(true);
              try {
                // 2. Send payment response to backend for HMAC SHA256 Signature Verification
                const verifyRes = await investmentService.verifyRazorpayPayment(
                  checkoutData.investment.id,
                  response.razorpay_order_id,
                  response.razorpay_payment_id,
                  response.razorpay_signature
                );
                if (verifyRes.receipt) {
                  setReceipt(verifyRes.receipt);
                }
                Alert.alert('Payment Verified', verifyRes.message || 'Payment successfully verified.');
                setStep('success');
              } catch (err: any) {
                const msg = err?.response?.data?.message || err?.message || 'Signature verification failed.';
                Alert.alert('Payment Verification Failed', msg);
              } finally {
                setIsSubmitting(false);
              }
            },
            modal: {
              ondismiss: () => {
                Alert.alert('Payment Cancelled', 'Razorpay checkout was cancelled. You can retry or pay via bank/UPI.');
              },
            },
            theme: { color: '#2563EB' },
          };

          const rzp = new (window as any).Razorpay(options);
          rzp.open();
          setIsSubmitting(false);
          return;
        }
      }

      // Native fallback / Notice
      Alert.alert(
        'Razorpay Order Created',
        `Razorpay Order ID: ${checkoutData.checkout.orderId}\nAmount: ₹${amount}\n\nPlease complete payment using Razorpay gateway or use direct Bank/UPI transfer.`,
        [
          {
            text: 'Pay via Bank / UPI Transfer',
            onPress: () => {
              setSelectedPaymentMode('UPI');
            },
          },
        ]
      );
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to create online payment order.';
      Alert.alert('Razorpay Notice', `${msg}\nSwitching to direct UPI/Bank transfer mode.`);
      setSelectedPaymentMode('UPI');
    } finally {
      setIsSubmitting(false);
    }
  }, [plan, amount, isAmountValid, appliedCoupon]);

  const handlePickReceipt = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setReceiptUri(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Error', 'Could not open image picker.');
    }
  }, []);

  const handleUploadReceipt = useCallback(async () => {
    if (!receiptUri || !investmentId) return;

    setIsSubmitting(true);
    try {
      await investmentService.uploadPaymentReceipt(
        investmentId,
        receiptUri,
        amount,
        paymentDate,
        selectedPaymentMode === 'RAZORPAY' ? 'CARD' : selectedPaymentMode,
        bankReference
      );
      setStep('success');
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to upload receipt.';
      Alert.alert('Upload Failed', msg);
    } finally {
      setIsSubmitting(false);
    }
  }, [receiptUri, investmentId, amount, paymentDate, selectedPaymentMode, bankReference]);

  if (isLoading || !data) {
    return (
      <AppScreen>
        <ScreenHeader title="New Investment" subtitle="Loading plans..." onBackPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/invest'))} />
        <SkeletonBlock height={180} />
        <SkeletonBlock height={240} />
      </AppScreen>
    );
  }

  if (!plan) {
    return (
      <AppScreen>
        <ScreenHeader title="New Investment" subtitle="No plans available." onBackPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/invest'))} />
        <SurfaceCard>
          <Text style={styles.emptyText}>No investment plans are currently available. Please try again later.</Text>
        </SurfaceCard>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <ScreenHeader
        title="New Investment"
        subtitle={`Invest in ${plan.name}`}
        onBackPress={() => {
          if (step === 'amount' || step === 'success') {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/(tabs)/invest');
            }
          } else if (step === 'payment') {
            setStep('amount');
          } else if (step === 'receipt') {
            setStep('payment');
          }
        }}
      />

      <StepIndicator currentStep={step} />

      {/* Plan Summary Card */}
      <SurfaceCard gradient={gradients.primary}>
        <View style={styles.planHeroRow}>
          <View style={styles.planHeroCopy}>
            <Text style={styles.planHeroName}>{plan.name}</Text>
            <Text style={styles.planHeroDesc}>{plan.description}</Text>
          </View>
          <LinearGradient
            colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.04)']}
            style={styles.planHeroIcon}
          >
            <Text style={styles.planHeroRoi}>{formatPercent(plan.roi)}</Text>
            <Text style={styles.planHeroRoiLabel}>Monthly</Text>
          </LinearGradient>
        </View>
        <View style={styles.planMetaStrip}>
          <View style={styles.planMetaItem}>
            <Text style={styles.planMetaLabel}>Min</Text>
            <Text style={styles.planMetaValue}>{formatCurrency(plan.minInvestment)}</Text>
          </View>
          <View style={styles.planMetaItem}>
            <Text style={styles.planMetaLabel}>Max</Text>
            <Text style={styles.planMetaValue}>{formatCurrency(plan.maxInvestment)}</Text>
          </View>
          <View style={styles.planMetaItem}>
            <Text style={styles.planMetaLabel}>Term</Text>
            <Text style={styles.planMetaValue}>{plan.termDays}d</Text>
          </View>
        </View>
      </SurfaceCard>

      {/* STEP: Amount Entry */}
      {step === 'amount' && (
        <FadeInView>
          <SurfaceCard>
            <SectionTitle title="Investment Amount" />
            <Text style={styles.inputLabel}>
              Enter amount between {formatCurrency(plan.minInvestment)} – {formatCurrency(plan.maxInvestment)}
            </Text>
            <View style={styles.amountInputWrap}>
              <Text style={styles.currencyPrefix}>₹</Text>
              <TextInput
                style={styles.amountInput}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor="#94A3B8"
                value={amountText}
                onChangeText={(val) => setAmountText(val.replace(/[^0-9]/g, ''))}
                autoFocus
              />
            </View>
            {amount > 0 && !isAmountValid && (
              <Text style={styles.errorText}>
                Amount must be between {formatCurrency(plan.minInvestment)} and {formatCurrency(plan.maxInvestment)}
              </Text>
            )}
          </SurfaceCard>

          {isAmountValid && (
            <FadeInView delay={100}>
              <SurfaceCard>
                <SectionTitle title="Projected Returns" />
                <View style={styles.projectionGrid}>
                  <View style={styles.projectionCell}>
                    <Ionicons name="today-outline" size={20} color={colors.primary} />
                    <Text style={styles.projectionLabel}>Daily</Text>
                    <Text style={styles.projectionValue}>{formatCurrency(dailyReturn)}</Text>
                  </View>
                  <View style={styles.projectionCell}>
                    <Ionicons name="calendar-outline" size={20} color={colors.secondary} />
                    <Text style={styles.projectionLabel}>Monthly</Text>
                    <Text style={styles.projectionValue}>{formatCurrency(monthlyReturn)}</Text>
                  </View>
                  <View style={styles.projectionCell}>
                    <Ionicons name="trophy-outline" size={20} color={colors.success} />
                    <Text style={styles.projectionLabel}>Total ({plan.termDays}d)</Text>
                    <Text style={[styles.projectionValue, { color: colors.success }]}>
                      {formatCurrency(totalReturn)}
                    </Text>
                  </View>
                </View>
              </SurfaceCard>
            </FadeInView>
          )}

          {isAmountValid && (
            <FadeInView delay={200}>
              <SurfaceCard>
                <SectionTitle title="Apply Coupon" />
                {appliedCoupon ? (
                  <View style={styles.appliedCouponBox}>
                    <View style={styles.appliedCouponInfo}>
                      <Ionicons name="pricetag" size={20} color={colors.success} />
                      <View>
                        <Text style={styles.appliedCouponCode}>{appliedCoupon.code}</Text>
                        <Text style={styles.appliedCouponMsg}>{appliedCoupon.message}</Text>
                      </View>
                    </View>
                    <Pressable onPress={removeCoupon} style={styles.removeCouponBtn}>
                      <Ionicons name="close-circle" size={24} color={colors.muted} />
                    </Pressable>
                  </View>
                ) : (
                  <View>
                    <View style={styles.couponInputWrap}>
                      <Ionicons name="pricetag-outline" size={20} color={colors.muted} />
                      <TextInput
                        style={styles.couponInput}
                        placeholder="Enter coupon code"
                        placeholderTextColor="#94A3B8"
                        autoCapitalize="characters"
                        value={couponCode}
                        onChangeText={setCouponCode}
                      />
                      <Pressable 
                        onPress={handleValidateCoupon} 
                        disabled={!couponCode.trim() || couponValidating}
                        style={[styles.applyCouponBtn, (!couponCode.trim() || couponValidating) && styles.applyCouponBtnDisabled]}
                      >
                        {couponValidating ? (
                          <ActivityIndicator size="small" color={colors.surface} />
                        ) : (
                          <Text style={styles.applyCouponBtnText}>Apply</Text>
                        )}
                      </Pressable>
                    </View>
                    {couponError ? <Text style={styles.errorText}>{couponError}</Text> : null}
                  </View>
                )}
              </SurfaceCard>
            </FadeInView>
          )}

          <GradientButton
            label={isSubmitting ? 'Applying...' : 'Proceed to Payment'}
            icon={
              isSubmitting ? (
                <ActivityIndicator size="small" color={colors.surface} />
              ) : (
                <Ionicons name="arrow-forward" size={18} color={colors.surface} />
              )
            }
            iconPosition="end"
            onPress={handleApplyInvestment}
            disabled={!isAmountValid || isSubmitting}
          />
        </FadeInView>
      )}

      {/* STEP: Payment Method */}
      {step === 'payment' && (
        <FadeInView>
          {/* Official Company Payment Details */}
          <SurfaceCard style={{ borderLeftWidth: 4, borderLeftColor: colors.primary }}>
            <SectionTitle title="Official Payment Details" />
            <Text style={styles.inputLabel}>
              Please transfer <Text style={{ fontFamily: fontFamily.heading, color: colors.primary }}>{formatCurrency(amount)}</Text> to the company bank account or UPI ID below:
            </Text>

            <View style={styles.bankDetailBox}>
              <View style={styles.bankDetailRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bankDetailLabel}>Account Holder Name</Text>
                  <Text style={styles.bankDetailValue}>{COMPANY_PAYMENT_DETAILS.accountName}</Text>
                </View>
              </View>

              <View style={styles.bankDetailRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bankDetailLabel}>Bank Name</Text>
                  <Text style={styles.bankDetailValue}>{COMPANY_PAYMENT_DETAILS.bankName}</Text>
                </View>
              </View>

              <View style={styles.bankDetailRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bankDetailLabel}>Account Number</Text>
                  <Text style={styles.bankDetailValue}>{COMPANY_PAYMENT_DETAILS.accountNumber}</Text>
                </View>
                <Pressable
                  style={styles.copyBtn}
                  onPress={() => handleCopyText(COMPANY_PAYMENT_DETAILS.accountNumber, 'Account Number')}
                >
                  <Ionicons name="copy-outline" size={14} color={colors.primary} />
                  <Text style={styles.copyBtnText}>Copy</Text>
                </Pressable>
              </View>

              <View style={styles.bankDetailRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bankDetailLabel}>IFSC Code</Text>
                  <Text style={styles.bankDetailValue}>{COMPANY_PAYMENT_DETAILS.ifscCode}</Text>
                </View>
                <Pressable
                  style={styles.copyBtn}
                  onPress={() => handleCopyText(COMPANY_PAYMENT_DETAILS.ifscCode, 'IFSC Code')}
                >
                  <Ionicons name="copy-outline" size={14} color={colors.primary} />
                  <Text style={styles.copyBtnText}>Copy</Text>
                </Pressable>
              </View>

              <View style={[styles.bankDetailRow, { borderBottomWidth: 0 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bankDetailLabel}>Official UPI ID</Text>
                  <Text style={[styles.bankDetailValue, { color: colors.primary }]}>{COMPANY_PAYMENT_DETAILS.upiId}</Text>
                </View>
                <Pressable
                  style={styles.copyBtn}
                  onPress={() => handleCopyText(COMPANY_PAYMENT_DETAILS.upiId, 'UPI ID')}
                >
                  <Ionicons name="copy-outline" size={14} color={colors.primary} />
                  <Text style={styles.copyBtnText}>Copy</Text>
                </Pressable>
              </View>
            </View>
          </SurfaceCard>

          <SurfaceCard>
            <SectionTitle title="Select Payment Mode" />
            <Text style={styles.inputLabel}>Choose how you wish to pay</Text>
            <View style={styles.paymentGrid}>
              {PAYMENT_MODES.map((mode) => {
                const isSelected = selectedPaymentMode === mode.value;
                return (
                  <Pressable
                    key={mode.value}
                    onPress={() => setSelectedPaymentMode(mode.value)}
                    style={[styles.paymentOption, isSelected && styles.paymentOptionActive]}
                  >
                    <View style={[styles.paymentIconWrap, isSelected && styles.paymentIconWrapActive]}>
                      <Ionicons
                        name={mode.icon as any}
                        size={20}
                        color={isSelected ? colors.surface : colors.muted}
                      />
                    </View>
                    <Text style={[styles.paymentLabel, isSelected && styles.paymentLabelActive]}>
                      {mode.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </SurfaceCard>

          {selectedPaymentMode === 'RAZORPAY' ? (
            <SurfaceCard>
              <SectionTitle title="Instant Online Gateway" />
              <Text style={styles.inputLabel}>Pay securely via Cards, NetBanking or UPI Gateway</Text>
              <GradientButton
                label={isSubmitting ? 'Initiating Gateway...' : 'Pay Online via Gateway'}
                icon={
                  isSubmitting ? (
                    <ActivityIndicator size="small" color={colors.surface} />
                  ) : (
                    <Ionicons name="card-outline" size={18} color={colors.surface} />
                  )
                }
                onPress={handleInitiateRazorpay}
                disabled={isSubmitting}
              />
            </SurfaceCard>
          ) : (
            <>
              <SurfaceCard>
                <SectionTitle title="Bank Reference / UTR Number" />
                <TextInput
                  style={styles.textInputField}
                  placeholder="Enter 12-digit UTR or Transaction ID"
                  placeholderTextColor="#94A3B8"
                  value={bankReference}
                  onChangeText={setBankReference}
                />
              </SurfaceCard>

              <SurfaceCard>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Investment Amount</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(amount)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Plan</Text>
                  <Text style={styles.summaryValue}>{plan.name}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Payment Mode</Text>
                  <Text style={styles.summaryValue}>{selectedPaymentMode}</Text>
                </View>
              </SurfaceCard>

              <GradientButton
                label="Next: Upload Payment Receipt"
                icon={<Ionicons name="arrow-forward" size={18} color={colors.surface} />}
                iconPosition="end"
                onPress={() => setStep('receipt')}
              />
            </>
          )}
        </FadeInView>
      )}

      {/* STEP: Receipt Upload */}
      {step === 'receipt' && (
        <FadeInView>
          <SurfaceCard>
            <SectionTitle title="Upload Payment Receipt" />
            <Text style={styles.inputLabel}>
              Upload a screenshot or photo of your payment confirmation
            </Text>

            <Pressable
              onPress={handlePickReceipt}
              style={[styles.receiptUploadZone, receiptUri ? styles.receiptUploadZoneSelected : null]}
            >
              {receiptUri ? (
                <View style={styles.receiptSelected}>
                  <Ionicons name="checkmark-circle" size={40} color={colors.success} />
                  <Text style={styles.receiptSelectedText}>Receipt selected</Text>
                  <Text style={styles.receiptChangeText}>Tap to change</Text>
                </View>
              ) : (
                <View style={styles.receiptPlaceholder}>
                  <View style={styles.receiptUploadIconWrap}>
                    <Ionicons name="cloud-upload-outline" size={36} color={colors.primary} />
                  </View>
                  <Text style={styles.receiptPlaceholderTitle}>Tap to upload</Text>
                  <Text style={styles.receiptPlaceholderSubtitle}>
                    JPG, PNG up to 10MB
                  </Text>
                </View>
              )}
            </Pressable>
          </SurfaceCard>

          <SurfaceCard>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Amount</Text>
              <Text style={styles.summaryValue}>{formatCurrency(amount)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Payment</Text>
              <Text style={styles.summaryValue}>{selectedPaymentMode}</Text>
            </View>
            {bankReference ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Reference</Text>
                <Text style={styles.summaryValue}>{bankReference}</Text>
              </View>
            ) : null}
          </SurfaceCard>

          <GradientButton
            label={isSubmitting ? 'Uploading...' : 'Submit Investment'}
            icon={
              isSubmitting ? (
                <ActivityIndicator size="small" color={colors.surface} />
              ) : (
                <Ionicons name="checkmark-circle" size={18} color={colors.surface} />
              )
            }
            onPress={handleUploadReceipt}
            disabled={!receiptUri || isSubmitting}
          />
        </FadeInView>
      )}

      {/* STEP: Success */}
      {step === 'success' && (
        <FadeInView>
          <SurfaceCard>
            <View style={styles.successContent}>
              <LinearGradient
                colors={[colors.success, '#16A34A']}
                style={styles.successIconWrap}
              >
                <Ionicons name="checkmark" size={48} color={colors.surface} />
              </LinearGradient>
              <Text style={styles.successTitle}>Investment Submitted!</Text>
              <Text style={styles.successSubtitle}>
                Your investment of {formatCurrency(amount)} in {plan.name} has been submitted for review.
                You'll be notified once it's approved.
              </Text>
            </View>
          </SurfaceCard>

          <SurfaceCard>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Plan</Text>
              <Text style={styles.summaryValue}>{plan.name}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Amount</Text>
              <Text style={styles.summaryValue}>{formatCurrency(amount)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Monthly ROI</Text>
              <Text style={[styles.summaryValue, { color: colors.success }]}>{formatPercent(plan.roi)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Status</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusBadgeText}>Under Review</Text>
              </View>
            </View>
          </SurfaceCard>

          {/* Official Investment Payment Receipt matching specifications */}
          <InvestmentPaymentReceipt
            receiptNo={`AT-INV-2026-${(investmentId || '0001').slice(-4).toUpperCase()}`}
            receiptDate={paymentDate}
            status="PAID / RECEIVED"
            currency="INR"
            investorName={user?.name || 'Mr. Rajesh Kumar'}
            address={user?.address || 'Hyderabad, Telangana, India'}
            mobile={user?.mobile || '98XXXXXXXX'}
            email={user?.email || 'investor@example.com'}
            description={`${plan.name} (Investment)`}
            paymentMode={selectedPaymentMode}
            referenceNo={bankReference || `EXAMPLE20260810${(investmentId || '001').slice(-3)}`}
            amount={amount}
          />

          <ReceiptStatusCard
            receipt={receipt}
            investmentId={investmentId}
            amount={amount}
          />

          <GradientButton
            label="View Investments"
            icon={<Ionicons name="pie-chart-outline" size={18} color={colors.surface} />}
            onPress={() => router.replace('/investment-status')}
          />
          <GradientButton
            label="Back to Home"
            variant="secondary"
            icon={<Ionicons name="home-outline" size={18} color={colors.primary} />}
            onPress={() => router.replace('/(tabs)')}
          />
        </FadeInView>
      )}
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  planHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  planHeroCopy: {
    flex: 1,
    gap: 4,
  },
  planHeroName: {
    fontFamily: fontFamily.heading,
    fontSize: 24,
    color: colors.surface,
  },
  planHeroDesc: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.82)',
  },
  planHeroIcon: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  planHeroRoi: {
    fontFamily: fontFamily.heading,
    fontSize: 22,
    color: colors.surface,
  },
  planHeroRoiLabel: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  planMetaStrip: {
    flexDirection: 'row',
    gap: 10,
  },
  planMetaItem: {
    flex: 1,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(255,255,255,0.12)',
    padding: 10,
    gap: 3,
    alignItems: 'center',
  },
  planMetaLabel: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
  },
  planMetaValue: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 14,
    color: colors.surface,
  },
  inputLabel: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    color: colors.muted,
    marginBottom: 4,
  },
  amountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: '#DBEAFE',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    gap: 6,
  },
  currencyPrefix: {
    fontFamily: fontFamily.heading,
    fontSize: 28,
    color: colors.primary,
  },
  amountInput: {
    flex: 1,
    minHeight: 64,
    fontFamily: fontFamily.heading,
    fontSize: 32,
    color: colors.text,
  },
  errorText: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    color: colors.danger || '#EF4444',
    marginTop: 2,
  },
  couponInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 10,
  },
  couponInput: {
    flex: 1,
    fontFamily: fontFamily.bodySemi,
    fontSize: 15,
    color: colors.text,
  },
  applyCouponBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  applyCouponBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  applyCouponBtnText: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 13,
    color: colors.surface,
  },
  appliedCouponBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: radius.md,
    padding: 12,
  },
  appliedCouponInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  appliedCouponCode: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 15,
    color: colors.success,
  },
  appliedCouponMsg: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    color: '#166534',
  },
  removeCouponBtn: {
    padding: 4,
  },
  emptyText: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    color: colors.muted,
  },
  projectionGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  projectionCell: {
    flex: 1,
    borderRadius: radius.sm,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    alignItems: 'center',
    gap: 6,
  },
  projectionLabel: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    color: colors.muted,
  },
  projectionValue: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 16,
    color: colors.text,
  },
  paymentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  paymentOption: {
    width: '30%',
    flexGrow: 1,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    paddingVertical: 14,
    alignItems: 'center',
    gap: 8,
  },
  paymentOptionActive: {
    borderColor: colors.primary,
    backgroundColor: '#EEF2FF',
  },
  paymentIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentIconWrapActive: {
    backgroundColor: colors.primary,
  },
  paymentLabel: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    color: colors.muted,
  },
  paymentLabelActive: {
    color: colors.primary,
    fontFamily: fontFamily.bodyBold,
  },
  textInputField: {
    minHeight: 52,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    fontFamily: fontFamily.bodySemi,
    fontSize: 15,
    color: colors.text,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  summaryLabel: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    color: colors.muted,
  },
  summaryValue: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 15,
    color: colors.text,
  },
  receiptUploadZone: {
    borderRadius: radius.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptUploadZoneSelected: {
    borderColor: colors.success,
    backgroundColor: '#F0FDF4',
    borderStyle: 'solid',
  },
  receiptPlaceholder: {
    alignItems: 'center',
    gap: 8,
  },
  receiptUploadIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  receiptPlaceholderTitle: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 16,
    color: colors.text,
  },
  receiptPlaceholderSubtitle: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    color: colors.muted,
  },
  receiptSelected: {
    alignItems: 'center',
    gap: 6,
  },
  receiptSelectedText: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 16,
    color: colors.success,
  },
  receiptChangeText: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    color: colors.muted,
  },
  successContent: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  successIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.glow,
  },
  successTitle: {
    fontFamily: fontFamily.heading,
    fontSize: 24,
    color: colors.text,
    textAlign: 'center',
  },
  successSubtitle: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    lineHeight: 22,
    color: colors.muted,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  statusBadge: {
    borderRadius: radius.pill,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 11,
    color: '#D97706',
  },
  bankDetailBox: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    backgroundColor: '#F8FAFC',
    marginTop: 10,
    overflow: 'hidden',
  },
  bankDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  bankDetailLabel: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 11,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  bankDetailValue: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 14,
    color: colors.text,
    marginTop: 2,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  copyBtnText: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 12,
    color: colors.primary,
  },
});
