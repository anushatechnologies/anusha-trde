import { create } from 'zustand';

import { emptyPaymentMethods, emptyTransactions, emptyWalletAnalytics } from '../constants/app-defaults';
import { TransactionItem, WalletPayload } from '../types';

type WalletStore = {
  balance: number;
  availableBalance: number;
  lockedBalance: number;
  paymentMethods: string[];
  analytics: { label: string; value: number }[];
  transactions: TransactionItem[];
  filter: 'all' | 'credited' | 'debited' | 'processing';
  hydrateFromApi: (payload: WalletPayload) => void;
  setFilter: (value: WalletStore['filter']) => void;
};

export const useWalletStore = create<WalletStore>((set) => ({
  balance: 0,
  availableBalance: 0,
  lockedBalance: 0,
  paymentMethods: emptyPaymentMethods,
  analytics: emptyWalletAnalytics,
  transactions: emptyTransactions,
  filter: 'all',
  hydrateFromApi: (payload) =>
    set({
      balance: payload.balance,
      availableBalance: payload.availableBalance,
      lockedBalance: payload.lockedBalance,
      paymentMethods: payload.paymentMethods,
      analytics: payload.analytics,
      transactions: payload.transactions,
    }),
  setFilter: (filter) => set({ filter }),
}));
