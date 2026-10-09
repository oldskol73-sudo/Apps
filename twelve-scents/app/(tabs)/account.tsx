import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Photo } from '@/components/Photo';
import { seedOf } from '@/components/ProductViews';
import { Screen } from '@/components/Screen';
import { EmptyView, ErrorView, LoadingView } from '@/components/States';
import { StoneSwatch } from '@/components/StoneSwatch';
import { Kicker, OutlineButton } from '@/components/ui';
import { features } from '@/data';
import { isTribe, money, REWARD_STEP_POINTS, REWARD_STEP_VALUE, rewardProgress } from '@/domain/pricing';
import { authService, AuthSession } from '@/services/auth';
import { useCatalog } from '@/state/catalog';
import { nextDeliveryDate, useStore } from '@/state/store';
import { colors, fonts, radius, space, type } from '@/theme';

const fmt = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening'; };

export default function AccountScreen() {
  const router = useRouter();
  const { state, setSkipped, addToCart } = useStore();
  const { status, products, byId, reload } = useCatalog();
  const [session, setSession] = useState<AuthSession | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const { user, subscriptions, orders } = state;
  const prog = rewardProgress(user.points);
  const stones = products.filter(isTribe).slice(0, 12);

  const signIn = async (provider: AuthSession['provider']) => {
    try { setAuthError(null); setSession(await authService.signIn(provider)); } catch { setAuthError('Sign-in failed. Please try again.'); }
  };
  const reorder = (items: typeof orders[number]['items']) => {
    items.forEach((i) => { const p = byId(i.productId); if (p) addToCart(p, i.variantId, i.qty, i.plan); });
    router.navigate('/bag');
  };

  return (
    <Screen>
      <View style={s.pad}>
        <Kicker>{greeting()}</Kicker>
        <Text style={[type.h1, { color: colors.ink }]} accessibilityRole="header">{user.name}</Text>
      </View>

      <View style={[s.rewards, s.mx]} accessible accessibilityLabel={`${user.points} points, ${user.tier} tier. ${prog.pointsToNext} points to your next ${REWARD_STEP_VALUE} dollar reward.`}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View><Kicker color={colors.brassLight}>Rewards</Kicker><Text style={s.points}>{user.points.toLocaleString()}</Text><Text style={[type.small, { color: colors.onDarkMuted }]}>points</Text></View>
          <View style={s.tier}><Text style={[type.kicker, { color: colors.brassLight }]}>{user.tier}</Text></View>
        </View>
        <View style={s.track}>
          {Array.from({ length: 12 }).map((_, i) => (
            <View key={i} style={{ opacity: i < prog.stonesLit ? 1 : 0.28 }}>
              <StoneSwatch hex={stones[i]?.colorHex ?? colors.brassFill} band={stones[i]?.colorHex2} size={24} />
            </View>
          ))}
        </View>
        <Text style={[type.small, { color: colors.onDark }]}>{prog.pointsToNext.toLocaleString()} pts to your next ${REWARD_STEP_VALUE} reward · every {REWARD_STEP_POINTS.toLocaleString()} pts</Text>
      </View>

      <View style={[s.mx, { marginTop: 14 }]}>
        {session ? (
          <Text style={[type.small, { color: colors.textSecondary }]}>Signed in as {session.email} · favourites &amp; bag sync enabled</Text>
        ) : (
          <View style={{ gap: 8 }}>
            <Text style={[type.small, { color: colors.textSecondary }]}>Sign in to sync your bag, favourites and rewards.</Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              <OutlineButton label="Apple" onPress={() => signIn('apple')} /><OutlineButton label="Google" onPress={() => signIn('google')} /><OutlineButton label="Email link" onPress={() => signIn('magic_link')} />
            </View>
            {authError && <Text accessibilityRole="alert" style={[type.small, { color: colors.danger }]}>{authError}</Text>}
          </View>
        )}
      </View>

      {status === 'loading' && <LoadingView />}
      {status === 'error' && <ErrorView onRetry={reload} />}
      {status === 'ready' && (<>
        {features.subscriptions && (<>
        <View style={s.head}><Kicker>Subscriptions</Kicker><Text style={s.h2} accessibilityRole="header">Your deliveries</Text></View>
        <View style={[s.mx, { gap: 10 }]}>
          {subscriptions.length === 0 && <View style={s.card}><EmptyView title="No subscriptions" body="Subscribe & save 10% on any spray." action="Browse sprays" onAction={() => router.navigate({ pathname: '/browse', params: { cat: 'tribes' } })} /></View>}
          {subscriptions.map((sub) => {
            const p = byId(sub.productId); if (!p) return null;
            const v = p.variants.find((x) => x.id === sub.variantId);
            return (
              <View key={sub.id} style={[s.card, { flexDirection: 'row', alignItems: 'center', gap: 14 }]}>
                <Photo uri={p.images[0]} tone={p.colorHex} seed={seedOf(p)} style={s.thumb} />
                <View style={{ flex: 1 }}>
                  <Text style={s.itemName}>{p.name}</Text>
                  <Text style={[type.small, { color: colors.textSecondary }]}>{v?.label} · every {sub.intervalWeeks} wks</Text>
                  <Text style={[type.small, { color: sub.skipped ? colors.brassText : colors.ink }]}>{sub.skipped ? `Skipped · next ${fmt(nextDeliveryDate(sub))}` : `Next delivery ${fmt(sub.nextDate)}`}</Text>
                </View>
                <OutlineButton label={sub.skipped ? 'Undo' : 'Skip'} onPress={() => setSkipped(sub.id, !sub.skipped)} />
              </View>
            );
          })}
        </View>

        </>)}

        <View style={s.head}><Kicker>Orders</Kicker><Text style={s.h2} accessibilityRole="header">History</Text></View>
        <View style={[s.mx, { gap: 10 }]}>
          {orders.length === 0 && <View style={s.card}><EmptyView title="No orders yet" body="Your first order will appear here." /></View>}
          {orders.map((o) => (
            <View key={o.id} style={s.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={s.itemName}>#{o.id}</Text><Text style={[type.label, { color: colors.ink }]}>{money(o.total)}</Text>
              </View>
              <Text style={[type.small, { color: colors.textSecondary, marginVertical: 4 }]}>{fmt(o.date)} · {o.items.map((i) => `${byId(i.productId)?.name ?? 'Item'}${i.qty > 1 ? ` ×${i.qty}` : ''}`).join(', ')}</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[type.small, { color: colors.brassText }]}>+{o.pointsEarned} pts</Text>
                <OutlineButton label="Reorder" onPress={() => reorder(o.items)} />
              </View>
            </View>
          ))}
        </View>
      </>)}
    </Screen>
  );
}
const s = StyleSheet.create({
  pad: { paddingHorizontal: space.gutter, marginBottom: 16 },
  mx: { marginHorizontal: space.gutter },
  rewards: { backgroundColor: colors.dark, borderRadius: radius.card, padding: 20, gap: 16 },
  points: { fontFamily: fonts.display, fontSize: 52, lineHeight: 56, color: colors.onDark },
  tier: { borderWidth: 1, borderColor: colors.brassFill, borderRadius: radius.pill, paddingHorizontal: 14, minHeight: 32, justifyContent: 'center' },
  track: { flexDirection: 'row', justifyContent: 'space-between' },
  head: { paddingHorizontal: space.gutter, marginTop: 32, marginBottom: 12 },
  h2: { fontFamily: fonts.display, fontSize: 26, color: colors.ink },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.hairline, padding: 14 },
  thumb: { width: 56, height: 56, borderRadius: radius.cardSm },
  itemName: { fontFamily: fonts.display, fontSize: 19, color: colors.ink },
});
