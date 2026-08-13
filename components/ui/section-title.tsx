import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontFamily } from '../../constants/theme';

type SectionTitleProps = {
  title: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

export const SectionTitle = ({ title, actionLabel, onActionPress }: SectionTitleProps) => (
  <View style={styles.container}>
    <Text style={styles.title}>{title}</Text>
    {actionLabel ? (
      <Pressable onPress={onActionPress}>
        <Text style={styles.action}>{actionLabel}</Text>
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
  },
  title: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 20,
    color: colors.text,
  },
  action: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 13,
    color: colors.primary,
  },
});
