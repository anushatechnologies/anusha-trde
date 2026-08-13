import { create } from 'zustand';

import { readSecure, writeSecure } from '../utils/storage';

const APP_STATE_KEY = 'investapp.app.state';

type AppStore = {
  isHydrated: boolean;
  hasCompletedOnboarding: boolean;
  notificationPermission: 'granted' | 'denied' | 'undetermined';
  hydrate: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
  setNotificationPermission: (value: 'granted' | 'denied' | 'undetermined') => Promise<void>;
};

export const useAppStore = create<AppStore>((set, get) => ({
  isHydrated: false,
  hasCompletedOnboarding: false,
  notificationPermission: 'undetermined',
  hydrate: async () => {
    const persisted = await readSecure<Pick<AppStore, 'hasCompletedOnboarding' | 'notificationPermission'>>(APP_STATE_KEY);

    if (persisted) {
      set({
        hasCompletedOnboarding: persisted.hasCompletedOnboarding,
        notificationPermission: persisted.notificationPermission,
      });
    }

    set({ isHydrated: true });
  },
  completeOnboarding: async () => {
    const nextState = { ...get(), hasCompletedOnboarding: true };
    await writeSecure(APP_STATE_KEY, {
      hasCompletedOnboarding: true,
      notificationPermission: nextState.notificationPermission,
    });
    set({ hasCompletedOnboarding: true });
  },
  setNotificationPermission: async (value) => {
    await writeSecure(APP_STATE_KEY, {
      hasCompletedOnboarding: get().hasCompletedOnboarding,
      notificationPermission: value,
    });
    set({ notificationPermission: value });
  },
}));
