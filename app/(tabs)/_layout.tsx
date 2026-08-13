import { Redirect, Tabs } from 'expo-router';

import { FloatingTabBar } from '../../components/navigation/floating-tab-bar';
import { useAuthStore } from '../../store/use-auth-store';

export default function TabsLayout() {
  const requiresMpinVerification = useAuthStore((state) => state.requiresMpinVerification);

  if (requiresMpinVerification) {
    return <Redirect href="/(auth)/mpin-verification" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="invest" options={{ title: 'Invest' }} />
      <Tabs.Screen name="team" options={{ title: 'Team' }} />
      <Tabs.Screen name="wallet" options={{ title: 'Wallet' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
