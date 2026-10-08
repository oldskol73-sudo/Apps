import React, { useEffect, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { EmptyView, LoadingView } from '@/components/States';
import { CircleButton, Kicker, OutlineButton, PrimaryButton, Switch2, tap } from '@/components/ui';
import { orderTotal, money, pointsDiscount, pointsEarned, POINTS_REDEEM_COST } from '@/domain/pricing';
import { shippingOptions } from '@/domain/shipping';
import { Address, ShippingMethod } from '@/domain/types';
import { useCartLines } from '@/hooks/useCartLines';
import { useCatalog } from '@/state/catalog';
import { paymentService } from '@/services/payments';
import { track } from '@/services/analytics';
import { useStore } from '@/state/store';
import { colors, fonts, radius, space, type } from '@/theme';

type Pay = 'wallet' | 'card';

export default function CheckoutScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { state, setAddress, placeOrder } = useStore();
  const { lines, sub, status, hydrated } = useCartLines();
  const { zones } = useCatalog();
  const [method, setMethod] = useState<ShippingMethod>('flat_rate');
  const [pay, setPay] = useState<Pay>('wallet');
  const [usePts, setUsePts] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Address>(state.user.address);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { if (lines.length) track('begin_checkout', { value: sub, items: lines.length }); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const walletName = Platform.OS === 'android' ? 'Google Pay' : 'Apple Pay';
  const options = shippingOptions(state.user.address.region, zones);
  const chosen = options.find((o) => o.method === method) ?? options[0];
  const ship = chosen?.cost ?? 0;
  const discount = pointsDiscount(usePts, state.user.points, sub);
  const total = orderTotal(sub, ship, discount);
  const canRedeem = state.user.points >= POINTS_REDEEM_COST;
  const addr = state.user.address;
  const hasSub = lines.some((l) => l.item.plan === 'subscription');

  const place = async () => {
    if (!chosen) { setError('We don’t ship to that state yet. Please check your address.'); return; }
    setBusy(true); setError(null);
    try {
      const res = await paymentService.pay({ amount: total, currency: 'usd', method: pay === 'card' ? 'card' : Platform.OS === 'android' ? 'google_pay' : 'apple_pay', shipTo: addr, recurring: hasSub });
      if (!res.ok) { setError(res.error ?? 'Your payment didn’t go through. You haven’t been charged.'); return; }
      const order = placeOrder({ items: lines.map((l) => ({ product: l.product, variantId: l.item.variantId, qty: l.item.qty, plan: l.item.plan })), total, discount, subtotal: sub, spentPoints: discount > 0 ? POINTS_REDEEM_COST : 0, shipping: chosen.method });
      track('purchase', { transaction_id: order.id, value: total });
      router.replace({ pathname: '/confirmed', params: { id: order.id } });
    } catch {
      setError('Something went wrong placing your order. You haven’t been charged — please try again.');
    } finally { setBusy(false); }
  };

  const saveAddress = () => { setAddress(draft); setEditing(false); };
  const field = (k: keyof Address, label: string) => (
    <TextInput key={k} value={draft[k]} onChangeText={(v) => setDraft({ ...draft, [k]: v })} accessibilityLabel={label} placeholder={label} placeholderTextColor={colors.muted} style={s.input} />
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      <View style={s.head}>
        <CircleButton icon="back" label="Back" onPress={() => router.back()} border="transparent" />
        <Text style={[type.section, { color: colors.ink }]} accessibilityRole="header">Checkout</Text>
        <View style={{ width: 44 }} />
      </View>
      {(!hydrated || status === 'loading') && <LoadingView />}
      {hydrated && status !== 'loading' && lines.length === 0 && <EmptyView title="Nothing to check out" body="Your bag is empty." action="Browse" onAction={() => router.replace('/browse')} />}
      {hydrated && lines.length > 0 && (
        <ScrollView contentContainerStyle={{ padding: space.gutter, paddingBottom: 40 + insets.bottom }} keyboardShouldPersistTaps="handled">
          <Kicker>Ship to</Kicker>
          <View style={s.card}>
            {editing ? (
              <View style={{ gap: 8 }}>
                {field('name', 'Full name')}{field('line1', 'Address')}{field('city', 'City')}
                <View style={{ flexDirection: 'row', gap: 8 }}><View style={{ flex: 1 }}>{field('region', 'State')}</View><View style={{ flex: 1 }}>{field('postcode', 'ZIP')}</View></View>
                <View style={{ flexDirection: 'row', gap: 8 }}><OutlineButton label="Cancel" onPress={() => { setDraft(addr); setEditing(false); }} /><View style={{ flex: 1 }}><PrimaryButton label="Save address" onPress={saveAddress} /></View></View>
              </View>
            ) : (
              <View style={s.rowBetween}>
                <View style={{ flex: 1 }}>
                  <Text style={[type.body, { color: colors.ink }]}>{addr.name}</Text>
                  <Text style={[type.small, { color: colors.textSecondary }]}>{addr.line1}, {addr.city}, {addr.region} {addr.postcode}</Text>
                </View>
                <OutlineButton label="Edit" onPress={() => { setDraft(addr); setEditing(true); }} />
              </View>
            )}
          </View>

          <Kicker style={s.gap}>Delivery</Kicker>
          <View style={s.card}>
            {options.length === 0 && <Text accessibilityRole="alert" style={[type.body, { color: colors.danger, paddingVertical: 12 }]}>We don’t ship to “{addr.region || 'that state'}” yet. Edit your address to continue.</Text>}
            {options.map((o, i) => (
              <Option key={o.method} selected={chosen?.method === o.method} onPress={() => setMethod(o.method)} title={o.method === 'local_pickup' ? 'Local pickup' : 'Flat rate'}
                sub={o.method === 'local_pickup' ? 'Pick up your order' : o.title.replace('Flat rate · ', '')} price={o.cost === 0 ? 'Free' : money(o.cost)} last={i === options.length - 1} />
            ))}
          </View>

          <Kicker style={s.gap}>Payment</Kicker>
          <View style={s.card}>
            <Option selected={pay === 'wallet'} onPress={() => setPay('wallet')} title={walletName} sub="Pay with Stripe" />
            <Option selected={pay === 'card'} onPress={() => setPay('card')} title="Saved card" sub="Visa •••• 4242" last />
          </View>

          <View style={[s.card, s.gapCard, s.rowBetween]}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={[type.label, { color: colors.ink }]}>Use 1,000 points</Text>
              <Text style={[type.small, { color: colors.textSecondary }]}>{canRedeem ? `$10 off · you have ${state.user.points.toLocaleString()} pts` : `You have ${state.user.points.toLocaleString()} pts — need 1,000`}</Text>
            </View>
            <PointsSwitch value={usePts && canRedeem} disabled={!canRedeem} onChange={setUsePts} />
          </View>

          <View style={s.totals}>
            <Row label={`Items (${lines.reduce((n, l) => n + l.item.qty, 0)})`} value={money(sub)} />
            <Row label={chosen?.method === 'local_pickup' ? 'Pickup' : 'Shipping'} value={ship === 0 ? 'Free' : money(ship)} />
            {discount > 0 && <Row label="Points" value={`−${money(discount)}`} />}
            <View style={[s.rowBetween, { marginTop: 8 }]}><Text style={[type.label, { color: colors.ink }]}>Total</Text><Text style={s.total}>{money(total)}</Text></View>
            <Text style={[type.small, { color: colors.brassText }]}>You’ll earn {pointsEarned(sub, discount)} points</Text>
          </View>

          {error && <Text accessibilityRole="alert" style={[type.body, { color: colors.danger, marginBottom: 12 }]}>{error}</Text>}
          <PrimaryButton label={error ? 'Try again' : `Place order · ${money(total)}`} loading={busy} disabled={!chosen} onPress={place} />
        </ScrollView>
      )}
    </View>
  );
}

function PointsSwitch({ value, onChange, disabled }: { value: boolean; onChange: (v: boolean) => void; disabled: boolean }) {
  return (
    <Pressable disabled={disabled} onPress={() => { tap(); onChange(!value); }} accessibilityRole="switch" accessibilityLabel="Use 1,000 points for $10 off" accessibilityState={{ checked: value, disabled }} hitSlop={8}
      style={{ width: 50, height: 30, borderRadius: 15, padding: 3, borderWidth: 1, borderColor: value ? colors.brassFill : colors.hairline, backgroundColor: value ? colors.brassFill : colors.surface, opacity: disabled ? 0.5 : 1, alignItems: value ? 'flex-end' : 'flex-start', justifyContent: 'center' }}>
      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: value ? colors.btnText : colors.muted }} />
    </Pressable>
  );
}
function Option({ selected, onPress, title, sub, price, last }: { selected: boolean; onPress: () => void; title: string; sub: string; price?: string; last?: boolean }) {
  return (
    <Pressable onPress={() => { tap(); onPress(); }} accessibilityRole="radio" accessibilityState={{ selected }} accessibilityLabel={`${title}, ${sub}${price ? `, ${price}` : ''}`}
      style={[s.option, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline }]}>
      <View style={[s.radio, selected && { borderColor: colors.brassFill }]}>{selected && <View style={s.radioDot} />}</View>
      <View style={{ flex: 1 }}><Text style={[type.body, { color: colors.ink }]}>{title}</Text><Text style={[type.small, { color: colors.textSecondary }]}>{sub}</Text></View>
      {price ? <Text style={[type.label, { color: colors.ink }]}>{price}</Text> : null}
    </Pressable>
  );
}
const Row = ({ label, value }: { label: string; value: string }) => (<View style={s.rowBetween}><Text style={[type.body, { color: colors.textSecondary }]}>{label}</Text><Text style={[type.body, { color: colors.ink }]}>{value}</Text></View>);
void Icon;

const s = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, minHeight: 56 },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.hairline, paddingHorizontal: 16, paddingVertical: 8, marginTop: 8 },
  gap: { marginTop: 24 },
  gapCard: { marginTop: 24, paddingVertical: 14 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 60 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.brassFill },
  input: { minHeight: 48, borderRadius: radius.cardSm, borderWidth: 1, borderColor: colors.hairline, paddingHorizontal: 14, fontFamily: fonts.body, fontSize: 16, color: colors.ink, backgroundColor: colors.bg },
  totals: { marginVertical: 24, gap: 6 },
  total: { fontFamily: fonts.display, fontSize: 30, color: colors.ink },
});
void Switch2;
