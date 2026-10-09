import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Photo } from '@/components/Photo';
import { kickerFor, seedOf } from '@/components/ProductViews';
import { Screen } from '@/components/Screen';
import { EmptyView, ErrorView, LoadingView } from '@/components/States';
import { TRIBE_STRIP, TribePhoto } from '@/components/TribePhoto';
import { StoneSwatch } from '@/components/StoneSwatch';
import { Chip, CircleButton, Kicker } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { basePrice, isTribe, money, Shelf, SHELF_LABELS, SPRAY_CLAIM } from '@/domain/pricing';
import { useCatalog } from '@/state/catalog';
import { colors, fonts, radius, space, type } from '@/theme';

const CHIPS: Shelf[] = ['tribes', 'spray', 'incense', 'rock', 'oil'];

export default function ShopScreen() {
  const router = useRouter();
  const { status, products, reload } = useCatalog();
  const tribes = products.filter(isTribe).slice(0, 12);
  const toBurn = products.filter((p) => ['incense', 'rock', 'censer', 'oil'].includes(p.category));
  const openCat = (c: Shelf) => router.navigate({ pathname: '/browse', params: { cat: c } });

  return (
    <Screen>
      <View style={s.hero}>
        <Photo uri="https://cdn.twelvescents.example/hero.jpg" tone={colors.brassFill} seed={3} style={StyleSheet.absoluteFill} label="Brass censer with rising smoke" />
        <LinearGradient colors={[colors.bg, colors.bg, colors.creamFade]} locations={[0, 0.45, 1]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} pointerEvents="none" />
        <LinearGradient colors={[colors.creamFade, colors.bg]} locations={[0.6, 1]} style={StyleSheet.absoluteFill} pointerEvents="none" />
        <View style={s.heroText}>
          <Text style={[type.h1, { color: colors.ink }]} accessibilityRole="header">A sweet savor</Text>
          <Text style={[type.h1, { color: colors.brassText, fontFamily: fonts.displayItalic }]}>to your senses.</Text>
          <Text style={[type.body, { color: colors.ink, marginTop: 10, maxWidth: 270 }]}>Room sprays, hand-bundled incense, resins and brass censers for the home.</Text>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips} style={{ marginTop: -14 }}>
        {CHIPS.filter((c) => c === 'tribes' || status !== 'ready' || products.some((p) => p.category === c && !isTribe(p))).map((c) => <Chip key={c} label={SHELF_LABELS[c]} onPress={() => openCat(c)} />)}
      </ScrollView>

      {status === 'loading' && <LoadingView label="Loading the catalog" />}
      {status === 'error' && <ErrorView message="Check your connection and try again." onRetry={reload} />}
      {status === 'ready' && products.length === 0 && <EmptyView title="Nothing here yet" body="The catalog is empty. Please check back soon." />}
      {status === 'ready' && products.length > 0 && (<>
        <View style={[s.sectionHead, { marginTop: 20 }]}>
          <Pressable accessibilityRole="button" accessibilityLabel={`${SHELF_LABELS.tribes}, see all`} onPress={() => openCat('tribes')}><Kicker>Room sprays</Kicker><Text style={[type.section, { color: colors.ink }]} accessibilityRole="header">{SHELF_LABELS.tribes}</Text></Pressable>
          <Text style={[type.small, { color: colors.muted, paddingBottom: 4 }]}>{SPRAY_CLAIM}</Text>
        </View>
        <View style={s.stoneFrame}>
          {tribes.map((p, i) => { const photo = !!p.images[0]; return (
            <Pressable key={p.id} accessibilityRole="button" accessibilityLabel={p.stone ? `${p.name}, ${p.stone}` : p.name} onPress={() => router.push(`/product/${p.id}`)}
              style={s.stoneCell}>
              {photo && <TribePhoto uri={p.images[0]} />}
              {photo ? (
                // Small gem in the corner so the poster's subject shows; the spacer keeps the name level with the other cells.
                <>
                  <View style={s.cornerGem}><StoneSwatch hex={p.colorHex} band={p.colorHex2} size={30} /></View>
                  {/* Stone name runs up the left edge under the gem, clear of the poster's own name banner. */}
                  {p.stone ? <View style={s.sideLabel} pointerEvents="none"><Text style={s.sideLabelText} numberOfLines={1}>{p.stone}</Text></View> : null}
                  <View style={{ height: 52 }} />
                </>
              ) : <StoneSwatch hex={p.colorHex} band={p.colorHex2} />}
              {/* The poster shows the tribe name; ours stays invisible to hold the row height (and for cells without a photo). */}
              <Text style={[s.stoneName, photo && { color: 'transparent' }]}>{p.name}</Text>
              <Text style={[s.stoneSub, photo && { color: 'transparent' }]}>{p.stone ?? ' '}</Text>
            </Pressable>
          ); })}
        </View>

        <View style={[s.sectionHead, { marginTop: 36 }]}><View><Kicker>To burn</Kicker><Text style={[type.section, { color: colors.ink }]} accessibilityRole="header">Incense & censers</Text></View></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: space.gutter, gap: 12 }}>
          {toBurn.map((p) => (
            <Pressable key={p.id} accessibilityRole="button" accessibilityLabel={`${p.name}, from ${money(basePrice(p))}`} onPress={() => router.push(`/product/${p.id}`)}>
              <Photo uri={p.images[0]} tone={p.colorHex} seed={seedOf(p)} scrim="bottom" style={s.carousel}>
                <View style={s.carouselText}>
                  <Kicker color={colors.brassLight} style={{ fontSize: 10 }}>{kickerFor(p)}</Kicker>
                  <Text style={s.carouselName} numberOfLines={2}>{p.name}</Text>
                  <Text style={[type.small, { color: colors.onDark }]}>From {money(basePrice(p))}</Text>
                </View>
              </Photo>
            </Pressable>
          ))}
        </ScrollView>

        <Pressable style={s.finderCard} accessibilityRole="button" accessibilityLabel="Not sure where to start? Find your scent" onPress={() => router.navigate('/finder')}>
          <View style={{ flex: 1 }}>
            <Kicker>Scent finder</Kicker>
            <Text style={[type.section, { color: colors.ink, marginTop: 2 }]}>Not sure where to start?</Text>
            <Text style={[type.small, { color: colors.textSecondary, marginTop: 4 }]}>Three questions to find your tribe.</Text>
          </View>
          <View style={s.arrow}><Icon name="arrow" size={20} color={colors.ink} /></View>
        </Pressable>

      </>)}
    </Screen>
  );
}

const s = StyleSheet.create({
  hero: { height: 250, marginTop: 0, justifyContent: 'center' },
  heroText: { paddingHorizontal: space.gutter, paddingBottom: 8 },
  chips: { paddingHorizontal: space.gutter, gap: 10, paddingVertical: 4 },
  sectionHead: { paddingHorizontal: space.gutter, marginTop: 28, marginBottom: 14, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  // Separate cards with breathing room between them (three per row).
  stoneFrame: { marginHorizontal: space.gutter, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  stoneCell: { width: '31.5%', alignItems: 'center', paddingVertical: 16, gap: 6, overflow: 'hidden', borderRadius: radius.cardSm, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.hairline, backgroundColor: colors.surface },
  cornerGem: { position: 'absolute', top: 8, left: (TRIBE_STRIP - 30) / 2 },
  sideLabel: { position: 'absolute', left: (TRIBE_STRIP - 30) / 2, top: 44, bottom: 8, width: 30, alignItems: 'center', justifyContent: 'center' },
  sideLabelText: { width: 140, textAlign: 'center', transform: [{ rotate: '-90deg' }], fontFamily: fonts.medium, fontSize: 9, letterSpacing: 1.6, textTransform: 'uppercase', color: colors.brassText },
  stoneName: { fontFamily: fonts.display, fontSize: 17, color: colors.ink, marginTop: 4 },
  stoneSub: { fontFamily: fonts.medium, fontSize: 9, letterSpacing: 1.6, textTransform: 'uppercase', color: colors.muted },
  carousel: { width: 220, height: 280, borderRadius: radius.card, justifyContent: 'flex-end' },
  carouselText: { padding: 14, gap: 2 },
  carouselName: { fontFamily: fonts.display, fontSize: 24, lineHeight: 28, color: colors.onDark },
  finderCard: { margin: space.gutter, marginTop: 28, padding: 20, borderRadius: radius.card, backgroundColor: colors.tint, flexDirection: 'row', alignItems: 'center', gap: 12 },
  arrow: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: colors.hairline, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
});
void CircleButton;
