import React from "react";
import { View, Pressable, StyleSheet, Image } from "react-native";
import Animated, { useAnimatedStyle, interpolate, Extrapolation } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "@/context/AppContext";
import { AppText } from "@/components/AppText";
import { displayRef } from "@/constants/bible/books";
import { READER_FONT_SIZES, Palette } from "@/constants/theme";

const LOGO_HERO = require("@/assets/images/bible/logo-hero.jpg");

const TITLES: Record<string, string> = {
  today: "Today",
  read: "",
  search: "Search",
  plans: "Reading Plans",
  library: "Library",
};

const IMAGE_HEIGHT = 168;
const FOOTER_HEIGHT = 110;
export const READER_HEADER_EXPANDED_HEIGHT = IMAGE_HEIGHT + FOOTER_HEIGHT;
export const READER_HEADER_COLLAPSED_HEIGHT = 60;
const EXPANDED_HEIGHT = READER_HEADER_EXPANDED_HEIGHT;
const COLLAPSED_HEIGHT = READER_HEADER_COLLAPSED_HEIGHT;

// Scroll distance (px) over which the hero continuously collapses into the glass bar.
const COLLAPSE_RANGE = 90;

export function Header() {
  const {
    palette,
    tab,
    location,
    setShowBookPicker,
    readerFontSize,
    setReaderFontSize,
    cycleAtmosphere,
    playChapter,
    audio,
    setTab,
    readerScrollY,
  } = useApp();
  const insets = useSafeAreaInsets();

  const bandStyle = useAnimatedStyle(() => ({
    height: interpolate(
      readerScrollY.value,
      [0, COLLAPSE_RANGE],
      [insets.top + EXPANDED_HEIGHT, insets.top + COLLAPSED_HEIGHT],
      Extrapolation.CLAMP
    ),
  }));

  const expandedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(readerScrollY.value, [0, COLLAPSE_RANGE * 0.6], [1, 0], Extrapolation.CLAMP),
  }));

  const collapsedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(readerScrollY.value, [COLLAPSE_RANGE * 0.4, COLLAPSE_RANGE], [0, 1], Extrapolation.CLAMP),
  }));

  if (tab === "read") {
    const isCurrentTrack = audio.track?.book === location.book && audio.track?.chapter === location.chapter;

    return (
      <Animated.View style={[styles.heroBand, styles.floating, bandStyle]}>
        <Animated.View style={[styles.layerFill, expandedStyle]} pointerEvents="box-none">
          <View style={[styles.heroImageWrap, { height: insets.top + IMAGE_HEIGHT }]}>
            <LinearGradient colors={ATMOSPHERE_GRAD} style={StyleSheet.absoluteFill} />
            <Image source={LOGO_HERO} style={styles.heroImage} resizeMode="cover" />
            <LinearGradient colors={["rgba(0,0,0,.35)", "rgba(0,0,0,0)"]} style={styles.heroTopScrim} />
            <LinearGradient colors={["rgba(0,0,0,0)", palette.bg]} style={styles.heroBottomBlend} />
          </View>

          <View style={[styles.heroFooter, { height: FOOTER_HEIGHT, paddingTop: 10 }]}>
            <View style={[styles.pillRow, { justifyContent: "center" }]}>
              <Pressable
                onPress={() => setShowBookPicker(true)}
                style={[styles.chapterBtn, { backgroundColor: palette.card, borderColor: palette.accent }]}
              >
                <AppText variant="serifBold" size={15} color={palette.text}>
                  {displayRef(location.book, location.chapter)}
                </AppText>
                <Ionicons name="chevron-down" size={11} color={palette.accent} />
              </Pressable>
            </View>

            <View style={[styles.expandedIconRow, { marginTop: 10 }]}>
              <IconBtn solid palette={palette} onPress={() => setReaderFontSize(nextFontSize(readerFontSize))} label="Aa" />
              <IconBtn solid palette={palette} onPress={cycleAtmosphere} icon="contrast-outline" />
              <IconBtn
                solid
                palette={palette}
                onPress={() => (isCurrentTrack ? audio.togglePlay() : playChapter(location.book, location.chapter))}
                icon={isCurrentTrack && audio.playing ? "pause" : "headset"}
              />
              <IconBtn solid palette={palette} onPress={() => setTab("search")} icon="search" />
            </View>
          </View>
        </Animated.View>

        <Animated.View style={[styles.layerFill, styles.glassBand, collapsedStyle]} pointerEvents="box-none">
          <BlurView intensity={55} tint="light" style={StyleSheet.absoluteFill} />
          <View style={[styles.glassRow, { paddingTop: insets.top + 8 }]}>
            <View style={styles.iconGroup}>
              <IconBtn solid palette={palette} onPress={() => setReaderFontSize(nextFontSize(readerFontSize))} label="Aa" />
              <IconBtn solid palette={palette} onPress={cycleAtmosphere} icon="contrast-outline" />
            </View>

            <Pressable
              onPress={() => setShowBookPicker(true)}
              style={[styles.chapterBtn, { backgroundColor: palette.card, borderColor: palette.accent }]}
            >
              <AppText variant="serifBold" size={14} color={palette.text}>
                {displayRef(location.book, location.chapter)}
              </AppText>
              <Ionicons name="chevron-down" size={10} color={palette.accent} />
            </Pressable>

            <View style={styles.iconGroup}>
              <IconBtn
                solid
                palette={palette}
                onPress={() => (isCurrentTrack ? audio.togglePlay() : playChapter(location.book, location.chapter))}
                icon={isCurrentTrack && audio.playing ? "pause" : "headset"}
              />
              <IconBtn solid palette={palette} onPress={() => setTab("search")} icon="search" />
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    );
  }

  return (
    <View style={[styles.simpleHeader, { paddingTop: insets.top + 16 }]}>
      <AppText variant="serifBold" size={19}>
        {TITLES[tab]}
      </AppText>
    </View>
  );
}

function IconBtn({
  onPress,
  icon,
  label,
  solid,
  palette,
}: {
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  label?: string;
  solid?: boolean;
  palette?: Palette;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.iconBtn, solid ? [styles.iconBtnSolid, { backgroundColor: palette?.accent }] : null]}
    >
      {icon ? (
        <Ionicons name={icon} size={14} color="#fff" />
      ) : (
        <AppText variant="sansExtraBold" size={12} color="#fff">
          {label}
        </AppText>
      )}
    </Pressable>
  );
}

function nextFontSize(current: number) {
  const idx = READER_FONT_SIZES.indexOf(current);
  return READER_FONT_SIZES[(idx + 1) % READER_FONT_SIZES.length];
}

// The hero band always uses the brand's dark gradient regardless of atmosphere,
// matching the source design's constant headerGrad treatment.
const ATMOSPHERE_GRAD: [string, string] = ["#23160E", "#4B3626"];

const styles = StyleSheet.create({
  heroBand: {
    flexShrink: 0,
  },
  floating: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
  },
  layerFill: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },
  glassBand: {
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    overflow: "hidden",
  },
  glassRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
  },
  heroImageWrap: {
    width: "100%",
    overflow: "hidden",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroTopScrim: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 56,
  },
  heroBottomBlend: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "15%",
  },
  heroFooter: {
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  pillRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 40,
  },
  iconGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  expandedIconRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 22,
    marginTop: 12,
  },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnSolid: {
    width: 34,
    height: 34,
    borderRadius: 17,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  chapterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1.2,
    borderColor: "#C8A86B",
    borderRadius: 16,
    paddingVertical: 5,
    paddingHorizontal: 13,
  },
  simpleHeader: {
    flexShrink: 0,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
});
