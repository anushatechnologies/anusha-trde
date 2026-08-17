import { Linking, Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
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
    if (!investmentId) throw new Error('Investment ID is required to load an invoice.');

    try {
      const response = await apiClient.get<ReceiptStatusResponse>(`/api/receipts/${encodeURIComponent(investmentId)}/status`);
      return response.data;
    } catch (error: any) {
      try {
        const response = await apiClient.get<ReceiptStatusResponse>(`/api/payments/${encodeURIComponent(investmentId)}/status`);
        return response.data;
      } catch (fallbackError) {
        throw fallbackError;
      }
    }
  },

  /**
   * View official investment payment receipt in browser window / print preview
   */
  viewReceipt: async (receiptData?: ReceiptModel | string): Promise<boolean> => {
    try {
      let htmlContent = '';
      if (typeof receiptData === 'string' && (receiptData.startsWith('http') || receiptData.startsWith('/api/'))) {
        const response = await apiClient.get<string>(receiptData, { responseType: 'text' });
        htmlContent = response.data;
      } else {
        const modelData: ReceiptModel = typeof receiptData === 'object' && receiptData !== null ? receiptData : {};
        htmlContent = generateReceiptHtml(modelData);
      }

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

      const printFile = await Print.printToFileAsync({ html: htmlContent });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(printFile.uri, { mimeType: 'application/pdf', dialogTitle: 'Download invoice' });
      } else {
        await Linking.openURL(printFile.uri);
      }
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
