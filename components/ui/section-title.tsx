import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontFamily } from '../../constants/theme';

type SectionTitleProps = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

export const SectionTitle = ({
  title,
  subtitle,
  actionLabel,
  onActionPress,
}: SectionTitleProps) => (
  <View style={styles.container}>
    <View style={styles.lead}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>

    {actionLabel ? (
      <Pressable
        onPress={onActionPress}
        style={({ pressed }) => [styles.actionWrap, pressed && styles.actionPressed]}
      >
        <Text style={styles.action}>{actionLabel}</Text>
        <Ionicons name="chevron-forward" size={13} color={colors.cyan} />
      </Pressable>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  lead: {
    gap: 2,
    flex: 1,
  },
  title: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 18,
    lineHeight: 24,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontFamily: fontFamily.body,
    fontSize: 12.5,
    color: colors.textSecondary,
  },
  actionWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.10)',
  },
  actionPressed: {
    opacity: 0.8,
  },
  action: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12.5,
    color: colors.cyan,
  },
});
