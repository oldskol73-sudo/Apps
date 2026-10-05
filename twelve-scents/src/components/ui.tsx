import React from 'react';
import { Pressable, StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radius, sizes, type } from '@/theme';
import { Icon, IconName } from './Icon';

export const tap = () => { Haptics.selectionAsync().catch(() => {}); };

export function Wordmark({ color = colors.ink }: { color?: string }) {
  return <Text accessibilityRole="header" style={[type.wordmark, { color }]}>Twelve Scents</Text>;
}
export function Kicker({ children, color = colors.brassText, style }: { children: React.ReactNode; color?: string; style?: StyleProp<TextStyle> }) {
  return <Text style={[type.kicker, { color }, style]}>{children}</Text>;
}

export function Chip({ label, active, onPress, dark }: { label: string; active?: boolean; onPress: () => void; dark?: boolean }) {
  return (
    <Pressable onPress={() => { tap(); onPress(); }} accessibilityRole="button" accessibilityState={{ selected: !!active }} hitSlop={4}
      style={[s.chip, active ? s.chipActive : { borderColor: dark ? colors.hairlineDark : colors.hairline, backgroundColor: dark ? 'transparent' : colors.surface }]}>
      <Text style={{ fontFamily: type.label.fontFamily, fontSize: 14, color: active ? colors.btnText : dark ? colors.onDark : colors.ink }}>{label}</Text>
    </Pressable>
  );
}

export function PrimaryButton({ label, onPress, disabled, loading, style }: { label: string; onPress: () => void; disabled?: boolean; loading?: boolean; style?: StyleProp<ViewStyle> }) {
  const off = disabled || loading;
  return (
    <Pressable onPress={() => { tap(); onPress(); }} disabled={off} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: !!off, busy: !!loading }}
      style={({ pressed }) => [{ opacity: off ? 0.55 : pressed ? 0.88 : 1 }, style]}>
      <LinearGradient colors={gradients.primary} style={s.primary}>
        <Text style={s.primaryText}>{loading ? 'Please wait…' : label}</Text>
      </LinearGradient>
    </Pressable>
  );
}
export function OutlineButton({ label, onPress, dark }: { label: string; onPress: () => void; dark?: boolean }) {
  return (
    <Pressable onPress={() => { tap(); onPress(); }} accessibilityRole="button" style={[s.outline, { borderColor: dark ? colors.hairlineDark : colors.hairline }]}>
      <Text style={{ fontFamily: type.label.fontFamily, fontSize: 14, color: dark ? colors.onDark : colors.ink }}>{label}</Text>
    </Pressable>
  );
}

/** Icon-only round button (44pt min touch target) with mandatory accessibility label. */
export function CircleButton({ icon, label, onPress, size = 44, color = colors.ink, border = colors.hairline, bg = 'transparent', filled }: {
  icon: IconName; label: string; onPress: () => void; size?: number; color?: string; border?: string; bg?: string; filled?: boolean;
}) {
  return (
    <Pressable onPress={() => { tap(); onPress(); }} accessibilityRole="button" accessibilityLabel={label} hitSlop={4}
      style={{ width: Math.max(size, sizes.minTouch), height: Math.max(size, sizes.minTouch), borderRadius: 99, borderWidth: 1, borderColor: border, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={icon} size={20} color={color} filled={filled} />
    </Pressable>
  );
}

export function Stepper({ qty, onChange, dark, min = 0 }: { qty: number; onChange: (n: number) => void; dark?: boolean; min?: number }) {
  const c = dark ? colors.onDark : colors.ink;
  return (
    <View style={[s.stepper, { borderColor: dark ? colors.hairlineDark : colors.hairline }]} accessibilityRole="adjustable" accessibilityValue={{ text: `Quantity ${qty}` }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => onChange(e.nativeEvent.actionName === 'increment' ? qty + 1 : Math.max(min, qty - 1))}>
      <Pressable accessibilityRole="button" accessibilityLabel="Decrease quantity" hitSlop={6} onPress={() => { tap(); onChange(Math.max(min, qty - 1)); }} style={s.stepBtn}><Icon name="minus" size={18} color={c} /></Pressable>
      <Text style={{ fontFamily: type.label.fontFamily, fontSize: 16, color: c, minWidth: 22, textAlign: 'center' }}>{qty}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel="Increase quantity" hitSlop={6} onPress={() => { tap(); onChange(qty + 1); }} style={s.stepBtn}><Icon name="plus" size={18} color={c} /></Pressable>
    </View>
  );
}

export function Switch2({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <Pressable onPress={() => { tap(); onChange(!value); }} accessibilityRole="switch" accessibilityLabel={label} accessibilityState={{ checked: value }} hitSlop={8}
      style={[s.track, { backgroundColor: value ? colors.brassFill : 'transparent', borderColor: value ? colors.brassFill : colors.hairlineDark, alignItems: value ? 'flex-end' : 'flex-start' }]}>
      <View style={[s.thumb, { backgroundColor: value ? colors.btnText : colors.onDarkMuted }]} />
    </Pressable>
  );
}

const s = StyleSheet.create({
  chip: { minHeight: sizes.minTouch - 4, paddingHorizontal: 16, borderRadius: radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chipActive: { backgroundColor: colors.brassFill, borderColor: colors.brassFill },
  primary: { height: sizes.buttonHeight, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  primaryText: { fontFamily: type.label.fontFamily, fontSize: 17, color: colors.btnText },
  outline: { minHeight: sizes.minTouch, paddingHorizontal: 18, borderRadius: radius.pill, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stepper: { height: sizes.buttonHeight - 8, borderRadius: radius.pill, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 },
  stepBtn: { width: sizes.minTouch, height: sizes.minTouch, alignItems: 'center', justifyContent: 'center' },
  track: { width: 50, height: 30, borderRadius: 15, borderWidth: 1, padding: 3, justifyContent: 'center' },
  thumb: { width: 22, height: 22, borderRadius: 11 },
});
