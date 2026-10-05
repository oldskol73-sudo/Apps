/** Single source of truth for every design token. Views must not hard-code colours. */
export const colors = {
  bg: '#F4EEE5',
  surface: '#FBF8F3',
  tint: '#EFE3CF',
  ink: '#2A211B',
  textSecondary: '#6E6155',
  muted: '#7A6C5F',
  brassText: '#86622A',
  brassActive: '#9C7430',
  brassFill: '#C99A3F',
  brassLight: '#E3C47E',
  btnTop: '#E6C46E',
  btnBottom: '#C99A3F',
  btnText: '#2A1D10',
  dark: '#1E1814',
  darkPanel: '#2A221C',
  onDark: '#F4EEE5',
  onDarkMuted: '#CDBFAE',
  hairline: 'rgba(42,33,27,0.16)',
  hairlineDark: 'rgba(244,238,229,0.18)',
  brassFill35: 'rgba(201,154,63,0.35)',
  scrimDark: 'rgba(20,14,10,0.78)',
  scrimClear: 'rgba(20,14,10,0)',
  creamFade: 'rgba(244,238,229,0)',
  danger: '#9A2F25',
  white: '#FFFFFF',
} as const;

export const fonts = {
  display: 'BodoniModa_400Regular',
  displayItalic: 'BodoniModa_400Regular_Italic',
  displayMedium: 'BodoniModa_500Medium',
  light: 'Jost_300Light',
  body: 'Jost_400Regular',
  medium: 'Jost_500Medium',
} as const;

export const radius = { card: 16, cardSm: 14, pill: 999, button: 28 } as const;
export const space = { gutter: 20, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;
export const sizes = { buttonHeight: 56, minTouch: 44, tabBar: 64 } as const;

export const type = {
  wordmark: { fontFamily: fonts.medium, fontSize: 13, letterSpacing: 0.42 * 13, textTransform: 'uppercase' as const },
  h1: { fontFamily: fonts.display, fontSize: 38, lineHeight: 42 },
  h1Product: { fontFamily: fonts.display, fontSize: 40, lineHeight: 42 },
  section: { fontFamily: fonts.display, fontSize: 26, lineHeight: 30 },
  kicker: { fontFamily: fonts.medium, fontSize: 11, letterSpacing: 0.24 * 11, textTransform: 'uppercase' as const },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22 },
  bodyLight: { fontFamily: fonts.light, fontSize: 15, lineHeight: 22 },
  small: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: fonts.medium, fontSize: 14 },
} as const;

export const shadow = {
  card: { shadowColor: '#2A211B', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
} as const;

export const gradients = {
  primary: [colors.btnTop, colors.btnBottom] as const,
  scrimLeft: [colors.scrimDark, colors.scrimClear] as const,
  scrimBottom: [colors.scrimClear, colors.scrimDark] as const,
};
