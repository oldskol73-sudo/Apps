import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '@/theme';

/** Width of the dark strip on the left of a poster cell that holds the gem and the vertical stone name. */
export const TRIBE_STRIP = 34;

const styles = StyleSheet.create({
  strip: { position: 'absolute', left: 0, top: 0, bottom: 0, width: TRIBE_STRIP, backgroundColor: colors.tint, borderRightWidth: 1, borderRightColor: colors.brassFill35 },
});

/**
 * A tribe's poster shown whole (uncropped) on a dark tile, to the right of the gem/stone strip.
 * Renders nothing without a photo.
 */
export function TribePhoto({ uri }: { uri?: string }) {
  if (!uri) return null;
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.dark }]} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {/* Parchment strip (same tone as the page's tinted cards) bridges the cream page and the dark posters. */}
      <View style={styles.strip} />
      <Image source={{ uri }} style={[StyleSheet.absoluteFill, { left: TRIBE_STRIP, right: 4, top: 4, bottom: 4 }]} contentFit="contain" transition={250} />
    </View>
  );
}
