import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { markWebOrderComplete } from '@/services/webCheckout';
import { track } from '@/services/analytics';
import { useStore } from '@/state/store';
import { colors } from '@/theme';

/**
 * Deep link twelvescents://order-complete?order=<number>, opened by the store's order-received page
 * (wordpress/twelve-scents-app-return.php) after an order placed from the app. Closes the checkout sheet,
 * empties the bag and shows the confirmation.
 */
export default function OrderCompleteScreen() {
  const { order = '' } = useLocalSearchParams<{ order?: string }>();
  const router = useRouter();
  const { state, clearCart } = useStore();
  const handled = useRef(false);

  useEffect(() => {
    // Wait for the saved bag to load (cold start from the link), or hydration would bring the items back.
    if (!state.hydrated || handled.current) return;
    handled.current = true;
    markWebOrderComplete(order);
    clearCart();
    track('purchase', { via: 'web', order });
    router.replace({ pathname: '/confirmed', params: { web: '1', order } });
  }, [state.hydrated, order, clearCart, router]);

  return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
}
