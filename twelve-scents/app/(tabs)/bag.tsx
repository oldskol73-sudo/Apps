import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Photo } from '@/components/Photo';
import { seedOf } from '@/components/ProductViews';
import { Screen } from '@/components/Screen';
import { EmptyView, ErrorView, LoadingView } from '@/components/States';
import { PrimaryButton, Stepper } from '@/components/ui';
import { useCartLines } from '@/hooks/useCartLines';
import { freeShippingRemaining, money } from '@/domain/pricing';
import { useCatalog } from '@/state/catalog';
import { useStore } from '@/state/store';
import { colors, fonts, radius, space, type } from '@/theme';

export default function BagScreen() {
  const router = useRouter();
  const { setQty } = useStore();
  const { reload } = useCatalog();
  const { lines, sub, threshold, status, hydrated } = useCartLines();
  const remaining = freeShippingRemaining(sub, threshold);
  const pct = Math.min(1, sub / threshold);

  return (
    <Screen>
      <Text style={[type.h1, s.title]} accessibilityRole="header">Bag</Text>
      {(!hydrated || status === 'loading') && <LoadingView label="Loading your bag" />}
      {hydrated && status === 'error' && <ErrorView message="We couldn’t load your bag items." onRetry={reload} />}
      {hydrated && status === 'ready' && lines.length === 0 && (
        <EmptyView title="Your bag is empty" body="Find something to light — start with the twelve." action="Start shopping" onAction={() => router.navigate('/browse')} />
      )}
      {hydrated && status === 'ready' && lines.length > 0 && (
        <View style={{ paddingHorizontal: space.gutter }}>
          <View style={s.ship} accessible accessibilityLabel={remaining > 0 ? `Add ${money(remaining)} more for free shipping` : 'You have free shipping'}>
            <Text style={[type.body, { color: colors.ink }]}>{remaining > 0 ? `Add ${money(remaining)} more for free shipping` : 'You’ve unlocked free shipping'}</Text>
            <View style={s.track}><View style={[s.fill, { width: `${pct * 100}%` }]} /></View>
          </View>
          {lines.map(({ item, product, variant, total }) => (
            <View key={`${item.productId}-${item.variantId}-${item.plan}`} style={s.line}>
              <Photo uri={product.images[0]} tone={product.colorHex} seed={seedOf(product)} style={s.thumb} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={s.name} numberOfLines={2}>{product.name}</Text>
                <Text style={[type.small, { color: colors.textSecondary }]} numberOfLines={1}>{variant.label}</Text>
                <Text style={[type.small, { color: item.plan === 'subscription' ? colors.brassText : colors.muted }]}>
                  {item.plan === 'subscription' ? 'Subscription · every 6 weeks · −10%' : 'One-time purchase'}
                </Text>
                <View style={s.lineBottom}>
                  <Stepper qty={item.qty} onChange={(n) => setQty(item, n)} />
                  <Text style={s.lineTotal}>{money(total)}</Text>
                </View>
              </View>
            </View>
          ))}
          <View style={s.subRow}>
            <Text style={[type.body, { color: colors.textSecondary }]}>Subtotal</Text>
            <Text style={s.subTotal}>{money(sub)}</Text>
          </View>
          <Text style={[type.small, { color: colors.muted, marginBottom: 16 }]}>Shipping and rewards are calculated at checkout.</Text>
          <PrimaryButton label="Checkout" onPress={() => router.push('/checkout')} />
        </View>
      )}
    </Screen>
  );
}
const s = StyleSheet.create({
  title: { color: colors.ink, paddingHorizontal: space.gutter, marginTop: 4, marginBottom: 12 },
  ship: { backgroundColor: colors.tint, borderRadius: radius.card, padding: 16, gap: 10, marginBottom: 8 },
  track: { height: 6, borderRadius: 3, backgroundColor: colors.hairline, overflow: 'hidden' },
  fill: { height: 6, backgroundColor: colors.brassFill, borderRadius: 3 },
  line: { flexDirection: 'row', gap: 14, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline },
  thumb: { width: 84, height: 100, borderRadius: radius.cardSm },
  name: { fontFamily: fonts.display, fontSize: 20, lineHeight: 24, color: colors.ink },
  lineBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  lineTotal: { fontFamily: fonts.medium, fontSize: 16, color: colors.ink },
  subRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 20, marginBottom: 4 },
  subTotal: { fontFamily: fonts.display, fontSize: 26, color: colors.ink },
});
