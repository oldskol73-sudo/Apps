import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { basePrice, CATEGORY_KICKER, money } from '@/domain/pricing';
import { Product } from '@/domain/types';
import { useStore } from '@/state/store';
import { colors, radius, type } from '@/theme';
import { Photo } from './Photo';
import { CircleButton, Kicker } from './ui';

export const kickerFor = (p: Product) => (p.numeral && p.stone ? `${p.numeral} · ${p.stone} · ${CATEGORY_KICKER[p.category]}` : CATEGORY_KICKER[p.category]);
const seedOf = (p: Product) => p.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
export const firstAvailable = (p: Product) => p.variants.find((v) => v.inStock !== false);

/** Quick-add (+) button for the first in-stock variant, or a "Sold out" label. */
export function QuickAdd({ product, solid = true }: { product: Product; solid?: boolean }) {
  const { addToCart } = useStore();
  const v = firstAvailable(product);
  if (!v) return <Text style={[type.small, { color: colors.muted, paddingHorizontal: 8 }]} accessibilityLabel={`${product.name} is sold out`}>Sold out</Text>;
  return solid
    ? <CircleButton icon="plus" label={`Add ${product.name} to bag`} onPress={() => addToCart(product, v.id)} color={colors.btnText} bg={colors.brassFill} border={colors.brassFill} />
    : <CircleButton icon="plus" label={`Add ${product.name} to bag`} onPress={() => addToCart(product, v.id)} />;
}

/** 2-column grid card: photo, kicker, name, "From $X", quick-add. */
export function ProductCard({ product, width }: { product: Product; width?: number }) {
  const router = useRouter();
  return (
    <View style={[s.card, width ? { width } : { flex: 1 }]}>
      <Pressable accessibilityRole="button" accessibilityLabel={`${product.name}, from ${money(basePrice(product))}`} onPress={() => router.push(`/product/${product.id}`)}>
        <Photo uri={product.images[0]} tone={product.colorHex} seed={seedOf(product)} scrim="bottom" style={s.photo} />
        <View style={{ padding: 12, paddingBottom: 14, paddingRight: 56 }}>
          <Kicker style={{ fontSize: 10 }} color={colors.brassText}>{CATEGORY_KICKER[product.category]}</Kicker>
          <Text style={[s.name]} numberOfLines={2}>{product.name}</Text>
          <Text style={[type.small, { color: colors.textSecondary }]}>From {money(basePrice(product))}</Text>
        </View>
      </Pressable>
      <View style={s.add}><QuickAdd product={product} /></View>
    </View>
  );
}

/** Compact list row with quick-add (Essentials). */
export function ProductRow({ product }: { product: Product }) {
  const router = useRouter();
  return (
    <View style={s.row}>
      <Pressable style={s.rowMain} accessibilityRole="button" accessibilityLabel={`${product.name}, from ${money(basePrice(product))}`} onPress={() => router.push(`/product/${product.id}`)}>
        <Photo uri={product.images[0]} tone={product.colorHex} seed={seedOf(product)} style={s.thumb} />
        <View style={{ flex: 1 }}>
          <Text style={s.rowName} numberOfLines={1}>{product.name}</Text>
          <Text style={[type.small, { color: colors.textSecondary }]} numberOfLines={1}>{product.variants[0].label} · {money(basePrice(product))}</Text>
        </View>
      </Pressable>
      <QuickAdd product={product} solid={false} />
    </View>
  );
}
export { seedOf };
const s = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.card, overflow: 'hidden', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.hairline },
  photo: { height: 150 },
  name: { fontFamily: 'BodoniModa_400Regular', fontSize: 19, lineHeight: 23, color: colors.ink, marginVertical: 2 },
  add: { position: 'absolute', right: 8, bottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.hairline },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 44 },
  thumb: { width: 60, height: 60, borderRadius: radius.cardSm },
  rowName: { fontFamily: 'BodoniModa_400Regular', fontSize: 19, color: colors.ink },
});
