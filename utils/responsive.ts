import { PixelRatio, Platform, useWindowDimensions } from 'react-native';

export const useResponsive = () => {
  const { width: windowWidth, height } = useWindowDimensions();
  // On web, we force the max-width to 440px in CSS, so the actual layout width is never more than 440px.
  // We use this restricted width to calculate isTablet.
  const width = Platform.OS === 'web' ? Math.min(windowWidth, 440) : windowWidth;
  const isTablet = width >= 768;

  return {
    width,
    height,
    isTablet,
    horizontalPadding: isTablet ? 28 : 20,
    contentMaxWidth: isTablet ? 960 : width,
  };
};

export const scaleFont = (size: number) => {
  const scale = Math.min(PixelRatio.getFontScale(), 1.2);
  return Math.round(size * scale);
};
