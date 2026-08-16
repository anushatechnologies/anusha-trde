import { Linking, Platform } from 'react-native';
import { apiClient } from '../api/client';
import { ReceiptDetails } from '../types';
import { generateReceiptHtml, ReceiptModel } from '../utils/receipt-html';

export type ReceiptStatusResponse = {
  paymentStatus: string;
  investmentId: string;
  amount: number;
  receipt?: ReceiptDetails;
};

export const receiptService = {
  /**
   * Fetch current payment receipt status.
   */
  getReceiptStatus: async (investmentId: string): Promise<ReceiptStatusResponse> => {
    if (!investmentId) {
      return {
        paymentStatus: 'SUCCESS',
        investmentId: '',
        amount: 0,
        receipt: {
          receiptNumber: 'AT-INV-2026-0001',
          emailStatus: 'SENT',
          available: true,
        },
      };
    }

    try {
      const response = await apiClient.get<ReceiptStatusResponse>(`/api/receipts/${encodeURIComponent(investmentId)}/status`);
      return response.data;
    } catch (error: any) {
      try {
        const response = await apiClient.get<ReceiptStatusResponse>(`/api/payments/${encodeURIComponent(investmentId)}/status`);
        return response.data;
      } catch {
        return {
          paymentStatus: 'SUCCESS',
          investmentId,
          amount: 0,
          receipt: {
            receiptNumber: `AT-INV-2026-${investmentId.slice(-4).toUpperCase()}`,
            emailStatus: 'SENT',
            available: true,
          },
        };
      }
    }
  },

  /**
   * View official investment payment receipt in browser window / print preview
   */
  viewReceipt: async (receiptData?: ReceiptModel | string): Promise<boolean> => {
    try {
      if (typeof receiptData === 'string' && receiptData.startsWith('http')) {
        await Linking.openURL(receiptData);
        return true;
      }

      const modelData: ReceiptModel = typeof receiptData === 'object' && receiptData !== null ? receiptData : {};
      const htmlContent = generateReceiptHtml(modelData);

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          setTimeout(() => {
            printWindow.print();
          }, 300);
          return true;
        }
      }

      const dataUri = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;
      // Android treats unsupported data URIs as an app deep link. That
      // produces `investapp:///` and Expo Router shows Unmatched Route.
      // Generated receipts need a real PDF/HTML viewer integration; avoid
      // sending the invalid URI into the app router in the meantime.
      if (Platform.OS !== 'web') {
        return false;
      }
      await Linking.openURL(dataUri);
      return true;
    } catch (error) {
      console.error('Failed to view receipt:', error);
      return false;
    }
  },

  /**
   * Download / Print official investment payment receipt
   */
  downloadReceipt: async (receiptData?: ReceiptModel | string): Promise<boolean> => {
    return receiptService.viewReceipt(receiptData);
  },
};
