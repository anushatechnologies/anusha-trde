import { create } from 'zustand';
import { Platform } from 'react-native';

import { authService } from '../services/auth.service';
import { emptyUserProfile } from '../constants/app-defaults';
import { firebaseAuthService } from '../services/firebase-auth.service';
import { mpinService } from '../services/mpin.service';
import { AuthTokens, UserProfile } from '../types';
import { readSecure, removeSecure, writeSecure } from '../utils/storage';

const AUTH_SESSION_KEY = 'investapp.auth.session';
const AUTH_PREFS_KEY = 'investapp.auth.preferences';
const AUTH_BIOMETRIC_SESSION_KEY = 'investapp.auth.biometric-session';

type AuthSession = {
  user: UserProfile;
  tokens: AuthTokens;
};

type AuthStore = {
  isHydrated: boolean;
  isAuthenticated: boolean;
  requiresMpinVerification: boolean;
  user: UserProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  preferredLoginMode: 'mobile' | 'email';
  hydrate: () => Promise<void>;
  hasBiometricSession: () => Promise<boolean>;
  signIn: (session: AuthSession) => Promise<void>;
  signInWithBiometrics: () => Promise<boolean>;
  setTokens: (tokens: AuthTokens) => Promise<void>;
  updateUser: (user: Partial<UserProfile>) => Promise<void>;
  setPreferredLoginMode: (mode: 'mobile' | 'email') => Promise<void>;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
  markMpinVerified: () => void;
  signOut: () => Promise<void>;
};

const normalizeUser = (user: UserProfile | null): UserProfile | null => (user ? { ...emptyUserProfile, ...user } : null);

const hasValidSession = (session: AuthSession | null) =>
  Boolean(session?.user && session.tokens?.accessToken && session.tokens.expiresAt > Date.now());

const buildDeviceId = (user: UserProfile) => {
  const seed = (user.id || user.mobile || user.email || 'member').replace(/[^a-zA-Z0-9]/g, '').slice(0, 24) || 'member';
  return `investapp-${seed}-${Platform.OS}`;
};

const enrichUserWithMpin = async (user: UserProfile | null) => {
  const normalizedUser = normalizeUser(user);

  if (!normalizedUser) {
    return {
      user: null,
      requiresMpinVerification: false,
    };
  }

  const hasStoredMpin = await mpinService.hasMpinForAccount({
    email: normalizedUser.email,
    mobile: normalizedUser.mobile,
  });

  return {
    user: {
      ...normalizedUser,
      mpinConfigured: normalizedUser.mpinConfigured || hasStoredMpin,
    },
    requiresMpinVerification: normalizedUser.mpinConfigured || hasStoredMpin,
  };
};

const syncBiometricSession = async (session: AuthSession) => {
  if (session.user.biometricEnabled) {
    await writeSecure<AuthSession>(AUTH_BIOMETRIC_SESSION_KEY, session);
    return;
  }

  await removeSecure(AUTH_BIOMETRIC_SESSION_KEY);
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  isHydrated: false,
  isAuthenticated: false,
  requiresMpinVerification: false,
  user: null,
  accessToken: null,
  refreshToken: null,
  expiresAt: null,
  preferredLoginMode: 'mobile',
  hydrate: async () => {
    const [session, preferences] = await Promise.all([
      readSecure<AuthSession>(AUTH_SESSION_KEY),
      readSecure<{ preferredLoginMode: 'mobile' | 'email' }>(AUTH_PREFS_KEY),
    ]);

    let restoredSession: AuthSession | null = null;

    if (session?.user && session.tokens?.accessToken) {
      if (session.tokens.expiresAt > Date.now() + 60_000) {
        restoredSession = session;
      } else if (session.tokens.refreshToken) {
        try {
          restoredSession = await authService.refreshSession(session);
        } catch {
          restoredSession = null;
        }
      }
    }

    if (restoredSession?.tokens?.accessToken && restoredSession.user) {
      const enrichedSession = await enrichUserWithMpin(restoredSession.user);
      const hydratedSession = {
        ...restoredSession,
        user: enrichedSession.user ?? restoredSession.user,
      };
      await writeSecure<AuthSession>(AUTH_SESSION_KEY, hydratedSession);
      await syncBiometricSession(hydratedSession);
      set({
        isAuthenticated: true,
        requiresMpinVerification: enrichedSession.requiresMpinVerification,
        user: hydratedSession.user,
        accessToken: hydratedSession.tokens.accessToken,
        refreshToken: hydratedSession.tokens.refreshToken,
        expiresAt: hydratedSession.tokens.expiresAt,
      });
    } else {
      await removeSecure(AUTH_SESSION_KEY);
      set({
        isAuthenticated: false,
        requiresMpinVerification: false,
        user: null,
        accessToken: null,
        refreshToken: null,
        expiresAt: null,
      });
    }

    if (preferences?.preferredLoginMode) {
      set({ preferredLoginMode: preferences.preferredLoginMode });
    }

    set({ isHydrated: true });
  },
  hasBiometricSession: async () => {
    const session = await readSecure<AuthSession>(AUTH_BIOMETRIC_SESSION_KEY);

    if (!hasValidSession(session) || !session?.user.biometricEnabled) {
      await removeSecure(AUTH_BIOMETRIC_SESSION_KEY);
      return false;
    }

    return true;
  },
  signIn: async ({ user, tokens }) => {
    const enrichedSession = await enrichUserWithMpin(user);
    const normalizedUser = enrichedSession.user;

    if (!normalizedUser) {
      return;
    }

    const session = { user: normalizedUser, tokens };
    await writeSecure<AuthSession>(AUTH_SESSION_KEY, session);
    await syncBiometricSession(session);
    set({
      isAuthenticated: true,
      requiresMpinVerification: false,
      user: normalizedUser,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
    });
  },
  signInWithBiometrics: async () => {
    const storedSession = await readSecure<AuthSession>(AUTH_BIOMETRIC_SESSION_KEY);

    if (!storedSession?.user.biometricEnabled) {
      await removeSecure(AUTH_BIOMETRIC_SESSION_KEY);
      return false;
    }

    let session = storedSession;

    if (!hasValidSession(storedSession) && storedSession.tokens.refreshToken) {
      try {
        session = await authService.refreshSession(storedSession);
      } catch {
        await removeSecure(AUTH_BIOMETRIC_SESSION_KEY);
        return false;
      }
    }

    if (!hasValidSession(session)) {
      await removeSecure(AUTH_BIOMETRIC_SESSION_KEY);
      return false;
    }

    const normalizedUser = normalizeUser(session.user);

    if (!normalizedUser) {
      await removeSecure(AUTH_BIOMETRIC_SESSION_KEY);
      return false;
    }

    const nextSession = {
      user: normalizedUser,
      tokens: session.tokens,
    };

    await writeSecure<AuthSession>(AUTH_SESSION_KEY, nextSession);
    await writeSecure<AuthSession>(AUTH_BIOMETRIC_SESSION_KEY, nextSession);

    set({
      isAuthenticated: true,
      requiresMpinVerification: false,
      user: normalizedUser,
      accessToken: session.tokens.accessToken,
      refreshToken: session.tokens.refreshToken,
      expiresAt: session.tokens.expiresAt,
    });

    return true;
  },
  setTokens: async (tokens) => {
    const currentUser = get().user;

    if (!currentUser) {
      return;
    }

    const session = { user: currentUser, tokens };
    await writeSecure<AuthSession>(AUTH_SESSION_KEY, session);
    await syncBiometricSession(session);
    set({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
    });
  },
  updateUser: async (userPatch) => {
    const current = get().user;

    if (!current) {
      return;
    }

    const nextUser = normalizeUser({ ...current, ...userPatch });

    if (!nextUser) {
      return;
    }

    const session = {
      user: nextUser,
      tokens: {
        accessToken: get().accessToken ?? '',
        refreshToken: get().refreshToken ?? '',
        expiresAt: get().expiresAt ?? Date.now(),
      },
    };

    await writeSecure<AuthSession>(AUTH_SESSION_KEY, session);
    await syncBiometricSession(session);

    set({ user: nextUser });
  },
  setPreferredLoginMode: async (mode) => {
    await writeSecure(AUTH_PREFS_KEY, { preferredLoginMode: mode });
    set({ preferredLoginMode: mode });
  },
  setBiometricEnabled: async (enabled) => {
    const currentUser = get().user;
    const accessToken = get().accessToken;

    if (!currentUser || !accessToken) {
      return;
    }

    await authService.setBiometricPreference({
      accessToken,
      deviceId: buildDeviceId(currentUser),
      enabled,
    });

    await get().updateUser({ biometricEnabled: enabled });
  },
  markMpinVerified: () => {
    set({ requiresMpinVerification: false });
  },
  signOut: async () => {
    const shouldKeepBiometricSession = Boolean(get().user?.biometricEnabled);
    const accessToken = get().accessToken;

    if (accessToken) {
      try {
        await authService.logout(accessToken);
      } catch {
        // Continue clearing local state even if the backend session is already invalid.
      }
    }

    await firebaseAuthService.signOut();
    await removeSecure(AUTH_SESSION_KEY);
    if (!shouldKeepBiometricSession) {
      await removeSecure(AUTH_BIOMETRIC_SESSION_KEY);
    }
    set({
      isAuthenticated: false,
      requiresMpinVerification: false,
      user: null,
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
    });
  },
}));
