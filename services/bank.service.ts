import { apiClient } from '../api/client';

export type BankDetails = {
  accountHolderName: string;
  accountNumberMasked: string;
  bankAccountNumber?: string;
  ifscCode: string;
  bankIfscCode?: string;
  bankName: string;
  bankVerified?: boolean;
  bankVerifiedAt?: string;
};

export const bankService = {
  verifyBank: async (
    accountHolderName: string,
    bankAccountNumber: string,
    bankIfscCode: string,
    bankName: string
  ) => {
    const response = await apiClient.post('/api/bank/verify', {
      accountHolderName,
      bankAccountNumber,
      confirmBankAccountNumber: bankAccountNumber,
      bankIfscCode,
      bankName,
    });
    return response.data;
  },

  linkBank: async (
    accountHolderName: string,
    bankAccountNumber: string,
    bankIfscCode: string,
    bankName: string
  ) => {
    const response = await apiClient.post('/api/bank/link', {
      accountHolderName,
      bankAccountNumber,
      confirmBankAccountNumber: bankAccountNumber,
      bankIfscCode,
      bankName,
    });
    return response.data;
  },

  getBankDetails: async (): Promise<BankDetails> => {
    const response = await apiClient.get<Record<string, any>>('/api/bank/details');
    const data = response.data || {};
    const rawAcc = String(data.bankAccountNumber || data.accountNumber || data.accountNumberMasked || '').trim();
    const lastFour = rawAcc.match(/(\d{4})\s*$/)?.[1] || '';
    const masked = lastFour ? `A/C **** ${lastFour}` : 'No bank account linked';
    const ifsc = String(data.bankIfscCode || data.ifscCode || data.ifsc || '').trim().toUpperCase();
    return {
      accountHolderName: String(data.accountHolderName || data.name || ''),
      accountNumberMasked: masked,
      bankAccountNumber: rawAcc,
      ifscCode: ifsc,
      bankIfscCode: ifsc,
      bankName: String(data.bankName || ''),
      bankVerified: Boolean(data.bankVerified ?? data.verified),
      bankVerifiedAt: data.bankVerifiedAt ? String(data.bankVerifiedAt) : undefined,
    };
  },
};
