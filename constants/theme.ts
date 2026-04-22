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

export const LightColors: AppColors = {
  primary: '#8B1A8F',
  primaryLight: '#B94DBE',
  primaryDark: '#6A1270',
  accent: '#D4A843',
  accentDark: '#7A5A17',
  background: '#F7F2F6',
  surface: '#EFE5EF',
  surfaceMuted: '#E7DAE7',
  card: '#FBF8FB',
  text: '#201B20',
  textSecondary: '#5D515D',
  textMuted: '#857685',
  border: '#DCCCDC',
  shadow: '#2E1230',
  error: '#D32F2F',
  success: '#388E3C',
  warning: '#F57C00',
  white: '#FFFFFF',
  black: '#000000',
};

export const DarkColors: AppColors = {
  primary: '#8B1A8F',
  primaryLight: '#C766CB',
  primaryDark: '#8B1A8F',
  accent: '#E4BF68',
  accentDark: '#F2D38A',
  background: '#140E16',
  surface: '#201523',
  surfaceMuted: '#2A1C2D',
  card: '#241828',
  text: '#F8F2F7',
  textSecondary: '#E5D7E3',
  textMuted: '#C6B4C4',
  border: '#5D4761',
  shadow: '#000000',
  error: '#FF7B7B',
  success: '#71D28A',
  warning: '#FFB14A',
  white: '#FFFFFF',
  black: '#000000',
};

export const FontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 22,
  '2xl': 28,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 999,
};

export const Typography = {
  heading: 'Nunito_800ExtraBold',
  headingSemiBold: 'Nunito_700Bold',
  body: 'Nunito_400Regular',
  bodySemiBold: 'Nunito_600SemiBold',
  bodyBold: 'Nunito_700Bold',
};

export function withAlpha(hex: string, alphaHex: string) {
  return `${hex}${alphaHex}`;
}

export function getWebTransitionStyle(properties = 'transform, box-shadow, background-color, border-color, color') {
  if (Platform.OS !== 'web') {
    return null;
  }

  return {
    transitionDuration: '240ms',
    transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
    transitionProperty: properties,
  } as any;
}
