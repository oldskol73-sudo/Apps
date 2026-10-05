import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { EmptyView } from '@/components/States';
import { Kicker, OutlineButton, PrimaryButton } from '@/components/ui';
import { money } from '@/domain/pricing';
import { useStore } from '@/state/store';
import { colors, fonts, gradients, type } from '@/theme';

export default function ConfirmedScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state } = useStore();
  const order = state.orders.find((o) => o.id === id) ?? state.orders[0];
  if (!order) return <EmptyView title="No order found" action="Back to shop" onAction={() => router.replace('/')} />;
  return (
    <View style={[s.wrap, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
      <LinearGradient colors={gradients.primary} style={s.check} accessibilityElementsHidden><Icon name="check" size={40} color={colors.btnText} /></LinearGradient>
      <Kicker style={{ marginTop: 28 }}>Order confirmed</Kicker>
      <Text style={[type.h1, { color: colors.ink, textAlign: 'center' }]} accessibilityRole="header">Thank you.</Text>
      <Text style={[type.body, { color: colors.textSecondary, textAlign: 'center', marginTop: 8 }]}>Your order <Text style={{ fontFamily: fonts.medium, color: colors.ink }}>#{order.id}</Text> is being prepared. We’ll notify you when it ships.</Text>
      <View style={s.pts} accessible accessibilityLabel={`You earned ${order.pointsEarned} points`}>
        <Text style={s.ptsNum}>+{order.pointsEarned}</Text>
        <Text style={[type.small, { color: colors.textSecondary }]}>points earned · total {money(order.total)}</Text>
      </View>
      <View style={{ flex: 1 }} />
      <View style={{ width: '100%', gap: 10 }}>
        <PrimaryButton label="Continue shopping" onPress={() => router.replace('/')} />
        <OutlineButton label="View account" onPress={() => router.replace('/account')} />
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, alignItems: 'center', paddingHorizontal: 24 },
  check: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },
  pts: { marginTop: 32, backgroundColor: colors.tint, borderRadius: 16, paddingVertical: 18, paddingHorizontal: 32, alignItems: 'center' },
  ptsNum: { fontFamily: fonts.display, fontSize: 44, color: colors.brassText },
});
