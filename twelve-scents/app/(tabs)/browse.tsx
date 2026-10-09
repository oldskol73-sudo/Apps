import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Icon } from '@/components/Icon';
import { Photo } from '@/components/Photo';
import { ProductCard } from '@/components/ProductViews';
import { Screen } from '@/components/Screen';
import { EmptyView, ErrorView, LoadingView } from '@/components/States';
import { Chip } from '@/components/ui';
import { filterProducts, isShelf, Shelf, SHELF_LABELS, shelfOf, SHELVES, SortKey, SPRAY_CLAIM } from '@/domain/pricing';
import { useCatalog } from '@/state/catalog';
import { colors, fonts, radius, space, type } from '@/theme';

const CARD_SHELVES: Shelf[] = ['tribes', 'spray', 'incense', 'rock', 'oil', 'censer'];
const isSprayShelf = (c: Shelf) => c === 'tribes' || c === 'spray';
const SORTS: { key: SortKey; label: string }[] = [{ key: 'featured', label: 'Featured' }, { key: 'price', label: 'Price' }, { key: 'az', label: 'A–Z' }];

export default function BrowseScreen() {
  const params = useLocalSearchParams<{ cat?: string; search?: string }>();
  const { status, products, reload } = useCatalog();
  const [cat, setCat] = useState<Shelf | 'all'>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('featured');
  const [searchOpen, setSearchOpen] = useState(false);
  const input = useRef<TextInput>(null);

  useEffect(() => { if (params.cat && isShelf(params.cat)) setCat(params.cat); }, [params.cat]);
  useEffect(() => { if (params.search) { setSearchOpen(true); setTimeout(() => input.current?.focus(), 150); } }, [params.search]);

  const results = useMemo(() => filterProducts(products, cat, query, sort), [products, cat, query, sort]);
  const showCategoryCards = cat === 'all' && !query.trim();
  // Hide shelves the catalog has nothing for (e.g. no non-tribe sprays), but keep the selected one.
  const shelves = useMemo(() => SHELVES.filter((c) => c === cat || !products.length || products.some((p) => shelfOf(p) === c)), [products, cat]);

  return (
    <Screen>
      <Text style={[type.h1, s.title]} accessibilityRole="header">Browse</Text>
      {(searchOpen || query) && (
        <View style={s.search}>
          <Icon name="search" size={20} color={colors.muted} />
          <TextInput ref={input} value={query} onChangeText={setQuery} placeholder="Search name, stone, scent or notes" placeholderTextColor={colors.muted}
            accessibilityLabel="Search products" returnKeyType="search" style={s.input} autoCorrect={false} />
          {query ? <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setQuery('')} style={s.clear}><Icon name="close" size={18} color={colors.ink} /></Pressable> : null}
        </View>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
        <Chip label="All" active={cat === 'all'} onPress={() => setCat('all')} />
        {shelves.map((c) => <Chip key={c} label={SHELF_LABELS[c]} active={cat === c} onPress={() => setCat(c)} />)}
      </ScrollView>

      {status === 'loading' && <LoadingView label="Loading products" />}
      {status === 'error' && <ErrorView message="We couldn’t reach the catalog." onRetry={reload} />}
      {status === 'ready' && showCategoryCards && (
        <View style={{ paddingHorizontal: space.gutter, gap: 12, marginTop: 8 }}>
          {CARD_SHELVES.map((c) => {
            const list = products.filter((p) => shelfOf(p) === c);
            if (!list.length) return null;
            const sub = isSprayShelf(c) ? SPRAY_CLAIM : `${list.length} ${list.length === 1 ? 'product' : 'products'}`;
            return (
              <Pressable key={c} accessibilityRole="button" accessibilityLabel={`${SHELF_LABELS[c]}, ${sub}`} onPress={() => setCat(c)}>
                <Photo uri={list[0].images[0]} tone={list[0].colorHex} seed={SHELVES.indexOf(c) + 1} scrim="left" style={s.catCard}>
                  <View style={s.catText}>
                    <Text style={s.catTitle}>{SHELF_LABELS[c]}</Text>
                    {isSprayShelf(c) ? <Text style={[type.small, { color: colors.onDark }]}>{sub}</Text> : null}
                  </View>
                  <View style={s.catArrow}><Icon name="arrow" size={18} color={colors.onDark} /></View>
                </Photo>
              </Pressable>
            );
          })}
        </View>
      )}
      {status === 'ready' && !showCategoryCards && (
        <>
          <View style={s.sortRow} accessibilityRole="radiogroup">
            <Text style={[type.small, { color: colors.muted }]}>{results.length} {results.length === 1 ? 'item' : 'items'} · Sort</Text>
            {SORTS.map((o) => (
              <Pressable key={o.key} accessibilityRole="radio" accessibilityState={{ selected: sort === o.key }} onPress={() => setSort(o.key)} style={s.sortBtn}>
                <Text style={[s.sortText, sort === o.key && { color: colors.brassText, textDecorationLine: 'underline' }]}>{o.label}</Text>
              </Pressable>
            ))}
          </View>
          {results.length === 0 ? (
            <EmptyView title="No matches" body={query ? `Nothing found for “${query}”. Try a stone, scent or note.` : 'Nothing in this category yet.'} action="Clear filters" onAction={() => { setQuery(''); setCat('all'); }} />
          ) : (
            <View style={s.grid}>
              {pair(results).map((row, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 12 }}>
                  <ProductCard product={row[0]} />
                  {row[1] ? <ProductCard product={row[1]} /> : <View style={{ flex: 1 }} />}
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </Screen>
  );
}
function pair<T>(a: T[]): T[][] { const o: T[][] = []; for (let i = 0; i < a.length; i += 2) o.push(a.slice(i, i + 2)); return o; }

const s = StyleSheet.create({
  title: { color: colors.ink, paddingHorizontal: space.gutter, marginTop: 4, marginBottom: 12 },
  search: { marginHorizontal: space.gutter, marginBottom: 12, minHeight: 48, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.hairline, backgroundColor: colors.surface, flexDirection: 'row', alignItems: 'center', paddingLeft: 16, gap: 10 },
  input: { flex: 1, fontFamily: fonts.body, fontSize: 16, color: colors.ink, minHeight: 44 },
  clear: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  chips: { paddingHorizontal: space.gutter, gap: 10, paddingBottom: 12 },
  catCard: { height: 116, borderRadius: radius.card, justifyContent: 'center' },
  catText: { paddingLeft: 20, gap: 2, maxWidth: '70%' },
  catTitle: { fontFamily: fonts.display, fontSize: 26, color: colors.onDark },
  catArrow: { position: 'absolute', right: 14, bottom: 14, width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.hairlineDark, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(20,14,10,0.35)' },
  sortRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.gutter, gap: 4, marginBottom: 8 },
  sortBtn: { minHeight: 44, paddingHorizontal: 8, justifyContent: 'center' },
  sortText: { fontFamily: fonts.medium, fontSize: 13, color: colors.textSecondary },
  grid: { paddingHorizontal: space.gutter, gap: 12 },
});
