import { Platform, TextStyle, ViewStyle } from 'react-native';

export const colors = {
  // 1. Light Premium Fintech Backgrounds & Surfaces (70% White / Off-White, 20% Neutral)
  background: '#F7F8FA',
  backgroundAlt: '#F9FAFB',
  surface: '#FFFFFF',
  surfaceSecondary: '#F8FAFC',
  surfaceSubtle: '#F1F5F9',
  surfaceSelected: '#EFF6FF',

  // Dark & Charcoal Typography (5% Charcoal / Black)
  dark: '#111827',
  darkSurface: '#1F2937',
  darkCard: '#FFFFFF',
  darkElevated: '#F8FAFC',

  // Text Hierarchy
  text: '#111827',
  textDark: '#111827',
  textHeading: '#111827',
  textSection: '#1F2937',
  textBody: '#4B5563',
  textSecondary: '#6B7280',
  muted: '#9CA3AF',
  disabled: '#D1D5DB',

  // Borders & Dividers
  border: '#E5E7EB',
  borderInput: '#D1D5DB',
  borderLight: '#F3F4F6',
  borderDark: '#E5E7EB',

  // 2. Primary Accent: Fintech Blue (#2563EB) — (5% Sparingly used for CTAs, selected tab, links)
  primary: '#2563EB',
  primaryLight: '#3B82F6',
  primaryDark: '#1D4ED8',
  primaryBg: '#EFF6FF',
  primaryBadgeBg: '#DBEAFE',
  primaryBadgeText: '#1E40AF',
  cyan: '#2563EB',
  cyanGlow: 'rgba(37, 99, 235, 0.15)',
  secondary: '#4B5563',
  secondaryLight: '#6B7280',
  tertiary: '#6B7280',

  // 3. Profit / Success Green (#16A34A)
  success: '#16A34A',
  successLight: '#22C55E',
  successBg: '#F0FDF4',
  successBadgeBg: '#DCFCE7',
  successBadgeText: '#166534',
  successGlow: 'rgba(22, 163, 74, 0.15)',

  // 4. Loss / Negative / Error Red (#DC2626)
  danger: '#DC2626',
  dangerLight: '#EF4444',
  dangerBg: '#FEF2F2',
  dangerBadgeBg: '#FEE2E2',
  dangerBadgeText: '#991B1B',

  // 5. Warning / Pending Amber (#D97706)
  warning: '#D97706',
  warningLight: '#F59E0B',
  warningBg: '#FFFBEB',
  warningBadgeBg: '#FEF3C7',
  warningBadgeText: '#92400E',

  // Overlays & Modal Tokens
  modalOverlay: 'rgba(17, 24, 39, 0.45)',
  glassFill: '#FFFFFF',
  glassFillDark: '#FFFFFF',
  glassFillLight: '#FFFFFF',
  glassBorder: '#E5E7EB',
  glassBorderLight: '#E5E7EB',
  glassBorderCyan: '#2563EB',
};

export const gradients = {
  primary: ['#2563EB', '#1D4ED8'] as const,
  primaryGlow: ['#2563EB', '#1D4ED8'] as const,
  cyanGlow: ['#2563EB', '#1D4ED8'] as const,
  emeraldProfit: ['#16A34A', '#15803D'] as const,
  profitBadge: ['#DCFCE7', '#F0FDF4'] as const,
  amberTier: ['#D97706', '#B45309'] as const,
  heroDark: ['#FFFFFF', '#F8FAFC'] as const,
  obsidianGlass: ['#FFFFFF', '#FFFFFF'] as const,
  surface: ['#FFFFFF', '#FFFFFF'] as const,
  glass: ['#FFFFFF', '#FFFFFF'] as const,
  wallet: ['#FFFFFF', '#FFFFFF'] as const,
  dark: ['#F7F8FA', '#F7F8FA'] as const,
  success: ['#16A34A', '#15803D'] as const,
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

// Subtle, clean fintech shadows
export const shadows: Record<'card' | 'soft' | 'glow' | 'glass' | 'profit', ViewStyle> = {
  card: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
    },
    android: {
      elevation: 2,
    },
    default: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
    },
  }) ?? {},
  soft: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
    },
    android: {
      elevation: 1,
    },
    default: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
    },
  }) ?? {},
  glow: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#2563EB',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
    },
    android: {
      elevation: 3,
    },
    default: {
      shadowColor: '#2563EB',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 10,
    },
  }) ?? {},
  glass: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
    },
    android: {
      elevation: 2,
    },
    default: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
    },
  }) ?? {},
  profit: Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#16A34A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
    },
    android: {
      elevation: 2,
    },
    default: {
      shadowColor: '#16A34A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 6,
    },
  }) ?? {},
};

export const textStyles: Record<'hero' | 'title' | 'section' | 'body' | 'caption', TextStyle> = {
  hero: {
    fontFamily: fontFamily.heading,
    fontSize: 32,
    lineHeight: 40,
    color: colors.text,
    letterSpacing: -0.5,
  },
  title: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 22,
    lineHeight: 28,
    color: colors.text,
  },
  section: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 17,
    lineHeight: 22,
    color: colors.textSection,
  },
  body: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textBody,
  },
  caption: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
};
