import React, { useState } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { colors, gradients } from '@/theme';

type Scrim = 'left' | 'bottom' | 'none';
interface Props { uri?: string; tone?: string; seed?: number; scrim?: Scrim; style?: StyleProp<ViewStyle>; label?: string; children?: React.ReactNode }

/**
 * Full-bleed photo with a legibility scrim. When the image is missing or fails to load (e.g. placeholder CDN),
 * a warm generative "bokeh" plate tinted with the product colour is shown instead, so layouts never look broken.
 */
export function Photo({ uri, tone = colors.brassFill, seed = 1, scrim = 'none', style, label, children }: Props) {
  const [failed, setFailed] = useState(false);
  const showImage = !!uri && !failed;
  const r = (n: number) => ((Math.sin(seed * 9301 + n * 49297) + 1) / 2);
  return (
    <View style={[styles.box, style]} accessible={!!label} accessibilityRole={label ? 'image' : undefined} accessibilityLabel={label}>
      <LinearGradient colors={[tone, colors.dark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <RadialGradient id="g" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={colors.brassLight} stopOpacity="0.55" />
            <Stop offset="1" stopColor={colors.brassLight} stopOpacity="0" />
          </RadialGradient>
        </Defs>
        {[0, 1, 2, 3, 4].map((i) => (
          <Circle key={i} cx={55 + r(i) * 45} cy={20 + r(i + 7) * 70} r={10 + r(i + 3) * 22} fill="url(#g)" opacity={0.35 + r(i + 11) * 0.5} />
        ))}
      </Svg>
      {showImage && <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} onError={() => setFailed(true)} accessibilityIgnoresInvertColors />}
      {scrim === 'left' && <LinearGradient colors={gradients.scrimLeft} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} pointerEvents="none" />}
      {scrim === 'bottom' && <LinearGradient colors={gradients.scrimBottom} style={StyleSheet.absoluteFill} pointerEvents="none" />}
      {children}
    </View>
  );
}
const styles = StyleSheet.create({ box: { overflow: 'hidden', backgroundColor: colors.dark } });
