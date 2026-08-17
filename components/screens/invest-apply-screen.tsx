import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import RazorpayCheckout from 'react-native-razorpay';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { runtimeConfig } from '../../constants/runtime-config';
import { colors, fontFamily, gradients, radius, shadows } from '../../constants/theme';
import { queryKeys, useInvestmentsQuery } from '../../hooks/use-app-queries';
import { investmentService } from '../../services/investment.service';
import { kycService } from '../../services/kyc.service';
import { Plan, ReceiptDetails } from '../../types';
import { formatCurrency, formatPercent } from '../../utils/format';
import { useAuthStore } from '../../store/use-auth-store';
import { KycGateModal } from '../kyc/kyc-gate-modal';
import { ReceiptStatusCard } from '../receipt/receipt-status-card';
import { AppScreen } from '../ui/app-screen';
import { GradientButton } from '../ui/gradient-button';
import { ScreenHeader } from '../ui/screen-header';
import { SectionTitle } from '../ui/section-title';
import { SkeletonBlock } from '../ui/skeleton-block';
import { SurfaceCard } from '../ui/surface-card';

type Step = 'configure' | 'success';

type VerifiedPaymentInfo = {
  paymentId: string;
  orderId: string;
  verifiedAt: string;
  amount: number;
};

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

const PRESET_AMOUNTS = [5000, 10000, 25000, 50000, 100000];

export const InvestApplyScreen = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ planId?: string }>();
  const { data, isLoading } = useInvestmentsQuery();
  const user = useAuthStore((state) => state.user);
  const kycQuery = useQuery({
    queryKey: ['kyc-status'],
    queryFn: kycService.getKycStatus,
    enabled: Boolean(user),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  });

  const [step, setStep] = useState<Step>('configure');
  const [amountText, setAmountText] = useState('10000');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [investmentId, setInvestmentId] = useState('');
  const [receipt, setReceipt] = useState<ReceiptDetails | null>(null);
  const [verifiedPayment, setVerifiedPayment] = useState<VerifiedPaymentInfo | null>(null);

  const [couponCode, setCouponCode] = useState('');
  const [couponValidating, setCouponValidating] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; cashbackAmount: number; message: string } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [kycGateVisible, setKycGateVisible] = useState(false);

  const plan = useMemo(() => {
    if (!data?.plans?.length) return null;
    if (params.planId) {
      return data.plans.find((p) => p.id === params.planId) || data.plans[0];
    }
    return data.plans[0];
  }, [data?.plans, params.planId]);

  const amount = Number(amountText.replace(/[^0-9]/g, '')) || 0;
  const effectiveKycStatus = (
    kycQuery.data?.kycStatus || user?.kycStatus || 'NOT_SUBMITTED'
  ).toUpperCase();
  const isAmountValid = plan ? amount >= plan.minInvestment && amount <= plan.maxInvestment : false;

  const dailyReturn = plan && isAmountValid ? (amount * plan.roi) / 100 : 0;
  const monthlyReturn = dailyReturn * 30;
  const totalReturn = plan ? dailyReturn * plan.termDays : 0;

  const refreshAppData = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
      queryClient.invalidateQueries({ queryKey: queryKeys.investments }),
      queryClient.invalidateQueries({ queryKey: queryKeys.wallet }),
      queryClient.invalidateQueries({ queryKey: queryKeys.team }),
    ]);
  }, [queryClient]);

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

  /**
   * 100% Automated Razorpay Payment Trigger
   * ONLY transitions to step === 'success' after backend HMAC-SHA256 signature verification passes.
   */
  const handlePayWithRazorpay = useCallback(async () => {
    if (!plan || !isAmountValid) return;

    if (effectiveKycStatus !== 'APPROVED') {
      setKycGateVisible(true);
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create Razorpay checkout order on backend
      const checkoutData = await investmentService.createRazorpayCheckout(plan.id, amount, appliedCoupon?.code);
      const invId = checkoutData.investment.id;
      setInvestmentId(invId);

      const razorpayKey = runtimeConfig.razorpayKeyId || checkoutData.checkout.keyId;
      if (!razorpayKey) {
        throw new Error('Razorpay Key is not configured. Please check environment configuration or contact support.');
      }

      if (Platform.OS === 'web') {
        const loaded = await loadRazorpayScript();
        if (loaded && (window as any).Razorpay) {
          const options = {
            key: razorpayKey,
            amount: checkoutData.checkout.amount || amount * 100,
            currency: checkoutData.checkout.currency || 'INR',
            name: 'Anusha Trades',
            description: checkoutData.checkout.description || `Investment in ${plan.name}`,
            order_id: checkoutData.checkout.orderId,
            prefill: {
              name: checkoutData.checkout.investorName || user?.name || '',
              email: checkoutData.checkout.investorEmail || user?.email || '',
              contact: checkoutData.checkout.investorContact || user?.mobile || '',
            },
            notes: {
              investmentId: invId,
              planId: plan.id,
            },
            handler: async (response: any) => {
              setIsSubmitting(true);
              try {
                // 2. Automated HMAC-SHA256 Signature Verification on Backend
                const verifyRes = await investmentService.verifyRazorpayPayment(
                  invId,
                  response.razorpay_order_id,
                  response.razorpay_payment_id,
                  response.razorpay_signature
                );
                
                if (verifyRes.receipt) {
                  setReceipt(verifyRes.receipt);
                }

                setVerifiedPayment({
                  paymentId: response.razorpay_payment_id,
                  orderId: response.razorpay_order_id,
                  verifiedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  amount,
                });

                await refreshAppData();
                // ONLY show success after verification succeeds
                setStep('success');
              } catch (err: any) {
                const msg = err?.response?.data?.message || err?.message || 'Payment signature verification failed.';
                Alert.alert('Payment Verification Failed', msg);
              } finally {
                setIsSubmitting(false);
              }
            },
            modal: {
              ondismiss: () => {
                Alert.alert('Payment Cancelled', 'Razorpay checkout was closed. You can retry at any time.');
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

      // Native Android/iOS Razorpay Checkout
      const nativePayment = await RazorpayCheckout.open({
        key: razorpayKey,
        amount: checkoutData.checkout.amount || amount * 100,
        currency: checkoutData.checkout.currency || 'INR',
        name: 'Anusha Trades',
        description: checkoutData.checkout.description || `Investment in ${plan.name}`,
        order_id: checkoutData.checkout.orderId,
        prefill: {
          name: checkoutData.checkout.investorName || user?.name || '',
          email: checkoutData.checkout.investorEmail || user?.email || '',
          contact: checkoutData.checkout.investorContact || user?.mobile || '',
        },
        notes: {
          investmentId: invId,
          planId: plan.id,
        },
        theme: { color: '#2563EB' },
      });

      // 2. Verify signature on backend
      const verifyRes = await investmentService.verifyRazorpayPayment(
        invId,
        nativePayment.razorpay_order_id,
        nativePayment.razorpay_payment_id,
        nativePayment.razorpay_signature
      );

      if (verifyRes.receipt) {
        setReceipt(verifyRes.receipt);
      }

      setVerifiedPayment({
        paymentId: nativePayment.razorpay_payment_id,
        orderId: nativePayment.razorpay_order_id,
        verifiedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        amount,
      });

      await refreshAppData();
      // ONLY show success after verification succeeds
      setStep('success');
    } catch (error: any) {
      if (
        error?.code === 0 ||
        error?.description?.toLowerCase()?.includes('cancel') ||
        error?.message?.toLowerCase()?.includes('cancel')
      ) {
        Alert.alert('Payment Cancelled', 'Razorpay checkout was cancelled. You can retry at any time.');
        return;
      }
      const msg = error?.response?.data?.message || error?.message || 'Failed to complete Razorpay payment.';
      Alert.alert('Razorpay Payment', msg);
    } finally {
      setIsSubmitting(false);
    }
  }, [plan, amount, isAmountValid, appliedCoupon, user, refreshAppData]);

  if (isLoading && !data) {
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
        title={step === 'success' ? 'Investment Confirmed' : 'Invest via Razorpay'}
        subtitle={`Plan: ${plan.name}`}
        onBackPress={() => {
          if (step === 'success') {
            router.replace('/(tabs)');
          } else if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/(tabs)/invest');
          }
        }}
      />

      {step === 'configure' ? (
        <View style={{ width: '100%' }}>
          {/* Plan Highlight Banner */}
          <SurfaceCard gradient={gradients.primary} style={styles.planCard}>
            <View style={styles.planHeroRow}>
              <View style={styles.planHeroCopy}>
                <Text style={styles.planHeroName}>{plan.name}</Text>
                <Text style={styles.planHeroDesc}>{plan.description}</Text>
              </View>
              <LinearGradient
                colors={['rgba(255,255,255,0.22)', 'rgba(255,255,255,0.06)']}
                style={styles.planHeroIcon}
              >
                <Text style={styles.planHeroRoi}>{formatPercent(plan.roi)}</Text>
                <Text style={styles.planHeroRoiLabel}>Monthly</Text>
              </LinearGradient>
            </View>

            <View style={styles.planMetaStrip}>
              <View style={styles.planMetaItem}>
                <Text style={styles.planMetaLabel}>Min Invest</Text>
                <Text style={styles.planMetaValue}>{formatCurrency(plan.minInvestment)}</Text>
              </View>
              <View style={styles.planMetaItem}>
                <Text style={styles.planMetaLabel}>Max Limit</Text>
                <Text style={styles.planMetaValue}>{formatCurrency(plan.maxInvestment)}</Text>
              </View>
              <View style={styles.planMetaItem}>
                <Text style={styles.planMetaLabel}>Lock-in Term</Text>
                <Text style={styles.planMetaValue}>{plan.termDays} Days</Text>
              </View>
            </View>
          </SurfaceCard>

          {/* KYC Status Reminder if not approved */}
          {effectiveKycStatus !== 'APPROVED' ? (
            <Pressable
              onPress={() => setKycGateVisible(true)}
              style={styles.kycWarningBox}
            >
              <View style={styles.kycWarningIconWrap}>
                <Ionicons
                  name={effectiveKycStatus === 'PENDING' ? 'time-outline' : 'shield-outline'}
                  size={20}
                  color={effectiveKycStatus === 'PENDING' ? colors.cyan : colors.warningLight}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.kycWarningTitle}>
                  {effectiveKycStatus === 'PENDING' ? 'KYC Under Verification' : 'KYC Verification Required'}
                </Text>
                <Text style={styles.kycWarningSubtitle}>
                  {effectiveKycStatus === 'PENDING'
                    ? 'Compliance review in progress. Tap to check status.'
                    : 'Verify your identity to activate automated daily payouts.'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </Pressable>
          ) : null}

          {/* Amount Entry Card */}
          <SurfaceCard style={styles.amountCard}>
            <SectionTitle title="Investment Amount" />
            <Text style={styles.inputLabel}>
              Enter amount ({formatCurrency(plan.minInvestment)} – {formatCurrency(plan.maxInvestment)})
            </Text>

            <View style={styles.amountInputWrap}>
              <Text style={styles.currencyPrefix}>₹</Text>
              <TextInput
                style={styles.amountInput}
                keyboardType="number-pad"
                placeholder="10,000"
                placeholderTextColor="#94A3B8"
                value={amountText}
                onChangeText={(val) => setAmountText(val.replace(/[^0-9]/g, ''))}
              />
            </View>

            {/* Quick Preset Amount Chips */}
            <View style={styles.presetChipRow}>
              {PRESET_AMOUNTS.filter((p) => p >= plan.minInvestment && p <= plan.maxInvestment).map((preset) => {
                const isSelected = amount === preset;
                return (
                  <Pressable
                    key={preset}
                    onPress={() => setAmountText(String(preset))}
                    style={[styles.presetChip, isSelected && styles.presetChipActive]}
                  >
                    <Text style={[styles.presetChipText, isSelected && styles.presetChipTextActive]}>
                      ₹{(preset / 1000).toFixed(0)}k
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {amount > 0 && !isAmountValid && (
              <Text style={styles.errorText}>
                Amount must be between {formatCurrency(plan.minInvestment)} and {formatCurrency(plan.maxInvestment)}
              </Text>
            )}
          </SurfaceCard>

          {/* Real-time Returns Projection */}
          {isAmountValid && (
            <View style={{ width: '100%' }}>
              <SurfaceCard style={styles.projectionCard}>
                <SectionTitle title="Projected Returns Summary" />
                <View style={styles.projectionGrid}>
                  <View style={styles.projectionCell}>
                    <Ionicons name="today-outline" size={20} color={colors.primary} />
                    <Text style={styles.projectionLabel}>Daily Payout</Text>
                    <Text style={styles.projectionValue}>{formatCurrency(dailyReturn)}</Text>
                  </View>
                  <View style={styles.projectionCell}>
                    <Ionicons name="calendar-outline" size={20} color="#7C3AED" />
                    <Text style={styles.projectionLabel}>Monthly ROI</Text>
                    <Text style={styles.projectionValue}>{formatCurrency(monthlyReturn)}</Text>
                  </View>
                  <View style={styles.projectionCell}>
                    <Ionicons name="trophy-outline" size={20} color={colors.success} />
                    <Text style={styles.projectionLabel}>Total Maturity</Text>
                    <Text style={[styles.projectionValue, { color: colors.success }]}>
                      {formatCurrency(amount + totalReturn)}
                    </Text>
                  </View>
                </View>
              </SurfaceCard>
            </View>
          )}

          {/* Coupon Code Section */}
          {isAmountValid && (
            <View style={{ width: '100%' }}>
              <SurfaceCard style={styles.couponCard}>
                <SectionTitle title="Promo / Cashback Coupon" />
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
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text style={styles.applyCouponBtnText}>Apply</Text>
                        )}
                      </Pressable>
                    </View>
                    {couponError ? <Text style={styles.errorText}>{couponError}</Text> : null}
                  </View>
                )}
              </SurfaceCard>
            </View>
          )}

          {/* Razorpay Trust & Payment Methods Banner */}
          <SurfaceCard style={styles.razorpayTrustCard}>
            <View style={styles.razorpayTrustRow}>
              <View style={styles.razorpayLogoWrap}>
                <Ionicons name="card" size={22} color="#2563EB" />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.razorpayTrustTitle}>100% Secure Razorpay Gateway</Text>
                <Text style={styles.razorpayTrustSubtitle}>
                  Instant automated activation. Supports GPay, PhonePe, Paytm, UPI, Cards, and NetBanking.
                </Text>
              </View>
            </View>

            <View style={styles.trustPillRow}>
              <View style={styles.trustPill}>
                <Ionicons name="lock-closed" size={12} color="#16A34A" />
                <Text style={styles.trustPillText}>256-Bit SSL</Text>
              </View>
              <View style={styles.trustPill}>
                <Ionicons name="checkmark-circle" size={12} color="#2563EB" />
                <Text style={styles.trustPillText}>Instant Digital Receipt</Text>
              </View>
              <View style={styles.trustPill}>
                <Ionicons name="flash" size={12} color="#D97706" />
                <Text style={styles.trustPillText}>Instant Payouts</Text>
              </View>
            </View>
          </SurfaceCard>

          {/* 1-Tap Razorpay Pay Button */}
          <GradientButton
            label={isSubmitting ? 'Opening Razorpay...' : `Pay ${formatCurrency(amount)} via Razorpay`}
            icon={
              isSubmitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="shield-checkmark" size={19} color="#FFFFFF" />
              )
            }
            onPress={handlePayWithRazorpay}
            disabled={!isAmountValid || isSubmitting}
          />
        </View>
      ) : (
        /* STEP: Verified Active Investment Success Screen */
        <View style={{ width: '100%' }}>
          <SurfaceCard style={styles.successCard}>
            <View style={styles.successIconBubble}>
              <Ionicons name="checkmark-done" size={38} color="#16A34A" />
            </View>

            <Text style={styles.successTitle}>Payment Successful</Text>
            <Text style={styles.successSubtitle}>
              Your payment of <Text style={{ fontFamily: fontFamily.heading, color: '#0F172A' }}>{formatCurrency(amount)}</Text> has been verified and your investment plan is now active. Daily yields will automatically credit to your wallet.
            </Text>

            <View style={styles.successInfoBox}>
              <View style={styles.successInfoRow}>
                <Text style={styles.successInfoLabel}>Plan</Text>
                <Text style={styles.successInfoValue} numberOfLines={2}>{plan.name}</Text>
              </View>
              <View style={styles.successInfoRow}>
                <Text style={styles.successInfoLabel}>Amount Paid</Text>
                <Text style={[styles.successInfoValue, { color: colors.success }]}>{formatCurrency(amount)}</Text>
              </View>
              <View style={styles.successInfoRow}>
                <Text style={styles.successInfoLabel}>Payment Mode</Text>
                <Text style={styles.successInfoValue}>Razorpay Online</Text>
              </View>
              {verifiedPayment?.paymentId ? (
                <View style={styles.successInfoRow}>
                  <Text style={styles.successInfoLabel}>Payment ID</Text>
                  <Text style={styles.successInfoValueMono} numberOfLines={1}>{verifiedPayment.paymentId}</Text>
                </View>
              ) : null}
              <View style={styles.successInfoRow}>
                <Text style={styles.successInfoLabel}>Investment Status</Text>
                <View style={styles.activeStatusBadge}>
                  <Ionicons name="checkmark-circle" size={12} color="#16A34A" />
                  <Text style={styles.activeStatusText}>ACTIVE</Text>
                </View>
              </View>
            </View>

            {receipt ? (
              <ReceiptStatusCard receipt={receipt} title="Payment Receipt" showEmailStatus={false} />
            ) : (
              <View style={styles.receiptPendingBox}>
                <Ionicons name="time-outline" size={18} color="#D97706" />
                <Text style={styles.receiptPendingText}>Your invoice is being prepared. Refresh payment records shortly.</Text>
              </View>
            )}

            <View style={{ gap: 10, marginTop: 16, width: '100%' }}>
              <GradientButton
                label="View Active Portfolio"
                icon={<Ionicons name="pie-chart-outline" size={18} color="#FFFFFF" />}
                onPress={() => router.replace('/investment-status')}
              />
              <Pressable
                onPress={() => router.replace('/(tabs)')}
                style={styles.backToHomeBtn}
              >
                <Text style={styles.backToHomeText}>Back to Dashboard</Text>
              </Pressable>
            </View>
          </SurfaceCard>
        </View>
      )}

      <KycGateModal
        visible={kycGateVisible}
        onClose={() => setKycGateVisible(false)}
        kycStatus={effectiveKycStatus}
        onProceedInvest={() => setKycGateVisible(false)}
      />
    </AppScreen>
  );
};

const styles = StyleSheet.create({
  planCard: {
    padding: 18,
    borderRadius: radius.lg,
    marginBottom: 14,
  },
  planHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  planHeroCopy: {
    flex: 1,
    gap: 4,
  },
  planHeroName: {
    fontFamily: fontFamily.heading,
    fontSize: 20,
    color: '#FFFFFF',
  },
  planHeroDesc: {
    fontFamily: fontFamily.body,
    fontSize: 12.5,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 18,
  },
  planHeroIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  planHeroRoi: {
    fontFamily: fontFamily.heading,
    fontSize: 18,
    color: '#FFFFFF',
  },
  planHeroRoiLabel: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase',
  },
  planMetaStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: radius.md,
    padding: 10,
    marginTop: 14,
  },
  planMetaItem: {
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  planMetaLabel: {
    fontFamily: fontFamily.body,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  planMetaValue: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 13.5,
    color: '#FFFFFF',
  },
  kycWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    padding: 12,
    gap: 10,
    marginBottom: 14,
  },
  kycWarningIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kycWarningTitle: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 13,
    color: '#1E40AF',
  },
  kycWarningSubtitle: {
    fontFamily: fontFamily.body,
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  amountCard: {
    padding: 18,
    borderRadius: radius.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    ...shadows.card,
  },
  inputLabel: {
    fontFamily: fontFamily.body,
    fontSize: 12.5,
    color: '#64748B',
    marginBottom: 10,
  },
  amountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  currencyPrefix: {
    fontFamily: fontFamily.heading,
    fontSize: 26,
    color: '#0F172A',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontFamily: fontFamily.heading,
    fontSize: 24,
    color: '#0F172A',
    padding: 0,
  },
  presetChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  presetChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  presetChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: colors.primary,
  },
  presetChipText: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    color: '#475569',
  },
  presetChipTextActive: {
    color: colors.primary,
    fontFamily: fontFamily.bodyBold,
  },
  projectionCard: {
    padding: 18,
    borderRadius: radius.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    ...shadows.card,
  },
  projectionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  projectionCell: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  projectionLabel: {
    fontFamily: fontFamily.body,
    fontSize: 11,
    color: '#64748B',
  },
  projectionValue: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 14,
    color: '#0F172A',
  },
  couponCard: {
    padding: 18,
    borderRadius: radius.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    ...shadows.card,
  },
  couponInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    marginTop: 8,
  },
  couponInput: {
    flex: 1,
    fontFamily: fontFamily.bodySemi,
    fontSize: 14,
    color: '#0F172A',
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  applyCouponBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  applyCouponBtnDisabled: {
    backgroundColor: '#94A3B8',
  },
  applyCouponBtnText: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  appliedCouponBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    borderRadius: radius.md,
    padding: 12,
    marginTop: 8,
  },
  appliedCouponInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  appliedCouponCode: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 13,
    color: '#15803D',
  },
  appliedCouponMsg: {
    fontFamily: fontFamily.body,
    fontSize: 11,
    color: '#166534',
  },
  removeCouponBtn: {
    padding: 4,
  },
  razorpayTrustCard: {
    padding: 16,
    borderRadius: radius.lg,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    ...shadows.card,
  },
  razorpayTrustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  razorpayLogoWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  razorpayTrustTitle: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 14,
    color: '#0F172A',
  },
  razorpayTrustSubtitle: {
    fontFamily: fontFamily.body,
    fontSize: 11.5,
    color: '#64748B',
    lineHeight: 16,
  },
  trustPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  trustPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  trustPillText: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 10.5,
    color: '#334155',
  },
  successCard: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    ...shadows.card,
  },
  successIconBubble: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  successTitle: {
    fontFamily: fontFamily.heading,
    fontSize: 21,
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
  },
  successSubtitle: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 18,
    paddingHorizontal: 8,
  },
  successInfoBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 10,
    marginBottom: 14,
  },
  successInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  successInfoLabel: {
    fontFamily: fontFamily.body,
    fontSize: 12.5,
    color: '#64748B',
  },
  successInfoValue: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 13,
    color: '#0F172A',
    maxWidth: '62%',
    textAlign: 'right',
  },
  successInfoValueMono: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 11.5,
    color: colors.primary,
    maxWidth: '62%',
  },
  activeStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  activeStatusText: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 10,
    color: '#15803D',
  },
  receiptPendingBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: radius.md,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginBottom: 4,
  },
  receiptPendingText: {
    flex: 1,
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    lineHeight: 17,
    color: '#92400E',
  },
  backToHomeBtn: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  backToHomeText: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 13.5,
    color: colors.primary,
  },
  errorText: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    color: '#DC2626',
    marginTop: 6,
  },
  emptyText: {
    fontFamily: fontFamily.body,
    fontSize: 13.5,
    color: '#64748B',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
