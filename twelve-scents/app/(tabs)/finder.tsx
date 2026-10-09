import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Icon } from '@/components/Icon';
import { Photo } from '@/components/Photo';
import { kickerFor, ProductRow, QuickAdd, seedOf } from '@/components/ProductViews';
import { Screen } from '@/components/Screen';
import { EmptyView, ErrorView, LoadingView } from '@/components/States';
import { CircleButton, Kicker, OutlineButton, PrimaryButton } from '@/components/ui';
import { basePrice, CATEGORY_LABELS, money, rankForFinder, SHELF_LABELS } from '@/domain/pricing';
import { Category, Mood } from '@/domain/types';
import { track } from '@/services/analytics';
import { useCatalog } from '@/state/catalog';
import { colors, fonts, radius, space, type } from '@/theme';

const TYPES: Category[] = ['spray', 'incense', 'rock', 'oil'];
const MOODS: { mood: Mood; hint: string }[] = [
  { mood: 'Clean', hint: 'Bright, airy, like fresh linen' },
  { mood: 'Earthy', hint: 'Grounding woods and soil' },
  { mood: 'Warm', hint: 'Spiced, amber and comforting' },
  { mood: 'Fresh', hint: 'Green, crisp and awake' },
  { mood: 'Rich', hint: 'Deep, resinous and layered' },
];
const STEPS = [
  { n: 1, title: 'Choose a type', sub: 'Room Sprays, Incense, Rock Incense, or Burning Oils.', cat: 'spray' as Category },
  { n: 2, title: 'Select a mood', sub: 'Clean, earthy, warm, fresh, or rich.', cat: 'rock' as Category },
  { n: 3, title: 'Discover your scent', sub: 'Personalized recommendations from the Twelve.', cat: 'incense' as Category },
];

export default function FinderScreen() {
  const router = useRouter();
  const { status, products, reload } = useCatalog();
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [type_, setType] = useState<Category | null>(null);
  const [mood, setMood] = useState<Mood | null>(null);

  const results = useMemo(() => (type_ && mood ? rankForFinder(products, type_, mood) : []), [products, type_, mood]);
  const reset = () => { setStep(0); setType(null); setMood(null); };
  const pickMood = (m: Mood) => { setMood(m); setStep(3); if (type_) track('finder_complete', { type: type_, mood: m }); };

  return (
    <Screen>
      {step === 0 && (<>
        <View style={s.pad}>
          <Text style={[type.h1, { color: colors.ink }]} accessibilityRole="header">Find your scent</Text>
          <View style={s.intro}>
            <View style={{ flex: 1 }}>
              <Text style={s.q}>Not sure where to start?</Text>
              <Text style={[type.small, { color: colors.textSecondary, marginTop: 4 }]}>Three questions to find your tribe</Text>
            </View>
            <CircleButton icon="arrow" label="Start the scent finder" size={48} onPress={() => setStep(1)} />
          </View>
        </View>
        <View style={[s.pad, { gap: 12, marginTop: 20 }]}>
          {STEPS.map((st) => (
            <Pressable key={st.n} accessibilityRole="button" accessibilityLabel={`Step ${st.n}: ${st.title}. ${st.sub}`} onPress={() => setStep(1)}>
              <Photo uri={`https://cdn.twelvescents.example/finder-${st.n}.jpg`} tone={st.n === 3 ? colors.brassFill : '#6B4A2B'} seed={st.n * 5} scrim="left" style={s.stepCard}>
                <View style={s.num}><Text style={s.numText}>{st.n}</Text></View>
                <View style={{ paddingLeft: 20, paddingBottom: 18, maxWidth: '75%' }}>
                  <Text style={s.stepTitle}>{st.title}</Text>
                  <Text style={[type.small, { color: colors.onDark }]}>{st.sub}</Text>
                </View>
              </Photo>
            </Pressable>
          ))}
        </View>
      </>)}

      {step > 0 && (
        <View style={s.pad}>
          <View style={s.stepHead}>
            <CircleButton icon="back" label="Back" border="transparent" onPress={() => (step === 1 ? reset() : setStep((step - 1) as 1 | 2))} />
            <Kicker>{step < 3 ? `Step ${step} of 2` : 'Your scents'}</Kicker>
            <View style={{ width: 44 }} />
          </View>

          {step === 1 && (<>
            <Text style={[type.h1, s.stepH]} accessibilityRole="header">Choose a type</Text>
            {TYPES.map((c) => (
              <Pressable key={c} onPress={() => { setType(c); setStep(2); }} accessibilityRole="button" style={[s.option, type_ === c && s.optionOn]}>
                <Text style={s.optionTitle}>{CATEGORY_LABELS[c]}</Text><Icon name="arrow" size={20} color={colors.ink} />
              </Pressable>
            ))}
          </>)}

          {step === 2 && (<>
            <Text style={[type.h1, s.stepH]} accessibilityRole="header">Select a mood</Text>
            {MOODS.map(({ mood: m, hint }) => (
              <Pressable key={m} onPress={() => pickMood(m)} accessibilityRole="button" accessibilityLabel={`${m}. ${hint}`} style={[s.option, mood === m && s.optionOn]}>
                <View style={{ flex: 1 }}><Text style={s.optionTitle}>{m}</Text><Text style={[type.small, { color: colors.textSecondary }]}>{hint}</Text></View>
                <Icon name="arrow" size={20} color={colors.ink} />
              </Pressable>
            ))}
          </>)}

          {step === 3 && (<>
            <Text style={[type.h1, s.stepH]} accessibilityRole="header">Your {mood?.toLowerCase()} {type_ ? CATEGORY_LABELS[type_].toLowerCase() : ''}</Text>
            {status === 'loading' && <LoadingView />}
            {status === 'error' && <ErrorView onRetry={reload} />}
            {status === 'ready' && results.length === 0 && <EmptyView title="No matches yet" body="We’re still blending this one. Try a different type." action="Start over" onAction={reset} />}
            {status === 'ready' && results[0] && (<>
              <Pressable onPress={() => router.push(`/product/${results[0].id}`)} accessibilityRole="button" accessibilityLabel={`Top pick: ${results[0].name}, from ${money(basePrice(results[0]))}`}>
                <Photo uri={results[0].images[0]} tone={results[0].colorHex} seed={seedOf(results[0])} scrim="bottom" style={s.heroRec}>
                  <View style={{ padding: 18, gap: 3 }}>
                    <Kicker color={colors.brassLight}>Top pick · {kickerFor(results[0])}</Kicker>
                    <Text style={s.recName}>{results[0].name}</Text>
                    <Text style={[s.recTag]}>{results[0].tagline}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                      <Text style={[type.body, { color: colors.onDark }]}>From {money(basePrice(results[0]))}</Text>
                      <QuickAdd product={results[0]} />
                    </View>
                  </View>
                </Photo>
              </Pressable>
              {results.slice(1, 3).length > 0 && <Kicker style={{ marginTop: 24 }}>More for you</Kicker>}
              {results.slice(1, 3).map((p) => <ProductRow key={p.id} product={p} />)}
              <View style={{ marginTop: 24, gap: 10 }}>
                <PrimaryButton label={type_ === 'spray' ? `See the ${SHELF_LABELS.tribes}` : `See all ${type_ ? CATEGORY_LABELS[type_] : ''}`} onPress={() => router.navigate({ pathname: '/browse', params: { cat: type_ === 'spray' || !type_ ? 'tribes' : type_ } })} />
                <OutlineButton label="Start over" onPress={reset} />
              </View>
            </>)}
          </>)}
        </View>
      )}
    </Screen>
  );
}
const s = StyleSheet.create({
  pad: { paddingHorizontal: space.gutter },
  intro: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 12 },
  q: { fontFamily: fonts.display, fontSize: 22, color: colors.textSecondary },
  stepCard: { height: 150, borderRadius: radius.card, justifyContent: 'flex-end' },
  num: { position: 'absolute', top: 14, left: 16, width: 34, height: 34, borderRadius: 17, backgroundColor: colors.brassFill, alignItems: 'center', justifyContent: 'center' },
  numText: { fontFamily: fonts.display, fontSize: 18, color: colors.btnText },
  stepTitle: { fontFamily: fonts.display, fontSize: 26, color: colors.onDark },
  stepHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  stepH: { color: colors.ink, marginBottom: 16 },
  option: { minHeight: 68, borderRadius: radius.card, borderWidth: 1, borderColor: colors.hairline, backgroundColor: colors.surface, paddingHorizontal: 20, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  optionOn: { borderColor: colors.brassFill, backgroundColor: colors.tint },
  optionTitle: { flex: 1, fontFamily: fonts.display, fontSize: 24, color: colors.ink },
  heroRec: { height: 330, borderRadius: radius.card, justifyContent: 'flex-end' },
  recName: { fontFamily: fonts.display, fontSize: 34, lineHeight: 38, color: colors.onDark },
  recTag: { fontFamily: fonts.displayItalic, fontSize: 17, color: colors.onDark },
});
