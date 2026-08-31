import React from "react";
import { View, Pressable, Image, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "@/context/AppContext";
import { AppText } from "@/components/AppText";
import { displayRef } from "@/constants/bible/books";

const PROFILE_ART = require("@/assets/images/bible/Publishing profie pic.png");

export function MiniPlayer() {
  const { palette, audio } = useApp();

  if (!audio.track || audio.showPlayer) return null;
  const pct = audio.duration ? Math.min(100, (audio.position / audio.duration) * 100) : 0;

  return (
    <Pressable
      onPress={() => audio.setShowPlayer(true)}
      style={[styles.bar, { backgroundColor: palette.card, borderTopColor: palette.divider }]}
    >
      <Image source={PROFILE_ART} style={styles.artStub} resizeMode="cover" />
      <View style={{ flex: 1, minWidth: 0 }}>
        <AppText variant="sansBold" size={12} numberOfLines={1}>
          {displayRef(audio.track.book, audio.track.chapter)}
        </AppText>
        <View style={[styles.track, { backgroundColor: palette.track }]}>
          <View style={[styles.trackFill, { width: `${pct}%`, backgroundColor: palette.accent }]} />
        </View>
      </View>
      <Pressable
        onPress={(e) => {
          e.stopPropagation();
          audio.togglePlay();
        }}
        style={[styles.playBtn, { backgroundColor: palette.accent }]}
      >
        <Ionicons name={audio.playing ? "pause" : "play"} size={14} color="#fff" style={audio.playing ? undefined : { marginLeft: 2 }} />
      </Pressable>
      <Pressable
        onPress={(e) => {
          e.stopPropagation();
          audio.stop();
        }}
        hitSlop={10}
        style={styles.closeBtn}
      >
        <AppText size={15} dim>
          ✕
        </AppText>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderTopWidth: 1,
  },
  artStub: { width: 38, height: 38, borderRadius: 9, overflow: "hidden" },
  track: { height: 3, borderRadius: 2, marginTop: 5, overflow: "hidden" },
  trackFill: { height: "100%", borderRadius: 2 },
  playBtn: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  closeBtn: { alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
});
