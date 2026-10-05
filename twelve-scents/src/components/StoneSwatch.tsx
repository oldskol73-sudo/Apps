import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { colors } from '@/theme';

/** Circle with inner shadow + 3pt background ring + 1.5pt brass ring. */
export function StoneSwatch({ hex, size = 52 }: { hex: string; size?: number }) {
  const inner = size - 2 * (3 + 1.5);
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 1.5, borderColor: colors.brassFill, padding: 3, backgroundColor: colors.bg }}>
      <View style={{ width: inner, height: inner, borderRadius: inner / 2, overflow: 'hidden', backgroundColor: hex }}>
        <Svg width={inner} height={inner} viewBox="0 0 100 100">
          <Defs>
            <RadialGradient id="in" cx="40%" cy="35%" r="75%">
              <Stop offset="0.55" stopColor="#000" stopOpacity="0" />
              <Stop offset="1" stopColor="#000" stopOpacity="0.45" />
            </RadialGradient>
            <RadialGradient id="hi" cx="32%" cy="28%" r="30%">
              <Stop offset="0" stopColor="#fff" stopOpacity="0.35" />
              <Stop offset="1" stopColor="#fff" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="50" cy="50" r="50" fill="url(#in)" />
          <Circle cx="50" cy="50" r="50" fill="url(#hi)" />
        </Svg>
      </View>
    </View>
  );
}
