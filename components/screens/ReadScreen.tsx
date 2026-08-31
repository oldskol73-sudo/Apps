import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import Animated, { useAnimatedScrollHandler } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "@/context/AppContext";
import { AppText } from "@/components/AppText";
import { versesFor } from "@/constants/bible/verses";
import { displayRef, isChapterLoaded, adjacentChapter } from "@/constants/bible/books";
import { PRECEPT_ANCHOR_INDEX } from "@/constants/bible/precepts";
import { HIGHLIGHT_COLORS } from "@/constants/theme";
import { READER_HEADER_EXPANDED_HEIGHT } from "@/components/Header";

export function ReadScreen() {
  const {
    palette,
    location,
    selectVerse,
    readerFontSize,
    highlights,
    refKey,
    openFootnote,
    toggleFootnote,
    goTo,
    readerScrollY,
  } = useApp();
  const insets = useSafeAreaInsets();

  const verses = versesFor(location.book, location.chapter);
  const loaded = isChapterLoaded(location.book, location.chapter);
  const prev = adjacentChapter(location.book, location.chapter, -1);
  const next = adjacentChapter(location.book, location.chapter, 1);

  const onScroll = useAnimatedScrollHandler((event) => {
    readerScrollY.value = event.contentOffset.y;
  });

  const headerSpace = insets.top + READER_HEADER_EXPANDED_HEIGHT;

  if (!loaded || verses.length === 0) {
    return (
      <View style={[styles.emptyWrap, { paddingTop: headerSpace }]}>
        <AppText dim style={{ textAlign: "center" }}>
          The full text of {displayRef(location.book, location.chapter)} isn't loaded in this build yet.{"\n"}
          Try Genesis 1–2, Psalm 23, or John 3.
        </AppText>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Animated.ScrollView
        contentContainerStyle={[styles.content, { paddingTop: headerSpace }]}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        {verses.map((v) => {
          const ref = refKey(location.book, location.chapter, v.n);
          const displayVerseRef = `${displayRef(location.book, location.chapter)}:${v.n}`;
          const highlight = highlights.highlightFor(ref);
          const topic = PRECEPT_ANCHOR_INDEX[displayVerseRef];
          const footnoteOpen = openFootnote === v.n;

          return (
            <View key={v.n} style={{ position: "relative" }}>
              <Pressable
                onPress={() => selectVerse(v.n)}
                style={[
                  styles.verseRow,
                  { backgroundColor: highlight ? HIGHLIGHT_COLORS[highlight.color as keyof typeof HIGHLIGHT_COLORS] + "33" : "transparent" },
                ]}
              >
                <AppText variant="sansExtraBold" size={11} color={palette.accent} style={styles.verseNum}>
                  {v.n}
                </AppText>
                <AppText variant="serif" size={readerFontSize} style={{ flex: 1, lineHeight: readerFontSize * 1.7 }}>
                  {v.text}
                  {topic ? (
                    <AppText
                      variant="sansExtraBold"
                      size={readerFontSize * 0.6}
                      color={palette.accent}
                      onPress={() => toggleFootnote(v.n)}
                    >
                      {" "}
                      ¹
                    </AppText>
                  ) : null}
                </AppText>
              </Pressable>

              {footnoteOpen && topic ? (
                <View style={[styles.footnote, { backgroundColor: palette.card }]}>
                  <AppText variant="sansExtraBold" size={11} color={palette.accent} style={{ letterSpacing: 0.5, marginBottom: 8 }}>
                    {topic.title.toUpperCase()}
                  </AppText>
                  {topic.refs.map((r) => (
                    <View key={r.ref} style={{ marginBottom: 6, flexDirection: "row", flexWrap: "wrap" }}>
                      <AppText variant="sansExtraBold" size={12}>
                        {r.ref}
                      </AppText>
                      <AppText size={12} dim>
                        {" "}
                        — {r.note}
                      </AppText>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
          );
        })}
      </Animated.ScrollView>

      {prev ? (
        <Pressable
          onPress={() => goTo(prev.book, prev.chapter)}
          style={[styles.sideArrow, styles.sideArrowLeft, { backgroundColor: palette.cardAlt }]}
        >
          <Ionicons name="chevron-back" size={16} color={palette.accent} />
        </Pressable>
      ) : null}
      {next ? (
        <Pressable
          onPress={() => goTo(next.book, next.chapter)}
          style={[styles.sideArrow, styles.sideArrowRight, { backgroundColor: palette.cardAlt }]}
        >
          <Ionicons name="chevron-forward" size={16} color={palette.accent} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 140 },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  verseRow: {
    flexDirection: "row",
    gap: 10,
    padding: 10,
    borderRadius: 12,
    marginBottom: 2,
  },
  verseNum: { minWidth: 18, paddingTop: 5 },
  footnote: {
    position: "absolute",
    left: 12,
    right: 12,
    top: "100%",
    marginTop: -4,
    zIndex: 10,
    borderRadius: 12,
    padding: 14,
  },
  sideArrow: {
    position: "absolute",
    top: "50%",
    marginTop: -17,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  sideArrowLeft: { left: 8 },
  sideArrowRight: { right: 8 },
});
