import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View, ViewStyle, StyleProp } from 'react-native';
import { colors, fonts, radius, type } from '@/theme';
import { PrimaryButton, OutlineButton } from './ui';

export function Skeleton({ style }: { style?: StyleProp<ViewStyle> }) {
  const o = useRef(new Animated.Value(0.45)).current;
  useEffect(() => {
    const a = Animated.loop(Animated.sequence([Animated.timing(o, { toValue: 0.9, duration: 700, useNativeDriver: true }), Animated.timing(o, { toValue: 0.45, duration: 700, useNativeDriver: true })]));
    a.start(); return () => a.stop();
  }, [o]);
  return <Animated.View style={[{ backgroundColor: colors.tint, borderRadius: radius.cardSm, opacity: o }, style]} />;
}
export function LoadingView({ label = 'Loading' }: { label?: string }) {
  return (
    <View style={{ padding: 20, gap: 14 }} accessible accessibilityLabel={label} accessibilityRole="progressbar">
      <Skeleton style={{ height: 180 }} /><Skeleton style={{ height: 24, width: '60%' }} />
      <View style={{ flexDirection: 'row', gap: 12 }}><Skeleton style={{ flex: 1, height: 160 }} /><Skeleton style={{ flex: 1, height: 160 }} /></View>
    </View>
  );
}
export function EmptyView({ title, body, action, onAction, dark }: { title: string; body?: string; action?: string; onAction?: () => void; dark?: boolean }) {
  return (
    <View style={s.wrap}>
      <Text style={[type.section, { color: dark ? colors.onDark : colors.ink, textAlign: 'center' }]}>{title}</Text>
      {body ? <Text style={[type.body, { color: dark ? colors.onDarkMuted : colors.textSecondary, textAlign: 'center' }]}>{body}</Text> : null}
      {action && onAction ? <View style={{ width: 220, marginTop: 8 }}><PrimaryButton label={action} onPress={onAction} /></View> : null}
    </View>
  );
}
export function ErrorView({ message = 'Something went wrong.', onRetry }: { message?: string; onRetry: () => void }) {
  return (
    <View style={s.wrap} accessibilityRole="alert">
      <Text style={[type.section, { color: colors.ink, textAlign: 'center' }]}>We couldn’t load this</Text>
      <Text style={[type.body, { color: colors.textSecondary, textAlign: 'center' }]}>{message}</Text>
      <OutlineButton label="Try again" onPress={onRetry} />
    </View>
  );
}
const s = StyleSheet.create({ wrap: { padding: 32, alignItems: 'center', gap: 10, justifyContent: 'center' } });
void fonts;
