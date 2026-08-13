import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

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
  const query = useQuery<DashboardPayload>({
    queryKey: queryKeys.dashboard,
    queryFn: dashboardService.getDashboard,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (query.data?.user) {
      void updateUser(query.data.user);
    }
  }, [query.data?.user, updateUser]);

  return query;
};

export const useInvestmentsQuery = () => {
  const hydrate = useInvestmentStore((state) => state.hydrateFromApi);
  const query = useQuery<InvestmentPayload>({
    queryKey: queryKeys.investments,
    queryFn: dashboardService.getInvestments,
    staleTime: 60_000,
  });

  useEffect(() => {
    if (query.data) {
      hydrate(query.data);
    }
  }, [hydrate, query.data]);

  return query;
};

export const useWalletQuery = () => {
  const hydrate = useWalletStore((state) => state.hydrateFromApi);
  const query = useQuery<WalletPayload>({
    queryKey: queryKeys.wallet,
    queryFn: dashboardService.getWallet,
    staleTime: 60_000,
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
    staleTime: 60_000,
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
    staleTime: 45_000,
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
    staleTime: 60_000,
  });
