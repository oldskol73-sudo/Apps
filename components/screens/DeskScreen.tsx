import React, { useMemo } from "react";
import { View, ScrollView, Pressable, Image, StyleSheet, Linking } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "@/context/AppContext";
import { AppText } from "@/components/AppText";
import { getRandomVerse } from "@/constants/bible/verses";
import { displayRef } from "@/constants/bible/books";

const TSP_LOGO = require("@/assets/images/bible/tsp-logo-cover.jpg");
const FOUNDED_BANNER = require("@/assets/images/bible/founded-banner.jpg");
const UPGRADE_EMBLEM = require("@/assets/images/bible/upgrade-emblem.png");
const COMPASS_ART = require("@/assets/images/bible/Compass.png");

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}

function dateLabel() {
  return new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}

export function DeskScreen() {
  const { palette, location, enterContinueReading, skipToLibrary, goTo, bookmarks, notes, showToast } = useApp();
  const insets = useSafeAreaInsets();

  const votd = useMemo(() => getRandomVerse(), []);
  const votdBookmarked = bookmarks.isBookmarked(votd.ref);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]} edges={["bottom"]}>
      <ScrollView>
        <View style={styles.hero}>
          <LinearGradient colors={["#23160E", "#4B3626"]} style={StyleSheet.absoluteFill} />
          <View style={[styles.heroContent, { paddingTop: insets.top + 22 }]}>
            <View style={styles.greetingRow}>
              <View>
                <AppText variant="sansExtraBold" size={11.5} color="rgba(255,255,255,.7)" style={{ letterSpacing: 0.5 }}>
                  {dateLabel().toUpperCase()}
                </AppText>
                <AppText variant="serifBold" size={24} color="#fff" style={{ marginTop: 2 }}>
                  Good {greeting()}
                </AppText>
              </View>
              <View style={styles.logoBadge}>
                <Image source={TSP_LOGO} style={styles.logoBadgeImage} resizeMode="contain" />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <View style={[styles.continueCard, { backgroundColor: palette.card }]}>
            <View style={styles.continueCardTop}>
              <View style={[styles.bookCover, { backgroundColor: palette.accent }]}>
                <Ionicons name="book" size={22} color="#fff" />
              </View>
              <View>
                <AppText variant="sansExtraBold" size={9.5} color={palette.accent} style={{ letterSpacing: 1, textAlign: "center" }}>
                  CONTINUE READING
                </AppText>
                <AppText variant="serifBold" size={17} style={{ marginTop: 2, textAlign: "center" }}>
                  {displayRef(location.book, location.chapter)}
                </AppText>
                <View style={[styles.statsRow, { marginTop: 8 }]}>
                  <Stat value={bookmarks.bookmarks.length} label="Bookmarks" />
                  <Stat value={notes.notes.length} label="Notes" />
                </View>
              </View>
            </View>
            <Pressable onPress={enterContinueReading} style={[styles.ctaBtn, { backgroundColor: palette.accent }]}>
              <AppText variant="sansExtraBold" size={14} color="#fff">
                Continue Reading
              </AppText>
            </Pressable>
          </View>

          <View>
            <SectionLabel>Today's Scripture</SectionLabel>
            <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.divider }]}>
              <AppText variant="serif" size={19} style={{ lineHeight: 28, textAlign: "center" }}>
                "{votd.text}"
              </AppText>
              <AppText variant="sansBold" size={13} dim style={{ marginTop: 10, textAlign: "center" }}>
                {votd.ref} · KJV
              </AppText>
              <View style={styles.btnRow}>
                <Pressable
                  onPress={() => goTo(votd.book, votd.chapter)}
                  style={[styles.smallBtn, { backgroundColor: palette.accent }]}
                >
                  <AppText variant="sansBold" size={12.5} color="#fff">
                    Read Full Chapter
                  </AppText>
                </Pressable>
                <Pressable
                  onPress={() =>
                    bookmarks.toggleBookmark(votd.book, votd.chapter, votd.verse)
                  }
                  style={[
                    styles.smallBtn,
                    { backgroundColor: votdBookmarked ? palette.accent : palette.cardAlt },
                  ]}
                >
                  <AppText variant="sansBold" size={12.5} color={votdBookmarked ? "#fff" : palette.text}>
                    Bookmark
                  </AppText>
                </Pressable>
                <Pressable onPress={() => showToast("Coming soon")} style={[styles.smallBtn, { backgroundColor: palette.cardAlt }]}>
                  <AppText variant="sansBold" size={12.5}>
                    Share
                  </AppText>
                </Pressable>
              </View>
            </View>
          </View>

          <View>
            <SectionLabel>Featured Collection</SectionLabel>
            <View style={[styles.card, { backgroundColor: palette.card, padding: 0, overflow: "hidden" }]}>
              <Image source={FOUNDED_BANNER} style={styles.collectionArt} resizeMode="cover" />
              <View style={{ padding: 18 }}>
                <AppText variant="serifBold" size={18}>
                  Mighty Men of Valor
                </AppText>
                <AppText size={12.5} dim style={{ marginTop: 6, lineHeight: 18 }}>
                  Twelve portraits of courage and faith, from Gideon's three hundred to David's mighty men.
                </AppText>
                <AppText variant="sansBold" size={11.5} color={palette.accent} style={{ marginTop: 10 }}>
                  6 Books Available
                </AppText>
                <Pressable
                  onPress={() => showToast("Coming soon")}
                  style={[styles.smallBtn, { backgroundColor: palette.accent, marginTop: 14, alignSelf: "flex-start" }]}
                >
                  <AppText variant="sansBold" size={13} color="#fff">
                    Open Collection
                  </AppText>
                </Pressable>
              </View>
            </View>
          </View>

          <View>
            <SectionLabel>Discover Something New</SectionLabel>
            <Pressable onPress={() => showToast("Coming soon")} style={[styles.discoverRow, { backgroundColor: palette.cardAlt }]}>
              <Image source={UPGRADE_EMBLEM} style={styles.discoverArt} resizeMode="cover" />

              <View style={{ flex: 1, minWidth: 0 }}>
                <AppText variant="sansExtraBold" size={14}>
                  Psalms &amp; Proverbs Study Guide
                </AppText>
                <AppText size={12} dim style={{ marginTop: 3, lineHeight: 17 }}>
                  A companion volume for daily reflection, newly added to the catalog.
                </AppText>
                <AppText variant="sansExtraBold" size={12} color={palette.accent} style={{ marginTop: 6 }}>
                  Learn More ›
                </AppText>
              </View>
            </Pressable>
          </View>

          <Pressable
            onPress={() => Linking.openURL("https://apps.apple.com/app/face-jerusalem")}
            style={[styles.adBanner, { backgroundColor: palette.cardAlt }]}
          >
            <Image source={COMPASS_ART} style={styles.adIcon} resizeMode="cover" />
            <View style={{ flex: 1, minWidth: 0 }}>
              <AppText variant="sansExtraBold" size={9.5} dim style={{ letterSpacing: 0.5 }}>
                ADVERTISEMENT
              </AppText>
              <AppText variant="sansExtraBold" size={12.5} style={{ marginTop: 2 }}>
                Face Jerusalem — find true north to the Holy City
              </AppText>
            </View>
            <AppText variant="sansExtraBold" size={12} color={palette.accent}>
              Get App ›
            </AppText>
          </Pressable>

          <Pressable
            onPress={skipToLibrary}
            style={[styles.enterLibrary, { backgroundColor: palette.cardAlt, borderColor: palette.divider }]}
          >
            <Ionicons name="library" size={18} color={palette.accent} />
            <AppText variant="sansExtraBold" size={15}>
              Enter Library
            </AppText>
            <Ionicons name="arrow-forward" size={16} color={palette.accent} />
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  const { palette } = useApp();
  return (
    <View style={{ alignItems: "center" }}>
      <AppText variant="sansExtraBold" size={15}>
        {value}
      </AppText>
      <AppText size={9} dim style={{ textTransform: "uppercase", letterSpacing: 0.4, marginTop: 1 }}>
        {label}
      </AppText>
    </View>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <AppText variant="sansExtraBold" size={11} dim style={{ letterSpacing: 1, marginBottom: 10 }}>
      {String(children).toUpperCase()}
    </AppText>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: {
    position: "relative",
    overflow: "hidden",
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroContent: { paddingHorizontal: 20, paddingBottom: 22, gap: 18 },
  greetingRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#000",
  },
  logoBadgeImage: { width: "100%", height: "100%" },
  continueCard: { borderRadius: 20, padding: 18 },
  continueCardTop: { flexDirection: "row", gap: 14, alignItems: "center", justifyContent: "center" },
  ctaBtn: { marginTop: 16, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  body: { padding: 20, paddingTop: 20, gap: 20 },
  bookCover: { width: 56, height: 76, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  statsRow: { flexDirection: "row", gap: 16, marginTop: 10, justifyContent: "center" },
  card: { borderRadius: 20, padding: 20, borderWidth: 1 },
  btnRow: { flexDirection: "row", gap: 10, marginTop: 16, flexWrap: "wrap" },
  smallBtn: { borderRadius: 10, paddingVertical: 9, paddingHorizontal: 14 },
  collectionArt: { width: "100%", height: 140 },
  discoverRow: { flexDirection: "row", gap: 14, alignItems: "center", borderRadius: 20, padding: 16 },
  discoverArt: { width: 44, height: 44, borderRadius: 10, overflow: "hidden" },
  adBanner: { flexDirection: "row", gap: 12, alignItems: "center", borderRadius: 16, padding: 12 },
  adIcon: { width: 44, height: 44, borderRadius: 10, overflow: "hidden" },
  enterLibrary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 16,
    marginTop: 2,
  },
});
