import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontFamily, radius, shadows } from '../../constants/theme';
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
    <SurfaceCard glass="dark">
      <View style={styles.headerRow}>
        <Text style={styles.label}>YOUR REFERRAL LINK</Text>
        {copied ? (
          <View style={styles.copiedBadge}>
            <Ionicons name="checkmark-circle" size={13} color={colors.successLight} />
            <Text style={styles.copiedBadgeText}>Copied</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.row}>
        <View style={styles.linkWrap}>
          <Text numberOfLines={1} style={styles.link}>
            {hasLink ? link : 'Referral link will appear here once available.'}
          </Text>
        </View>
        <Pressable
          onPress={handleCopy}
          style={({ pressed }) => [
            styles.copyButton,
            !hasLink && styles.copyButtonDisabled,
            pressed && styles.copyButtonPressed,
          ]}
          disabled={!hasLink}
        >
          <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={18} color="#FFFFFF" />
        </Pressable>
      </View>
      <Text style={styles.helper}>
        {hasLink
          ? 'Share with partners to earn 6-level network commission bonuses.'
          : 'No referral link has been generated yet.'}
      </Text>
    </SurfaceCard>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.cyan,
    textTransform: 'uppercase',
  },
  copiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
  },
  copiedBadgeText: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 11,
    color: colors.successLight,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
    marginBottom: 4,
  },
  linkWrap: {
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    ...shadows.glass,
  },
  link: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 13,
    color: colors.cyan,
  },
  copyButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    ...shadows.glow,
  },
  copyButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.96 }],
  },
  copyButtonDisabled: {
    backgroundColor: '#334155',
    borderColor: 'transparent',
  },
  helper: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
  },
});

