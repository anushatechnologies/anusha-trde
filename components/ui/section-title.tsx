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
    fontFamily: fontFamily.heading,
    fontSize: 18,
    lineHeight: 24,
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontFamily: fontFamily.body,
    fontSize: 12.5,
    color: '#64748B',
  },
  actionWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  actionPressed: {
    opacity: 0.8,
  },
  action: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 12.5,
    color: colors.primary,
  },
});
