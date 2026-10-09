import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Photo } from '@/components/Photo';
import { seedOf } from '@/components/ProductViews';
import { Screen } from '@/components/Screen';
import { EmptyView, ErrorView, LoadingView } from '@/components/States';
import { PrimaryButton, Stepper } from '@/components/ui';
import { config } from '@/data';
import { checkoutLinkUrl, openWebCheckout } from '@/services/webCheckout';
import { track } from '@/services/analytics';
import { useCartLines } from '@/hooks/useCartLines';
import { money } from '@/domain/pricing';
import { useCatalog } from '@/state/catalog';
import { useStore } from '@/state/store';
import { colors, fonts, radius, space, type } from '@/theme';

export default function BagScreen() {
  const router = useRouter();
  const { setQty, clearCart } = useStore();
  const { reload } = useCatalog();
  const { lines, sub, status, hydrated } = useCartLines();
  const [opening, setOpening] = useState(false);
  // Live store: hand the bag to the website checkout. Mock catalog: the in-app demo checkout.
  const webUrl = config.wooUrl ? checkoutLinkUrl(config.wooUrl, lines.map((l) => ({ variantId: l.variant.id, qty: l.item.qty }))) : null;
  const site = config.wooUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '');

  const checkout = async () => {
    if (!webUrl) { router.push('/checkout'); return; }
    const value = sub;
    track('begin_checkout', { value, items: lines.length, via: 'web' });
    setOpening(true);
    let done: { order: string } | null = null;
    try { done = await openWebCheckout(webUrl); } finally { setOpening(false); }
    // Placed: the store's thank-you page sent the shopper back and order-complete already cleared the bag.
    if (done) return;
    // Closed without the store sending them back (or the plugin isn't installed): ask before emptying the bag.
    Alert.alert('Did you place your order?', `If you finished checking out on ${site}, we’ll clear your bag.`, [
      { text: 'Not yet', style: 'cancel' },
      { text: 'Yes, clear my bag', onPress: () => {
        track('purchase', { value, via: 'web' });
        clearCart();
        router.push({ pathname: '/confirmed', params: { web: '1' } });
      } },
    ]);
  };

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
          <Text style={[type.small, { color: colors.muted, marginBottom: 16 }]}>
            {webUrl ? `Shipping and payment are completed securely on ${site}: Apple Pay, card or PayPal.` : 'Shipping is calculated at checkout.'}
          </Text>
          <PrimaryButton label="Checkout" loading={opening} onPress={checkout} />
        </View>
      )}
    </Screen>
  );
}
const s = StyleSheet.create({
  title: { color: colors.ink, paddingHorizontal: space.gutter, marginTop: 4, marginBottom: 12 },
  line: { flexDirection: 'row', gap: 14, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline },
  thumb: { width: 84, height: 100, borderRadius: radius.cardSm },
  name: { fontFamily: fonts.display, fontSize: 20, lineHeight: 24, color: colors.ink },
  lineBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  lineTotal: { fontFamily: fonts.medium, fontSize: 16, color: colors.ink },
  subRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 20, marginBottom: 4 },
  subTotal: { fontFamily: fonts.display, fontSize: 26, color: colors.ink },
});
