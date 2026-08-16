import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

import { dashboardService } from '../services/dashboard.service';
import { useInvestmentStore } from '../store/use-investment-store';
import { useAuthStore } from '../store/use-auth-store';
import { useNotificationStore } from '../store/use-notification-store';
import { useTeamStore } from '../store/use-team-store';
import { useWalletStore } from '../store/use-wallet-store';
import {
  DashboardPayload,
  InvestmentPayload,
  NotificationPayload,
  SessionItem,
  TeamPayload,
  WalletPayload,
} from '../types';

export const queryKeys = {
  dashboard: ['dashboard'],
  investments: ['investments'],
  wallet: ['wallet'],
  team: ['team'],
  notifications: ['notifications'],
  sessions: ['sessions'],
} as const;

export const useDashboardQuery = () => {
  const updateUser = useAuthStore((state) => state.updateUser);
  const lastUpdatedUserRef = useRef<string>('');

  const query = useQuery<DashboardPayload>({
    queryKey: queryKeys.dashboard,
    queryFn: dashboardService.getDashboard,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (query.data?.user) {
      const userSignature = JSON.stringify({
        id: query.data.user.id,
        name: query.data.user.name,
        kycStatus: query.data.user.kycStatus,
        levelTitle: query.data.user.levelTitle,
        bankVerified: query.data.user.bankVerified,
      });

      if (lastUpdatedUserRef.current !== userSignature) {
        lastUpdatedUserRef.current = userSignature;
        void updateUser(query.data.user);
      }
    }
  }, [query.data?.user, updateUser]);

  return query;
};

export const useInvestmentsQuery = () => {
  const hydrate = useInvestmentStore((state) => state.hydrateFromApi);
  const lastHydratedRef = useRef<string>('');

  const query = useQuery<InvestmentPayload>({
    queryKey: queryKeys.investments,
    queryFn: dashboardService.getInvestments,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (query.data) {
      const sig = JSON.stringify(query.data.plans?.map((p) => p.id));
      if (lastHydratedRef.current !== sig) {
        lastHydratedRef.current = sig;
        hydrate(query.data);
      }
    }
  }, [hydrate, query.data]);

  return query;
};

export const useWalletQuery = () => {
  const hydrate = useWalletStore((state) => state.hydrateFromApi);
  const query = useQuery<WalletPayload>({
    queryKey: queryKeys.wallet,
    queryFn: dashboardService.getWallet,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (query.data) {
      hydrate(query.data);
    }
  }, [hydrate, query.data]);

  return query;
};

export const useTeamQuery = () => {
  const hydrate = useTeamStore((state) => state.hydrateFromApi);
  const query = useQuery<TeamPayload>({
    queryKey: queryKeys.team,
    queryFn: dashboardService.getTeam,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (query.data) {
      hydrate(query.data);
    }
  }, [hydrate, query.data]);

  return query;
};

export const useNotificationsQuery = () => {
  const hydrate = useNotificationStore((state) => state.hydrateFromApi);
  const query = useQuery<NotificationPayload>({
    queryKey: queryKeys.notifications,
    queryFn: dashboardService.getNotifications,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (query.data) {
      hydrate(query.data);
    }
  }, [hydrate, query.data]);

  return query;
};

export const useSessionsQuery = () =>
  useQuery<{ sessions: SessionItem[] }>({
    queryKey: queryKeys.sessions,
    queryFn: dashboardService.getSessions,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  });
