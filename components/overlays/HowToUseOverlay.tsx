import React, { useState } from "react";
import { View, Modal, Pressable, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useApp } from "@/context/AppContext";
import { AppText } from "@/components/AppText";

const SECTIONS = [
  {
    key: "desk",
    title: "Publisher's Desk",
    body: "The landing screen when you first open the app — your current chapter, bookmarks and notes at a glance, today's scripture, and featured collections from Twelve Scents Publishing.",
  },
  {
    key: "today",
    title: "Today",
    body: "A daily home base with a greeting, the verse of the day, and quick links back into your reading. It refreshes with a new verse each time you open it.",
  },
  {
    key: "read",
    title: "Read",
    body: "Tap the chapter name at the top to jump to any book or chapter. Tap a verse to highlight, bookmark, add a note, copy, or share it. A small ¹ next to a verse links to a Precepts topic for related cross-references.",
  },
  {
    key: "search",
    title: "Search",
    body: "Search the full text of every verse across the KJV and Apocrypha. Narrow results to specific books when you need to.",
  },
  {
    key: "plans",
    title: "Reading Plans",
    body: "The Chronological 1-Year plan, the Sin-Specific Battles topical study, and the topic-based study plans all live here, with progress you can check off as you go.",
  },
  {
    key: "library",
    title: "Library",
    body: "Every verse you've bookmarked and every note you've written, all in one place, organized for quick review.",
  },
  {
    key: "precepts",
    title: "Precepts",
    body: "Topical scripture chains — pick a theme and see every cross-reference tied to it, with a one-tap link back into the Read tab for full context.",
  },
  {
    key: "settings",
    title: "Settings",
    body: "Toggle notifications, switch reading atmosphere (Royal Parchment, Temple Stone, Midnight Scroll), adjust font size, upload your own chapter narrations, and find About Us and Feedback.",
  },
  {
    key: "upload-narration",
    title: "How to Upload Recordings (Audio Narration)",
    body: "Add your own voice recording for any chapter so it plays back when you tap the headphone icon in Read.",
    steps: [
      "Open the chapter you want to narrate in Read, then go to Settings.",
      "Scroll to the Audio Narration section — it shows the chapter you currently have open.",
      "Tap Upload Recording and choose an audio file from your device.",
      "Wait for the upload to finish — you'll see a confirmation toast when it's done.",
      "Tap the headphone icon in Read to play your recording. To replace it, upload a new file; to delete it, tap Remove in Settings.",
    ],
  },
];

export function HowToUseOverlay() {
  const { palette, showHowToUse, setShowHowToUse } = useApp();
  const [expanded, setExpanded] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={showHowToUse} animationType="fade" onRequestClose={() => setShowHowToUse(false)}>
      <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]} edges={["bottom"]}>
        <View style={[styles.headerRow, { paddingTop: insets.top + 16 }]}>
          <Pressable onPress={() => setShowHowToUse(false)} hitSlop={12}>
            <AppText size={20} dim>
              ←
            </AppText>
          </Pressable>
          <AppText variant="sansExtraBold" size={20}>
            How to Use
          </AppText>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <AppText dim size={14} style={{ lineHeight: 20, marginBottom: 16 }}>
            A quick guide to each part of the app. Tap a section to expand it.
          </AppText>

          <View style={{ gap: 10 }}>
            {SECTIONS.map((s) => {
              const isExpanded = expanded === s.key;
              return (
                <View key={s.key} style={[styles.card, { backgroundColor: palette.card }]}>
                  <Pressable onPress={() => setExpanded(isExpanded ? null : s.key)} style={styles.rowBetween}>
                    <AppText variant="sansExtraBold" size={15}>
                      {s.title}
                    </AppText>
                    <AppText dim size={16}>
                      {isExpanded ? "−" : "+"}
                    </AppText>
                  </Pressable>
                  {isExpanded ? (
                    <View style={{ marginTop: 10, gap: 8 }}>
                      <AppText size={13} dim style={{ lineHeight: 19 }}>
                        {s.body}
                      </AppText>
                      {s.steps ? (
                        <View style={{ gap: 6, marginTop: 2 }}>
                          {s.steps.map((step, i) => (
                            <View key={i} style={styles.stepRow}>
                              <AppText variant="sansExtraBold" size={13} color={palette.accent}>
                                {i + 1}.
                              </AppText>
                              <AppText size={13} style={{ flex: 1, lineHeight: 19 }}>
                                {step}
                              </AppText>
                            </View>
                          ))}
                        </View>
                      ) : null}
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
  card: { borderRadius: 16, padding: 18 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  stepRow: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
});
