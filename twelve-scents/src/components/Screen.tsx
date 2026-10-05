import React from 'react';
import { ScrollView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, space } from '@/theme';
import { CircleButton, Wordmark } from './ui';

export function AppHeader() {
  const router = useRouter();
  return (
    <View style={s.header}>
      <Wordmark />
      <CircleButton icon="search" label="Search" border="transparent" onPress={() => router.navigate({ pathname: '/browse', params: { search: String(Date.now()) } })} />
    </View>
  );
}

/** Cream screen with safe-area top padding, optional scrolling and the wordmark header. */
export function Screen({ children, header = true, scroll = true, contentStyle, bottomPad = 24 }: {
  children: React.ReactNode; header?: boolean; scroll?: boolean; contentStyle?: StyleProp<ViewStyle>; bottomPad?: number;
}) {
  const insets = useSafeAreaInsets();
  const body = (
    <>
      {header && <AppHeader />}
      {children}
    </>
  );
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      {scroll ? (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[{ paddingBottom: bottomPad + 80 }, contentStyle]} showsVerticalScrollIndicator={false}>{body}</ScrollView>
      ) : <View style={[{ flex: 1 }, contentStyle]}>{body}</View>}
    </View>
  );
}
const s = StyleSheet.create({ header: { paddingLeft: space.gutter, paddingRight: space.md, minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' } });
