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
    const responseData = response.data || {};
    const data = responseData.bank || responseData.data || responseData.profile || responseData;
    const rawAccount = String(data.bankAccountNumber || data.accountNumber || '').trim();
    const suppliedMask = String(data.accountNumberMasked || data.bankAccountNumberMasked || '').trim();
    const accountDigits = rawAccount.replace(/\D/g, '');
    const isPlaceholderAccount = /^0+$/.test(accountDigits) || /(?:\*{2,}|x{2,})\s*0{4}$/i.test(suppliedMask);
    const lastFour = accountDigits.match(/(\d{4})$/)?.[1] || suppliedMask.match(/(\d{4})\s*$/)?.[1] || '';
    const masked = !isPlaceholderAccount && lastFour ? `A/C **** ${lastFour}` : 'No bank account linked';
    const ifsc = String(data.bankIfscCode || data.ifscCode || data.ifsc || '').trim().toUpperCase();
    const cleanIfsc = ifsc === 'SBIN0000000' ? '' : ifsc;
    return {
      accountHolderName: String(data.accountHolderName || data.name || ''),
      accountNumberMasked: masked,
      bankAccountNumber: isPlaceholderAccount ? '' : rawAccount,
      ifscCode: cleanIfsc,
      bankIfscCode: cleanIfsc,
      bankName: String(data.bankName || ''),
      bankVerified: !isPlaceholderAccount && Boolean(data.bankVerified ?? data.verified),
      bankVerifiedAt: data.bankVerifiedAt ? String(data.bankVerifiedAt) : undefined,
    };
  },
};
