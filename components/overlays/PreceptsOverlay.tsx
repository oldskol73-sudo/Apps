import React, { useMemo, useState } from "react";
import { View, Modal, Pressable, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "@/context/AppContext";
import { AppText } from "@/components/AppText";
import { PRECEPT_TOPICS } from "@/constants/bible/precepts";
import { resolveBookName } from "@/constants/bible/books";

const FEATURED_COUNT = 18;

function parseRef(ref: string): { book: string; chapter: number; verse: number } | null {
  const match = ref.match(/^(.*)\s(\d+):(\d+)/);
  if (!match) return null;
  return { book: resolveBookName(match[1].trim()), chapter: Number(match[2]), verse: Number(match[3]) };
}

export function PreceptsOverlay() {
  const { palette, showPrecepts, setShowPrecepts, goTo, selectVerse } = useApp();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [expandedLetter, setExpandedLetter] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  const featured = useMemo(() => PRECEPT_TOPICS.slice(0, FEATURED_COUNT), []);
  const alphaGroups = useMemo(() => {
    const groups: { letter: string; topics: typeof PRECEPT_TOPICS }[] = [];
    for (const t of PRECEPT_TOPICS.slice(FEATURED_COUNT)) {
      const letter = t.title.charAt(0).toUpperCase();
      let group = groups.find((g) => g.letter === letter);
      if (!group) {
        group = { letter, topics: [] };
        groups.push(group);
      }
      group.topics.push(t);
    }
    return groups;
  }, []);

  function onViewInReader(anchor: { book: string; chapter: number }) {
    goTo(resolveBookName(anchor.book), anchor.chapter);
    setShowPrecepts(false);
  }

  function onViewRef(ref: string) {
    const parsed = parseRef(ref);
    if (!parsed) return;
    goTo(parsed.book, parsed.chapter);
    selectVerse(parsed.verse);
    setShowPrecepts(false);
  }

  return (
    <Modal visible={showPrecepts} animationType="fade" onRequestClose={() => setShowPrecepts(false)}>
      <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]} edges={["bottom"]}>
        <View style={[styles.headerRow, { paddingTop: insets.top + 16 }]}>
          <Pressable onPress={() => setShowPrecepts(false)} hitSlop={12}>
            <AppText size={20} dim>
              ←
            </AppText>
          </Pressable>
          <AppText variant="sansExtraBold" size={20}>
            Precepts
          </AppText>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <AppText dim size={14} style={{ lineHeight: 20, marginBottom: 14 }}>
            Topical scripture chains. Each topic's key verse is highlighted in the Read tab with a ¹
            footnote linking the rest of the chain.
          </AppText>

          <View style={{ gap: 8 }}>
            {featured.map((t) => {
              const isExpanded = expanded === t.key;
              return (
                <View key={t.key} style={[styles.card, { backgroundColor: palette.card }]}>
                  <Pressable onPress={() => setExpanded(isExpanded ? null : t.key)} style={styles.rowBetween}>
                    <AppText variant="sansBold" size={15}>
                      {t.title}
                    </AppText>
                    <AppText dim size={13}>
                      {isExpanded ? "⌃" : "⌄"}
                    </AppText>
                  </Pressable>
                  {isExpanded ? (
                    <View style={{ gap: 8, paddingTop: 4 }}>
                      {t.refs.map((r) => (
                        <Pressable
                          key={r.ref}
                          onPress={() => onViewRef(r.ref)}
                          style={[styles.refCard, { backgroundColor: palette.cardAlt }]}
                        >
                          <AppText variant="sansExtraBold" size={12} color={palette.accent} style={{ marginBottom: 3 }}>
                            {r.ref}
                          </AppText>
                          <AppText size={13} style={{ lineHeight: 19 }}>
                            {r.note}
                          </AppText>
                        </Pressable>
                      ))}
                      <Pressable
                        onPress={() => onViewInReader(t.anchor)}
                        style={[styles.viewBtn, { backgroundColor: palette.accent }]}
                      >
                        <AppText variant="sansBold" size={12} color="#fff">
                          View in Reader
                        </AppText>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>

          <View style={styles.comingSoonDivider}>
            <View style={[styles.dividerLine, { backgroundColor: palette.divider }]} />
            <AppText variant="sansExtraBold" size={11} dim style={{ letterSpacing: 1 }}>
              A–Z TOPICS · COMING SOON
            </AppText>
            <View style={[styles.dividerLine, { backgroundColor: palette.divider }]} />
          </View>

          <View style={{ gap: 8 }}>
            {alphaGroups.map((g) => {
              const isLetterExpanded = expandedLetter === g.letter;
              return (
                <View key={g.letter} style={[styles.card, styles.cardDisabled, { backgroundColor: palette.card }]}>
                  <Pressable
                    onPress={() => setExpandedLetter(isLetterExpanded ? null : g.letter)}
                    style={styles.rowBetween}
                  >
                    <AppText variant="sansExtraBold" size={15}>
                      {g.letter}
                    </AppText>
                    <AppText dim size={13}>
                      {isLetterExpanded ? "⌃" : "⌄"}
                    </AppText>
                  </Pressable>
                  {isLetterExpanded ? (
                    <View style={{ gap: 6, paddingTop: 2 }}>
                      {g.topics.map((t) => (
                        <View key={t.key} style={[styles.lockedTopicRow, { backgroundColor: palette.cardAlt }]}>
                          <AppText size={13} dim>
                            {t.title}
                          </AppText>
                          <Ionicons name="lock-closed-outline" size={13} color={palette.textDim} />
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 30 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  card: { borderRadius: 14, padding: 16, gap: 12 },
  cardDisabled: { opacity: 0.75 },
  comingSoonDivider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 20,
    marginBottom: 12,
  },
  dividerLine: { flex: 1, height: 1 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  refCard: { borderRadius: 12, padding: 11 },
  viewBtn: { alignSelf: "flex-start", borderRadius: 10, paddingVertical: 9, paddingHorizontal: 16, marginTop: 2 },
  lockedTopicRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
  },
});
