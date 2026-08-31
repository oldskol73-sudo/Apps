import React from "react";
import { View, Modal, Pressable, Image, StyleSheet } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Slider from "@react-native-community/slider";
import { Ionicons } from "@expo/vector-icons";
import { useApp } from "@/context/AppContext";
import { AppText } from "@/components/AppText";
import { displayRef } from "@/constants/bible/books";

const COVER = require("@/assets/images/bible/Publishing profie pic.png");

function fmtTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export function AudioPlayer() {
  const { palette, audio } = useApp();
  const insets = useSafeAreaInsets();

  if (!audio.track) return null;

  return (
    <Modal visible={audio.showPlayer} animationType="slide" onRequestClose={audio.closePlayer}>
      <SafeAreaView style={[styles.container, { backgroundColor: palette.card, paddingTop: insets.top + 16 }]} edges={["bottom"]}>
        <Pressable
          onPress={audio.closePlayer}
          hitSlop={12}
          style={[styles.closeBtn, { backgroundColor: palette.cardAlt }]}
        >
          <AppText size={16} variant="sansBold">
            ✕
          </AppText>
        </Pressable>

        <View style={styles.content}>
          <Image source={COVER} style={styles.cover} resizeMode="cover" />
          <View style={{ alignItems: "center" }}>
            <AppText variant="sansExtraBold" size={19}>
              {displayRef(audio.track.book, audio.track.chapter)}
            </AppText>
            <AppText size={13} dim style={{ marginTop: 4 }}>
              KJV Narration
            </AppText>
          </View>

          <View style={{ width: "100%" }}>
            <Slider
              value={audio.position}
              minimumValue={0}
              maximumValue={audio.duration || 1}
              onSlidingComplete={audio.seek}
              minimumTrackTintColor="#D4AF37"
              maximumTrackTintColor={palette.track}
              thumbTintColor="#D4AF37"
            />
            <View style={styles.timeRow}>
              <AppText size={11} dim>
                {fmtTime(audio.position)}
              </AppText>
              <AppText size={11} dim>
                {fmtTime(audio.duration)}
              </AppText>
            </View>
          </View>

          <View style={styles.controlsRow}>
            <Pressable onPress={() => audio.skip(-15)}>
              <AppText size={20}>−15</AppText>
            </Pressable>
            <Pressable onPress={audio.togglePlay} style={styles.playBtn}>
              <Ionicons name={audio.playing ? "pause" : "play"} size={24} color="#D4AF37" style={audio.playing ? undefined : { marginLeft: 3 }} />
            </Pressable>
            <Pressable onPress={() => audio.skip(15)}>
              <AppText size={20}>+15</AppText>
            </Pressable>
          </View>

          <Pressable onPress={audio.cycleSpeed} style={styles.speedBtn}>
            <AppText variant="sansBold" size={12} color="#D4AF37">
              {audio.speed}x
            </AppText>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingBottom: 40 },
  closeBtn: {
    alignSelf: "flex-start",
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },
  content: { flex: 1, alignItems: "center", justifyContent: "center", gap: 26 },
  cover: { width: 220, height: 220, borderRadius: 22 },
  timeRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 2 },
  controlsRow: { flexDirection: "row", alignItems: "center", gap: 28 },
  playBtn: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1A0F05",
    borderWidth: 2.5,
    borderColor: "#D4AF37",
    shadowColor: "#D4AF37",
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  speedBtn: {
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#1A0F05",
    borderWidth: 1.5,
    borderColor: "#D4AF37",
  },
});
