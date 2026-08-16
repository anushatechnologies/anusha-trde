import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';

import { colors, fontFamily, radius } from '../../constants/theme';
import { GradientButton } from './gradient-button';
import { SurfaceCard } from './surface-card';

type EmptyStateProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  customIcon?: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
};

export const EmptyState = ({
  icon = 'layers-outline',
  customIcon,
  title,
  description,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) => {
  return (
    <SurfaceCard glass="dark" style={[styles.card, style]}>
      <View style={styles.iconTile}>
        {customIcon || <Ionicons name={icon} size={32} color={colors.cyan} />}
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      {actionLabel && onAction ? (
        <GradientButton
          label={actionLabel}
          onPress={onAction}
          compact
          variant="secondary"
          style={styles.btn}
        />
      ) : null}
    </SurfaceCard>
  );
};

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
    gap: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.lg,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconTile: {
    width: 68,
    height: 68,
    borderRadius: 22,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    alignItems: 'center',
    gap: 6,
    maxWidth: 320,
  },
  title: {
    fontFamily: fontFamily.heading,
    fontSize: 17,
    color: '#0F172A',
    textAlign: 'center',
  },
  description: {
    fontFamily: fontFamily.body,
    fontSize: 13.5,
    lineHeight: 20,
    color: '#64748B',
    textAlign: 'center',
  },
  btn: {
    marginTop: 4,
    minWidth: 160,
  },
});
