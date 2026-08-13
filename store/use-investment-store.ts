import { create } from 'zustand';

import {
  emptyActiveInvestments,
  emptyInvestmentPlans,
  emptyProjectionSeries,
  emptyTransactions,
} from '../constants/app-defaults';
import { ActiveInvestment, EarningsPoint, InvestmentPayload, Plan, TransactionItem } from '../types';

type InvestmentStore = {
  plans: Plan[];
  activeInvestments: ActiveInvestment[];
  history: TransactionItem[];
  projectionSeries: EarningsPoint[];
  calculatorAmount: number;
  hydrateFromApi: (payload: InvestmentPayload) => void;
  setCalculatorAmount: (amount: number) => void;
};

export const useInvestmentStore = create<InvestmentStore>((set) => ({
  plans: emptyInvestmentPlans,
  activeInvestments: emptyActiveInvestments,
  history: emptyTransactions,
  projectionSeries: emptyProjectionSeries,
  calculatorAmount: 0,
  hydrateFromApi: (payload) =>
    set({
      plans: payload.plans,
      activeInvestments: payload.activeInvestments,
      history: payload.history,
      projectionSeries: payload.projectionSeries,
    }),
  setCalculatorAmount: (calculatorAmount) => set({ calculatorAmount }),
}));
