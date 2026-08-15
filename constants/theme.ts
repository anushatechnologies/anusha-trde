import { Platform, TextStyle, ViewStyle } from 'react-native';

export const colors = {
  // Master Obsidian & Luxury Navy
  dark: '#080D1A',
  darkSurface: '#0F172A',
  darkCard: '#131F37',
  darkElevated: '#1E293B',

  // Electric Blue & Sky Cyan Accents
  primary: '#2563EB',
  primaryLight: '#3B82F6',
  cyan: '#38BDF8',
  cyanGlow: 'rgba(56, 189, 248, 0.4)',
  secondary: '#6366F1',
  secondaryLight: '#818CF8',
  tertiary: '#6366F1',

  // Financial Metric Accents
  success: '#10B981',
  successLight: '#34D399',
  successGlow: 'rgba(16, 185, 129, 0.25)',
  warning: '#F59E0B',
  warningLight: '#FBBF24',
  danger: '#EF4444',
  dangerLight: '#F87171',

  // Light & Neutral Tokens
  background: '#080D1A',
  backgroundLight: '#F8FAFC',
  surface: '#FFFFFF',
  text: '#FFFFFF',
  textDark: '#0F172A',
  textSecondary: '#94A3B8',
  muted: '#64748B',
  border: 'rgba(255, 255, 255, 0.12)',
  borderLight: '#E2E8F0',

  // Glassmorphic Tokens
  glassFill: 'rgba(255, 255, 255, 0.05)',
  glassFillDark: 'rgba(15, 23, 42, 0.78)',
  glassFillLight: 'rgba(255, 255, 255, 0.92)',
  glassBorder: 'rgba(255, 255, 255, 0.12)',
  glassBorderLight: 'rgba(255, 255, 255, 0.65)',
  glassBorderCyan: 'rgba(56, 189, 248, 0.35)',
};

export const gradients = {
  primary: ['#2563EB', '#1D4ED8'] as const,
  primaryGlow: ['#38BDF8', '#2563EB', '#1D4ED8'] as const,
  cyanGlow: ['#38BDF8', '#2563EB'] as const,
  emeraldProfit: ['#10B981', '#059669'] as const,
  profitBadge: ['rgba(16, 185, 129, 0.22)', 'rgba(16, 185, 129, 0.06)'] as const,
  amberTier: ['#F59E0B', '#D97706'] as const,
  heroDark: ['#1E3A8A', '#0F172A', '#080D1A'] as const,
  obsidianGlass: ['rgba(15, 23, 42, 0.92)', 'rgba(8, 13, 26, 0.96)'] as const,
  surface: ['#FFFFFF', '#F8FAFC'] as const,
  glass: ['rgba(255, 255, 255, 0.14)', 'rgba(255, 255, 255, 0.03)'] as const,
  wallet: ['#2563EB', '#4F46E5'] as const,
  dark: ['#080D1A', '#0F172A'] as const,
  success: ['#10B981', '#059669'] as const,
};

export const radius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 28,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  compact: 12,
  md: 16,
  card: 20,
  lg: 24,
  xl: 32,
  hero: 40,
};

export const fontFamily = {
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemi: 'Inter_600SemiBold',
  bodyBold: 'Inter_700Bold',
  heading: 'Poppins_700Bold',
  headingSemi: 'Poppins_600SemiBold',
};

export const shadows: Record<'card' | 'soft' | 'glow' | 'glass' | 'profit', ViewStyle> = {
  card: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.35,
      shadowRadius: 20,
    },
    android: {
      elevation: 8,
    },
    default: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.35,
      shadowRadius: 20,
    },
  }) ?? {},
  soft: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.22,
      shadowRadius: 12,
    },
    android: {
      elevation: 4,
    },
    default: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.22,
      shadowRadius: 12,
    },
  }) ?? {},
  glow: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#38BDF8',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.38,
      shadowRadius: 18,
    },
    android: {
      elevation: 10,
    },
    default: {
      shadowColor: '#38BDF8',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.38,
      shadowRadius: 18,
    },
  }) ?? {},
  glass: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
    },
    android: {
      elevation: 6,
    },
    default: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
    },
  }) ?? {},
  profit: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#10B981',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
    },
    android: {
      elevation: 8,
    },
    default: {
      shadowColor: '#10B981',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
    },
  }) ?? {},
};

export const textStyles: Record<'hero' | 'title' | 'section' | 'body' | 'caption', TextStyle> = {
  hero: {
    fontFamily: fontFamily.heading,
    fontSize: 34,
    lineHeight: 42,
    color: colors.text,
    letterSpacing: -0.5,
  },
  title: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 24,
    lineHeight: 32,
    color: colors.text,
  },
  section: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 18,
    lineHeight: 24,
    color: colors.text,
  },
  body: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
  },
  caption: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    lineHeight: 16,
    color: colors.muted,
  },
};
