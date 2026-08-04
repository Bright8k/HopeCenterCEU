import { Platform } from 'react-native';

export type AppColors = {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  accentDark: string;
  background: string;
  surface: string;
  surfaceMuted: string;
  card: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  shadow: string;
  error: string;
  success: string;
  warning: string;
  white: string;
  black: string;
};

// 2026 redesign — crisp neutral base, purple as pure accent, not a tinting agent.
// Light: Slate-family neutrals give a clean professional feel.
// Dark: True zinc-based darks with no purple bleed into surfaces.

export const LightColors: AppColors = {
  primary: '#8B1A8F',
  primaryLight: '#B845BE',
  primaryDark: '#6B1470',
  accent: '#D4A843',
  accentDark: '#9A6F1A',
  background: '#F8FAFC',   // slate-50 — neutral white, not purple-tinted
  surface: '#F1F5F9',      // slate-100
  surfaceMuted: '#E2E8F0', // slate-200
  card: '#FFFFFF',         // pure white cards for maximum depth contrast
  text: '#0F172A',         // slate-900 — crisper than previous near-black
  textSecondary: '#475569',// slate-600
  textMuted: '#94A3B8',    // slate-400
  border: '#E2E8F0',       // slate-200 — lighter, more subtle
  shadow: '#1E293B',       // slate-800
  error: '#DC2626',
  success: '#16A34A',
  warning: '#D97706',
  white: '#FFFFFF',
  black: '#000000',
};

export const DarkColors: AppColors = {
  primary: '#8B1A8F',
  primaryLight: '#C668CF',
  primaryDark: '#8B1A8F',
  accent: '#E4BF68',
  accentDark: '#F2D38A',
  background: '#09090B',   // zinc-950 — true dark, no purple bleed
  surface: '#111115',
  surfaceMuted: '#1A1A20',
  card: '#18181D',         // zinc-900-ish — cards lift subtly from bg
  text: '#F4F4F5',         // zinc-100
  textSecondary: '#A1A1AA',// zinc-400
  textMuted: '#52525B',    // zinc-600
  border: '#27272A',       // zinc-800
  shadow: '#000000',
  error: '#F87171',
  success: '#34D399',
  warning: '#FBBF24',
  white: '#FFFFFF',
  black: '#000000',
};

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 21,
  '2xl': 26,
  '3xl': 34,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
};

export const Radius = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  full: 999,
};

// Layered shadow system — use shadowColor from AppColors.shadow
export const Shadow = {
  sm: {
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    shadowOpacity: 0.06,
    elevation: 2,
  },
  md: {
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 16,
    shadowOpacity: 0.09,
    elevation: 5,
  },
  lg: {
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 28,
    shadowOpacity: 0.13,
    elevation: 10,
  },
} as const;

export const Typography = {
  // Cormorant Garamond — hero headings and brand moments only
  heading: 'CormorantGaramond_700Bold',
  headingSemiBold: 'CormorantGaramond_600SemiBold',
  headingMedium: 'CormorantGaramond_500Medium',
  headingRegular: 'CormorantGaramond_400Regular',
  headingItalic: 'CormorantGaramond_400Regular_Italic',
  // Nunito — all UI, labels, body, interactive elements
  body: 'Nunito_400Regular',
  bodySemiBold: 'Nunito_600SemiBold',
  bodyBold: 'Nunito_700Bold',
  bodyExtraBold: 'Nunito_800ExtraBold', // for stat numbers and impact labels
};

export function withAlpha(hex: string, alphaHex: string) {
  return `${hex}${alphaHex}`;
}

export function getWebTransitionStyle(properties = 'transform, box-shadow, background-color, border-color, color, opacity') {
  if (Platform.OS !== 'web') {
    return null;
  }

  return {
    transitionDuration: '200ms',
    transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
    transitionProperty: properties,
  } as any;
}
