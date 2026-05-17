import React, { useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from '@/navigation';
import { useAuthStore } from '@/store/authStore';
import { initConnection, teardownConnection } from '@/services/ConnectionManager';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

export default function App() {
  const hydrate = useAuthStore((s) => s.hydrate);

  const handleAppState = useCallback(async (nextState: AppStateStatus) => {
    if (nextState === 'active') {
      await initConnection();
    } else if (nextState === 'background' || nextState === 'inactive') {
      await teardownConnection();
    }
  }, []);

  useEffect(() => {
    // Hydrate auth + init connection on mount
    hydrate();
    initConnection();

    const sub = AppState.addEventListener('change', handleAppState);
    return () => {
      sub.remove();
      teardownConnection();
    };
  }, [hydrate, handleAppState]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
