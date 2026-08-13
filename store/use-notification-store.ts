import { create } from 'zustand';

import { emptyNotifications } from '../constants/app-defaults';
import { AppNotification, NotificationPayload } from '../types';

type NotificationStore = {
  items: AppNotification[];
  hydrateFromApi: (payload: NotificationPayload) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
};

export const useNotificationStore = create<NotificationStore>((set) => ({
  items: emptyNotifications,
  hydrateFromApi: (payload) => set({ items: payload.items }),
  markAllRead: () =>
    set((state) => ({
      items: state.items.map((item) => ({ ...item, read: true })),
    })),
  markRead: (id) =>
    set((state) => ({
      items: state.items.map((item) => (item.id === id ? { ...item, read: true } : item)),
    })),
}));
