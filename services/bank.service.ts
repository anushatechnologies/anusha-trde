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
    const masked = rawAcc ? (rawAcc.startsWith('A/C') ? rawAcc : `A/C **** ${rawAcc.slice(-4)}`) : 'No bank account linked';
    return {
      accountHolderName: String(data.accountHolderName || data.name || ''),
      accountNumberMasked: masked,
      bankAccountNumber: rawAcc,
      ifscCode: String(data.bankIfscCode || data.ifscCode || data.ifsc || ''),
      bankIfscCode: String(data.bankIfscCode || data.ifscCode || data.ifsc || ''),
      bankName: String(data.bankName || ''),
      bankVerified: Boolean(data.bankVerified),
      bankVerifiedAt: data.bankVerifiedAt ? String(data.bankVerifiedAt) : undefined,
    };
  },
};
