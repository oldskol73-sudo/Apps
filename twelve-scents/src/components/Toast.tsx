import React, { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, sizes, type } from '@/theme';
import { useStore } from '@/state/store';

/** "<Product> added · VIEW BAG" toast, auto-dismisses after 3.2s. */
export function Toast() {
  const { state, dismissToast } = useStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const t = state.toast;
  useEffect(() => {
    if (!t) return;
    const h = setTimeout(dismissToast, 3200);
    return () => clearTimeout(h);
  }, [t, dismissToast]);
  if (!t) return null;
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 16, right: 16, bottom: sizes.tabBar + insets.bottom + 12 }}>
      <View accessibilityLiveRegion="polite" accessibilityRole="alert"
        style={{ backgroundColor: colors.ink, borderRadius: radius.pill, paddingLeft: 20, paddingRight: 6, minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={[type.body, { color: colors.onDark, flexShrink: 1 }]} numberOfLines={1}>{t.message}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="View bag" style={{ minHeight: 44, paddingHorizontal: 14, justifyContent: 'center' }}
          onPress={() => { dismissToast(); router.push('/bag'); }}>
          <Text style={[type.kicker, { color: colors.brassLight }]}>· View bag</Text>
        </Pressable>
      </View>
    </View>
  );
}
