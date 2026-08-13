import { Platform } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import { apiClient } from '../api/client';
import { ReceiptDetails } from '../types';

export type RazorpayCheckoutOrderResponse = {
  investment: {
    id: string;
    status: string;
    investmentAmount: number;
  };
  payment: {
    id: string;
    investmentId: string;
    razorpayOrderId: string;
    amount: number;
    currency: string;
    status: string;
  };
  checkout: {
    keyId: string;
    orderId: string;
    amount: number;
    currency: string;
    investorName: string;
    investorEmail: string;
    investorContact: string;
    planName: string;
    description: string;
  };
};

export type RazorpayVerifyResponse = {
  investment: {
    id: string;
    status: string;
  };
  payment: {
    id: string;
    status: string;
    captured: boolean;
  };
  receipt?: ReceiptDetails;
  message: string;
};

export type ManualInvestmentApplyResponse = {
  id: string;
  investorUserId: string;
  investmentPlanId: string;
  investmentAmount: number;
  status: string;
  appliedAt: string;
  monthlyInterestRate: number;
  receiptApproved: boolean;
};

export type Coupon = {
  id: string;
  code: string;
  title: string;
  description: string;
  type: 'FLAT_CASHBACK' | 'PERCENT_CASHBACK';
  valueAmount: number;
  minimumInvestmentAmount: number;
  maximumCashbackAmount: number;
  totalUsageLimit: number;
  perUserUsageLimit: number;
  firstInvestmentOnly: boolean;
  validFrom: string;
  validUntil: string;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
};

export type CouponValidationResponse = {
  valid: boolean;
  couponCode: string;
  cashbackAmount: number;
  message: string;
};

/**
 * Compresses an image on both Native (Android/iOS) and Web using expo-image-manipulator.
 * Resizes the image to keep its maximum dimension under 1600px (preserving aspect ratio)
 * and compresses it with JPEG format at 70% quality.
 */
const compressImage = async (uri: string): Promise<string> => {
  try {
    // 1. Get original dimensions and apply compression
    const initial = await ImageManipulator.manipulateAsync(
      uri,
      [],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );

    // 2. If larger than 1600px, resize to keep it compact and safe from limits
    const maxDimension = 1600;
    if (initial.width > maxDimension || initial.height > maxDimension) {
      const actions: ImageManipulator.Action[] = [];
      if (initial.width > initial.height) {
        actions.push({ resize: { width: maxDimension } });
      } else {
        actions.push({ resize: { height: maxDimension } });
      }

      const resized = await ImageManipulator.manipulateAsync(
        uri,
        actions,
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      return resized.uri;
    }

    return initial.uri;
  } catch (error) {
    console.error('Failed to compress image:', error);
    return uri; // fallback to original uri
  }
};

/**
 * Helper to dynamically append file/image fields to FormData based on platform.
 * On Web, it converts the local URI to a standard browser File/Blob.
 * On Native (Android/iOS), it uses the standard object structure.
 */
const appendFileToFormData = async (formData: FormData, fieldName: string, uri: string, filename: string) => {
  if (!uri) return;

  try {
    // Compress the image on all platforms (Web, Android, iOS) using expo-image-manipulator
    const compressedUri = await compressImage(uri);

    if (Platform.OS === 'web') {
      const response = await fetch(compressedUri);
      const blob = await response.blob();
      const file = new File([blob], filename, { type: 'image/jpeg' });
      formData.append(fieldName, file);
    } else {
      formData.append(fieldName, {
        uri: compressedUri,
        type: 'image/jpeg',
        name: filename,
      } as unknown as Blob);
    }
  } catch (error) {
    console.error(`Failed to compress or append file for ${fieldName}:`, error);
    // Fallback: append original URI directly
    if (Platform.OS === 'web') {
      try {
        const response = await fetch(uri);
        const blob = await response.blob();
        const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
        formData.append(fieldName, file);
      } catch (fallbackError) {
        console.error(`Fallback failed on web for ${fieldName}:`, fallbackError);
        formData.append(fieldName, {
          uri,
          type: 'image/jpeg',
          name: filename,
        } as unknown as Blob);
      }
    } else {
      formData.append(fieldName, {
        uri,
        type: 'image/jpeg',
        name: filename,
      } as unknown as Blob);
    }
  }
};

const sanitizeUri = (uri: string) => {
  if (Platform.OS === 'android' && !uri.startsWith('file://') && !uri.startsWith('content://')) {
    return 'file://' + uri;
  }
  return uri;
};

export const investmentService = {
  /**
   * Get Active Plans
   */
  getActivePlans: async (): Promise<any[]> => {
    const response = await apiClient.get<any[]>('/api/plans');
    return response.data;
  },

  /**
   * List Own Investments
   */
  listOwnInvestments: async (): Promise<any[]> => {
    const response = await apiClient.get<any[]>('/api/investments');
    return response.data;
  },

  /**
   * Get Investment Detail
   */
  getInvestmentDetail: async (id: string): Promise<any> => {
    const response = await apiClient.get<any>(`/api/investments/${id}`);
    return response.data;
  },

  /**
   * Get Razorpay Payment by Investment
   */
  getRazorpayPaymentByInvestment: async (investmentId: string): Promise<any> => {
    const response = await apiClient.get<any>(`/api/payments/razorpay/investments/${investmentId}`);
    return response.data;
  },

  /**
   * Apply for an investment (Manual Payment Flow)
   */
  applyManualInvestment: async (investmentPlanId: string, investmentAmount: number, couponCode?: string): Promise<ManualInvestmentApplyResponse> => {
    const response = await apiClient.post<ManualInvestmentApplyResponse>('/api/investments/apply', {
      investmentPlanId,
      investmentAmount,
      couponCode,
    });
    return response.data;
  },

  /**
   * Upload Manual Payment Receipt
   */
  uploadPaymentReceipt: async (
    investmentId: string,
    receiptImageUri: string,
    paymentAmount: string | number,
    paymentDate: string,
    paymentMode: 'NEFT' | 'RTGS' | 'IMPS' | 'UPI' | 'CASH' | 'CARD' | 'NETBANKING' | 'WALLET',
    bankReference: string
  ) => {
    const formData = new FormData();
    const cleanUri = sanitizeUri(receiptImageUri);
    await appendFileToFormData(formData, 'receiptFile', cleanUri, 'receipt.jpg');

    formData.append('paymentAmount', String(paymentAmount));
    formData.append('paymentDate', paymentDate);
    formData.append('paymentMode', paymentMode);
    formData.append('bankReference', bankReference);

    try {
      const { useAuthStore } = require('../store/use-auth-store');
      const actualToken = useAuthStore.getState().accessToken;
      const baseUrl = apiClient.defaults.baseURL || 'https://api.anushatrade.com';

      const response = await fetch(`${baseUrl}/api/investments/${investmentId}/upload-receipt`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${actualToken}`,
          Accept: 'application/json',
        },
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 413) {
          throw new Error('Receipt file is too large. Please keep upload size under 10MB.');
        }
        let errorMsg = '';
        try {
          const json = await response.json();
          errorMsg = json?.message || json?.error || JSON.stringify(json);
        } catch {
          errorMsg = await response.text().catch(() => response.statusText);
        }
        throw new Error(errorMsg || `Upload failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      if (error.message?.includes('too large') || error.message?.includes('Upload Error')) {
        throw error;
      }
      throw new Error(error.message || 'Upload failed. The file might be too large or the server is unreachable.');
    }
  },

  /**
   * Create Razorpay Checkout Order
   */
  createRazorpayCheckout: async (investmentPlanId: string, investmentAmount: number, couponCode?: string): Promise<RazorpayCheckoutOrderResponse> => {
    const response = await apiClient.post<RazorpayCheckoutOrderResponse>('/api/payments/razorpay/checkout-order', {
      investmentPlanId,
      investmentAmount,
      couponCode,
    });
    return response.data;
  },

  /**
   * Verify Razorpay Payment
   */
  verifyRazorpayPayment: async (
    investmentId: string,
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ): Promise<RazorpayVerifyResponse> => {
    const response = await apiClient.post<RazorpayVerifyResponse>('/api/payments/razorpay/verify', {
      investmentId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });
    return response.data;
  },

  /**
   * Cancel Investment
   */
  cancelInvestment: async (investmentId: string, reason: string) => {
    const response = await apiClient.post(`/api/investments/${investmentId}/cancel`, {
      reason,
    });
    return response.data;
  },

  /**
   * Get Active Coupons
   */
  getCoupons: async (): Promise<Coupon[]> => {
    const response = await apiClient.get<Coupon[]>('/api/coupons');
    return response.data;
  },

  /**
   * Validate Coupon
   */
  validateCoupon: async (investmentPlanId: string, investmentAmount: number, couponCode: string): Promise<CouponValidationResponse> => {
    const response = await apiClient.post<CouponValidationResponse>('/api/coupons/validate', {
      investmentPlanId,
      investmentAmount,
      couponCode,
    });
    return response.data;
  },
};
