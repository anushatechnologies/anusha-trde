import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { useEffect } from 'react';

import { useAppStore } from '../store/use-app-store';
import { useAuthStore } from '../store/use-auth-store';

void SplashScreen.preventAutoHideAsync();

export const useAppBootstrap = () => {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const hydrateAuth = useAuthStore((state) => state.hydrate);
  const authReady = useAuthStore((state) => state.isHydrated);
  const hydrateApp = useAppStore((state) => state.hydrate);
  const appReady = useAppStore((state) => state.isHydrated);

  useEffect(() => {
    void hydrateAuth();
    void hydrateApp();
  }, [hydrateApp, hydrateAuth]);

  const ready = fontsLoaded && authReady && appReady;

  useEffect(() => {
    if (ready) {
      void SplashScreen.hideAsync();
    }
  }, [ready]);

  return { ready };
};
