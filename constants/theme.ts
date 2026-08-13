import { Platform, TextStyle, ViewStyle } from 'react-native';

export const colors = {
  primary: '#1E40FF',
  secondary: '#4F46E5',
  tertiary: '#6A5CFF',
  background: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#0F172A',
  muted: '#64748B',
  border: '#E2E8F0',
  success: '#22C55E',
  danger: '#EF4444',
  warning: '#F59E0B',
  dark: '#08112B',
  darkAlt: '#132056',
};

export const gradients = {
  primary: [colors.primary, colors.secondary, colors.tertiary] as const,
  surface: ['#FFFFFF', '#F5F8FF'] as const,
  glass: ['rgba(255,255,255,0.22)', 'rgba(255,255,255,0.08)'] as const,
  wallet: ['#0F4CFF', '#4F46E5'] as const,
  dark: ['#08112B', '#162D7A'] as const,
  success: ['#22C55E', '#16A34A'] as const,
};

export const radius = {
  sm: 14,
  md: 20,
  lg: 28,
  xl: 34,
  pill: 999,
};

export const spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

export const fontFamily = {
  body: 'Inter_400Regular',
  bodySemi: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
  heading: 'Poppins_700Bold',
  headingSemi: 'Poppins_600SemiBold',
};

export const shadows: Record<'card' | 'soft' | 'glow', ViewStyle> = {
  card: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#1E293B',
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.08,
      shadowRadius: 24,
    },
    android: {
      elevation: 10,
    },
    default: {
      shadowColor: '#1E293B',
      shadowOffset: { width: 0, height: 14 },
      shadowOpacity: 0.08,
      shadowRadius: 24,
    },
  }) ?? {},
  soft: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.05,
      shadowRadius: 18,
    },
    android: {
      elevation: 5,
    },
    default: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.05,
      shadowRadius: 18,
    },
  }) ?? {},
  glow: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#4F46E5',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.24,
      shadowRadius: 24,
    },
    android: {
      elevation: 12,
    },
    default: {
      shadowColor: '#4F46E5',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.24,
      shadowRadius: 24,
    },
  }) ?? {},
};

export const textStyles: Record<'title' | 'section' | 'body' | 'caption', TextStyle> = {
  title: {
    fontFamily: fontFamily.heading,
    fontSize: 30,
    lineHeight: 38,
    color: colors.text,
  },
  section: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 20,
    lineHeight: 26,
    color: colors.text,
  },
  body: {
    fontFamily: fontFamily.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text,
  },
  caption: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    lineHeight: 16,
    color: colors.muted,
  },
};
