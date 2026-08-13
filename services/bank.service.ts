import { apiClient } from '../api/client';

export type BankDetails = {
  accountHolderName: string;
  accountNumberMasked: string;
  ifscCode: string;
  bankName: string;
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
    const response = await apiClient.get<BankDetails>('/api/bank/details');
    return response.data;
  },
};
