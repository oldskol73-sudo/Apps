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
export const useQuickAdd = () => {
  const { addToCart } = useStore();
  return (p: Product) => addToCart(p, p.variants[0].id);
};

/** 2-column grid card: photo, kicker, name, "From $X", quick-add. */
export function ProductCard({ product, width }: { product: Product; width?: number }) {
  const router = useRouter();
  const add = useQuickAdd();
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
      <View style={s.add}><CircleButton icon="plus" label={`Add ${product.name} to bag`} onPress={() => add(product)} size={44} color={colors.btnText} bg={colors.brassFill} border={colors.brassFill} /></View>
    </View>
  );
}

/** Compact list row with quick-add (Essentials). */
export function ProductRow({ product }: { product: Product }) {
  const router = useRouter();
  const add = useQuickAdd();
  return (
    <View style={s.row}>
      <Pressable style={s.rowMain} accessibilityRole="button" accessibilityLabel={`${product.name}, from ${money(basePrice(product))}`} onPress={() => router.push(`/product/${product.id}`)}>
        <Photo uri={product.images[0]} tone={product.colorHex} seed={seedOf(product)} style={s.thumb} />
        <View style={{ flex: 1 }}>
          <Text style={s.rowName} numberOfLines={1}>{product.name}</Text>
          <Text style={[type.small, { color: colors.textSecondary }]} numberOfLines={1}>{product.variants[0].label} · {money(basePrice(product))}</Text>
        </View>
      </Pressable>
      <CircleButton icon="plus" label={`Add ${product.name} to bag`} onPress={() => add(product)} />
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
