import React, { useState } from "react";
import { View, Modal, Pressable, ScrollView, StyleSheet, ActivityIndicator, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import { useApp } from "@/context/AppContext";
import { AppText } from "@/components/AppText";
import { displayRef } from "@/constants/bible/books";
import { READER_FONT_SIZES, ATMOSPHERES, ATMOSPHERE_ORDER } from "@/constants/theme";

const MAX_NARRATION_BYTES = 60 * 1024 * 1024; // 60MB — comfortably covers a full chapter's audio without risking loading an oversized file fully into memory during upload.

export function SettingsOverlay() {
  const {
    palette,
    showSettings,
    setShowSettings,
    notificationsOn,
    toggleNotifications,
    atmosphere,
    setAtmosphere,
    readerFontSize,
    setReaderFontSize,
    location,
    narrations,
    userId,
    showToast,
    showAbout,
    setShowAbout,
    showHowToUse,
    setShowHowToUse,
  } = useApp();

  const currentRef = displayRef(location.book, location.chapter);
  const narration = narrations.narrationFor(location.book, location.chapter);
  const [isUploading, setIsUploading] = useState(false);

  async function onUpload() {
    if (isUploading) return;
    const result = await DocumentPicker.getDocumentAsync({ type: "audio/*" });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    if (asset.size != null && asset.size > MAX_NARRATION_BYTES) {
      showToast(`File is too large — keep narrations under ${MAX_NARRATION_BYTES / (1024 * 1024)}MB`);
      return;
    }
    setIsUploading(true);
    try {
      await narrations.uploadNarration(location.book, location.chapter, asset.uri, asset.name, asset.mimeType);
      showToast("Narration uploaded");
    } catch {
      showToast("Upload failed — try again");
    } finally {
      setIsUploading(false);
    }
  }

  function onRemove() {
    narrations.removeNarration(location.book, location.chapter);
    showToast("Narration removed");
  }

  function nextFontSize() {
    const idx = READER_FONT_SIZES.indexOf(readerFontSize);
    setReaderFontSize(READER_FONT_SIZES[(idx + 1) % READER_FONT_SIZES.length]);
  }

  return (
    <Modal
      visible={showSettings && !showAbout && !showHowToUse}
      animationType="fade"
      onRequestClose={() => setShowSettings(false)}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: palette.bg }]} edges={["top", "bottom"]}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => setShowSettings(false)}>
              <AppText size={20} dim>
                ←
              </AppText>
            </Pressable>
            <AppText variant="sansExtraBold" size={20}>
              Settings
            </AppText>
          </View>

          <SectionLabel>Notification</SectionLabel>
          <View style={[styles.card, styles.rowBetween, { backgroundColor: palette.card, marginBottom: 18 }]}>
            <AppText size={15} variant="sans">
              Notifications
            </AppText>
            <Switch value={notificationsOn} onChange={toggleNotifications} />
          </View>

          <SectionLabel>Reading Atmosphere</SectionLabel>
          <View style={{ gap: 10, marginBottom: 18 }}>
            {ATMOSPHERE_ORDER.map((key) => {
              const a = ATMOSPHERES[key];
              const active = atmosphere === key;
              return (
                <Pressable
                  key={key}
                  onPress={() => setAtmosphere(key)}
                  style={[
                    styles.atmosphereCard,
                    { backgroundColor: palette.card, borderColor: active ? a.accent : "transparent" },
                  ]}
                >
                  <View style={styles.rowBetween}>
                    <View style={styles.rowLeft}>
                      <AppText size={18}>{a.badge}</AppText>
                      <AppText variant="sansExtraBold" size={15}>
                        {a.name}
                      </AppText>
                    </View>
                    {active ? (
                      <View style={[styles.activeBadge, { backgroundColor: a.accent }]}>
                        <AppText variant="sansExtraBold" size={10} color="#fff">
                          ACTIVE
                        </AppText>
                      </View>
                    ) : null}
                  </View>
                  <AppText size={11} dim style={{ marginTop: 4 }}>
                    {a.tone}
                  </AppText>
                  <AppText size={12} dim style={{ marginTop: 8, fontStyle: "italic", lineHeight: 17 }}>
                    "{a.tagline}"
                  </AppText>
                </Pressable>
              );
            })}
          </View>

          <SectionLabel>Font</SectionLabel>
          <View style={[styles.card, { backgroundColor: palette.card, marginBottom: 18 }]}>
            <Pressable onPress={nextFontSize} style={[styles.optionRow, { borderBottomWidth: 0 }]}>
              <AppText size={15}>Reader Font Size</AppText>
              <AppText size={13} dim>
                {readerFontSize}px ›
              </AppText>
            </Pressable>
          </View>

          <SectionLabel>Audio Narration</SectionLabel>
          <View style={[styles.card, { backgroundColor: palette.card, marginBottom: 18 }]}>
            <AppText variant="sansBold" size={15} style={{ marginBottom: 2 }}>
              {currentRef}
            </AppText>
            <AppText size={12} dim style={{ marginBottom: 12 }}>
              {narration ? `Uploaded: ${narration.name}` : "No custom narration uploaded"}
            </AppText>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable
                onPress={onUpload}
                disabled={!userId || isUploading}
                style={[
                  styles.pillBtn,
                  styles.rowLeft,
                  { backgroundColor: palette.accent, opacity: isUploading ? 0.7 : 1 },
                ]}
              >
                {isUploading ? <ActivityIndicator size="small" color="#fff" /> : null}
                <AppText variant="sansBold" size={12} color="#fff">
                  {isUploading ? "Uploading…" : "Upload Recording"}
                </AppText>
              </Pressable>
              {narration ? (
                <Pressable
                  onPress={onRemove}
                  disabled={isUploading}
                  style={[styles.pillBtn, { backgroundColor: palette.cardAlt, opacity: isUploading ? 0.5 : 1 }]}
                >
                  <AppText variant="sansBold" size={12} dim>
                    Remove
                  </AppText>
                </Pressable>
              ) : null}
            </View>
          </View>

          <SectionLabel>About App</SectionLabel>
          <View style={[styles.card, { backgroundColor: palette.card, marginBottom: 18 }]}>
            <Pressable onPress={() => showToast("Coming soon")} style={[styles.optionRow, { borderBottomColor: palette.divider }]}>
              <AppText size={15}>Feedback</AppText>
              <AppText dim>›</AppText>
            </Pressable>
            <Pressable onPress={() => setShowAbout(true)} style={[styles.optionRow, { borderBottomColor: palette.divider }]}>
              <AppText size={15}>About Us</AppText>
              <AppText dim>›</AppText>
            </Pressable>
            <Pressable onPress={() => showToast("Coming soon")} style={styles.optionRow}>
              <AppText size={15}>Rate Us</AppText>
            </Pressable>
          </View>

          <SectionLabel>Support</SectionLabel>
          <View style={[styles.card, { backgroundColor: palette.card }]}>
            <Pressable
              onPress={() => setShowHowToUse(true)}
              style={[styles.optionRow, { borderBottomColor: palette.divider }]}
            >
              <AppText size={15}>How to Use</AppText>
              <AppText dim>›</AppText>
            </Pressable>
            <Pressable
              onPress={() => Linking.openURL("https://twelvescentspub.com")}
              style={[styles.optionRow, { borderBottomColor: palette.divider }]}
            >
              <AppText size={15}>More Apps</AppText>
              <AppText dim>›</AppText>
            </Pressable>
            <Pressable
              onPress={() => Linking.openURL("mailto:publishing@twelvescentspub.com")}
              style={styles.optionRow}
            >
              <AppText size={15}>Help</AppText>
              <AppText dim>›</AppText>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  const { palette } = useApp();
  return (
    <AppText variant="sansExtraBold" size={11} dim style={{ letterSpacing: 1, paddingVertical: 8 }}>
      {String(children).toUpperCase()}
    </AppText>
  );
}

function Switch({ value, onChange }: { value: boolean; onChange: () => void }) {
  const { palette } = useApp();
  return (
    <Pressable
      onPress={onChange}
      style={[styles.switchTrack, { backgroundColor: value ? palette.accent : palette.track }]}
    >
      <View style={[styles.switchKnob, { left: value ? 21 : 3 }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingTop: 16, paddingHorizontal: 20, paddingBottom: 40 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 10 },
  card: { borderRadius: 14, padding: 16 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  pillBtn: { borderRadius: 10, paddingVertical: 9, paddingHorizontal: 16 },
  switchTrack: { width: 44, height: 26, borderRadius: 13, justifyContent: "center" },
  switchKnob: { position: "absolute", width: 20, height: 20, borderRadius: 10, backgroundColor: "#fff" },
  atmosphereCard: { borderRadius: 16, padding: 16, borderWidth: 2 },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 9 },
  activeBadge: { borderRadius: 20, paddingVertical: 4, paddingHorizontal: 9 },
});
