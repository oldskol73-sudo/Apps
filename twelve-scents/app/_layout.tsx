import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { BodoniModa_400Regular, BodoniModa_400Regular_Italic, BodoniModa_500Medium } from '@expo-google-fonts/bodoni-moda';
import { Jost_300Light, Jost_400Regular, Jost_500Medium } from '@expo-google-fonts/jost';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StoreProvider } from '@/state/store';
import { CatalogProvider } from '@/state/catalog';
import { Toast } from '@/components/Toast';
import { colors } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [loaded, error] = useFonts({ BodoniModa_400Regular, BodoniModa_400Regular_Italic, BodoniModa_500Medium, Jost_300Light, Jost_400Regular, Jost_500Medium });
  useEffect(() => { if (loaded || error) SplashScreen.hideAsync().catch(() => {}); }, [loaded, error]);
  if (!loaded && !error) return null;
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <CatalogProvider>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: 'slide_from_right' }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="product/[id]" />
            <Stack.Screen name="checkout" />
            <Stack.Screen name="confirmed" options={{ gestureEnabled: false }} />
          </Stack>
          <Toast />
        </CatalogProvider>
      </StoreProvider>
    </SafeAreaProvider>
  );
}
