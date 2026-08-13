import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontFamily, radius } from '../../constants/theme';
import { SurfaceCard } from '../ui/surface-card';

type ReferralLinkCardProps = {
  link: string;
};

export const ReferralLinkCard = ({ link }: ReferralLinkCardProps) => {
  const [copied, setCopied] = useState(false);
  const hasLink = Boolean(link.trim());

  const handleCopy = async () => {
    if (!hasLink) {
      return;
    }

    await Clipboard.setStringAsync(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <SurfaceCard>
      <Text style={styles.label}>Referral Link</Text>
      <View style={styles.row}>
        <View style={styles.linkWrap}>
          <Text numberOfLines={1} style={styles.link}>
            {hasLink ? link : 'Referral link will appear here once available.'}
          </Text>
        </View>
        <Pressable onPress={handleCopy} style={[styles.copyButton, !hasLink && styles.copyButtonDisabled]} disabled={!hasLink}>
          <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={18} color={colors.surface} />
        </Pressable>
      </View>
      <Text style={styles.helper}>
        {copied
          ? 'Referral link copied'
          : hasLink
            ? 'Share this link to activate direct commissions.'
            : 'No referral link has been generated yet.'}
      </Text>
    </SurfaceCard>
  );
};

const styles = StyleSheet.create({
  label: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 13,
    color: colors.muted,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  linkWrap: {
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
  },
  link: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 13,
    color: colors.text,
  },
  copyButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copyButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  helper: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    color: colors.muted,
  },
});
