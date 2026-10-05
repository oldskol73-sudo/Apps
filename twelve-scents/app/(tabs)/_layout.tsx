import React from 'react';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, IconName } from '@/components/Icon';
import { cartCount } from '@/domain/pricing';
import { useStore } from '@/state/store';
import { colors, fonts, sizes } from '@/theme';

const TABS: { name: string; title: string; icon: IconName }[] = [
  { name: 'index', title: 'Shop', icon: 'home' },
  { name: 'browse', title: 'Browse', icon: 'grid' },
  { name: 'finder', title: 'Finder', icon: 'diamond' },
  { name: 'bag', title: 'Bag', icon: 'bag' },
  { name: 'account', title: 'Account', icon: 'person' },
];

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const { state } = useStore();
  const count = cartCount(state.cart);
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: colors.brassActive,
      tabBarInactiveTintColor: colors.muted,
      tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.hairline, height: sizes.tabBar + insets.bottom, paddingBottom: insets.bottom + 4, paddingTop: 8 },
      tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase' },
      tabBarAllowFontScaling: false,
      sceneStyle: { backgroundColor: colors.bg },
    }}>
      {TABS.map((t) => (
        <Tabs.Screen key={t.name} name={t.name} options={{
          title: t.title,
          tabBarAccessibilityLabel: t.name === 'bag' && count ? `Bag, ${count} items` : t.title,
          tabBarBadge: t.name === 'bag' && count > 0 ? count : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.brassFill, color: colors.btnText, fontFamily: fonts.medium, fontSize: 11 },
          tabBarIcon: ({ color, focused }) => <Icon name={t.icon} size={25} color={color} filled={focused} />,
        }} />
      ))}
    </Tabs>
  );
}
