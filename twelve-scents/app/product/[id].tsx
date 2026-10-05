import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Photo } from '@/components/Photo';
import { kickerFor, seedOf } from '@/components/ProductViews';
import { EmptyView, ErrorView, LoadingView } from '@/components/States';
import { CircleButton, Kicker, PrimaryButton, Stepper, Switch2, tap } from '@/components/ui';
import { basePrice, lineTotal, money, SUBSCRIPTION_DISCOUNT, unitPrice } from '@/domain/pricing';
import { track } from '@/services/analytics';
import { useCatalog } from '@/state/catalog';
import { useStore } from '@/state/store';
import { colors, fonts, radius, space, type } from '@/theme';

const VIEWS = ['Main', 'Detail', 'In use'];

export default function ProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { status, byId, reload } = useCatalog();
  const { state, addToCart, toggleFavourite } = useStore();
  const product = byId(String(id));
  const [img, setImg] = useState(0);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [sub, setSub] = useState(false);
  const [qty, setQty] = useState(1);

  useEffect(() => { if (product) track('view_item', { item_id: product.id }); }, [product?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const top = (children?: React.ReactNode) => (
    <View style={[s.topBar, { top: insets.top + 8 }]}>
      <CircleButton icon="back" label="Back" onPress={back} color={colors.onDark} border={colors.hairlineDark} bg="rgba(20,14,10,0.45)" />
      {children}
    </View>
  );
  const shell = (body: React.ReactNode) => (<View style={{ flex: 1, backgroundColor: colors.dark, paddingTop: insets.top + 60 }}><StatusBar style="light" />{top()}{body}</View>);

  if (status === 'loading') return shell(<LoadingView />);
  if (status === 'error') return shell(<ErrorView message="We couldn’t load this product." onRetry={reload} />);
  if (!product) return shell(<EmptyView dark title="Product not found" body="It may have been removed from the catalog." action="Browse all" onAction={() => router.replace('/browse')} />);

  const variant = product.variants.find((v) => v.id === variantId) ?? product.variants[0];
  const plan = sub && product.subscribable ? 'subscription' : 'once';
  const total = lineTotal(variant.price, qty, plan);
  const fav = state.user.favourites.includes(product.id);
  const pairings = product.pairings.map(byId).filter(Boolean) as NonNullable<ReturnType<typeof byId>>[];
  const images = product.images.length ? product.images : [''];

  return (
    <View style={{ flex: 1, backgroundColor: colors.dark }}>
      <StatusBar style="light" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 + insets.bottom }}>
        <Photo uri={images[img] ?? images[0]} tone={product.colorHex} seed={seedOf(product) + img} scrim="bottom" style={[s.hero, { height: 400 + insets.top }]}
          label={`${product.name}, ${VIEWS[img] ?? 'Main'} photo`}>
          <View style={s.heroText}>
            <Kicker color={colors.brassLight}>{kickerFor(product)}</Kicker>
            <Text style={s.name} accessibilityRole="header">{product.name}</Text>
            <Text style={s.tagline}>{product.tagline}</Text>
          </View>
        </Photo>

        <View style={s.thumbs}>
          {VIEWS.map((v, i) => (
            <Pressable key={v} onPress={() => { tap(); setImg(i); }} accessibilityRole="button" accessibilityLabel={`${v} photo`} accessibilityState={{ selected: img === i }}
              style={[s.thumb, img === i && { borderColor: colors.brassFill, borderWidth: 2 }]}>
              <Photo uri={images[i] ?? images[0]} tone={product.colorHex} seed={seedOf(product) + i} style={StyleSheet.absoluteFill} />
            </Pressable>
          ))}
          <Pressable onPress={() => router.navigate({ pathname: '/browse', params: { cat: product.category } })} accessibilityRole="button" accessibilityLabel="More in this category" style={[s.thumb, s.moreTile]}>
            <Icon name="arrow" size={22} color={colors.onDark} />
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: space.gutter }}>
          <Text style={[type.body, { color: colors.onDark, fontFamily: fonts.light, fontSize: 16, lineHeight: 25 }]}>{product.description}</Text>
          <View style={s.details}>
            {product.details.slice(0, 3).map((d, i) => (
              <View key={d.label} style={[s.detail, i > 0 && { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: colors.hairlineDark }]}>
                <Kicker color={colors.brassLight} style={{ fontSize: 10 }}>{d.label}</Kicker>
                <Text style={[type.small, { color: colors.onDark, marginTop: 4 }]}>{d.value}</Text>
              </View>
            ))}
          </View>

          <View style={s.panel}>
            <Text style={[type.small, { color: colors.onDarkMuted, marginBottom: 6 }]}>Type</Text>
            <Pressable onPress={() => { tap(); setOpen(!open); }} accessibilityRole="button" accessibilityLabel={`Type: ${variant.label}, ${money(variant.price)}. ${open ? 'Collapse' : 'Expand'} options`} accessibilityState={{ expanded: open }} style={s.dropdown}>
              <Text style={[type.body, { color: colors.onDark, flex: 1 }]}>{variant.label}{product.variants.length > 1 ? '' : ''}</Text>
              <Text style={[type.body, { color: colors.onDarkMuted, marginRight: 8 }]}>{money(unitPrice(variant.price, plan))}</Text>
              <Icon name="down" size={20} color={colors.onDark} />
            </Pressable>
            {open && product.variants.map((v) => (
              <Pressable key={v.id} onPress={() => { setVariantId(v.id); setOpen(false); }} accessibilityRole="radio" accessibilityState={{ selected: v.id === variant.id }} style={s.option}>
                <Text style={[type.body, { color: v.id === variant.id ? colors.brassLight : colors.onDark, flex: 1 }]}>{v.label}</Text>
                <Text style={[type.body, { color: colors.onDarkMuted }]}>{money(v.price)}</Text>
              </Pressable>
            ))}
            {product.subscribable && (
              <View style={s.subRow}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={[type.label, { color: colors.onDark }]}>Subscribe & save {SUBSCRIPTION_DISCOUNT * 100}%</Text>
                  <Text style={[type.small, { color: colors.onDarkMuted }]}>Delivered every 6 weeks. Skip or cancel anytime.</Text>
                </View>
                <Switch2 value={sub} onChange={setSub} label="Subscribe and save 10 percent" />
              </View>
            )}
          </View>

          <View style={s.buyRow}>
            <Stepper dark qty={qty} min={1} onChange={setQty} />
            <PrimaryButton style={{ flex: 1 }} label={`Add to Bag · ${money(total)}`} onPress={() => { addToCart(product, variant.id, qty, plan); setQty(1); }} />
          </View>

          {pairings.length > 0 && (
            <View style={{ marginTop: 36 }}>
              <Kicker color={colors.brassLight}>Pairs well</Kicker>
              <Text style={[type.section, { color: colors.onDark, marginBottom: 6 }]} accessibilityRole="header">Complete the ritual</Text>
              {pairings.map((p) => (
                <Pressable key={p.id} onPress={() => router.push(`/product/${p.id}`)} accessibilityRole="button" accessibilityLabel={`${p.name}, from ${money(basePrice(p))}`} style={s.pairRow}>
                  <Photo uri={p.images[0]} tone={p.colorHex} seed={seedOf(p)} style={s.pairThumb} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: fonts.display, fontSize: 19, color: colors.onDark }}>{p.name}</Text>
                    <Text style={[type.small, { color: colors.onDarkMuted }]}>From {money(basePrice(p))}</Text>
                  </View>
                  <Icon name="arrow" size={20} color={colors.brassLight} />
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      {top(
        <CircleButton icon="heart" filled={fav} label={fav ? 'Remove from favourites' : 'Add to favourites'} onPress={() => toggleFavourite(product.id)}
          color={fav ? colors.brassLight : colors.onDark} border={colors.hairlineDark} bg="rgba(20,14,10,0.45)" />,
      )}
    </View>
  );
}

const s = StyleSheet.create({
  topBar: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', zIndex: 5 },
  hero: { justifyContent: 'flex-end' },
  heroText: { paddingHorizontal: space.gutter, paddingBottom: 20 },
  name: { fontFamily: fonts.display, fontSize: 40, lineHeight: 42, color: colors.onDark, marginTop: 6 },
  tagline: { fontFamily: fonts.displayItalic, fontSize: 18, color: colors.onDark, marginTop: 6 },
  thumbs: { flexDirection: 'row', gap: 10, padding: space.gutter },
  thumb: { flex: 1, aspectRatio: 1, borderRadius: radius.cardSm, overflow: 'hidden', borderWidth: 1, borderColor: colors.hairlineDark },
  moreTile: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.darkPanel },
  details: { flexDirection: 'row', marginTop: 22, paddingVertical: 14, borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.hairlineDark },
  detail: { flex: 1, paddingHorizontal: 12 },
  panel: { marginTop: 26, backgroundColor: colors.darkPanel, borderRadius: radius.card, padding: 16 },
  dropdown: { minHeight: 48, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.hairlineDark },
  option: { minHeight: 48, flexDirection: 'row', alignItems: 'center' },
  subRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.hairlineDark },
  buyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20 },
  pairRow: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 72, paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairlineDark },
  pairThumb: { width: 56, height: 56, borderRadius: radius.cardSm },
});
