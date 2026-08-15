import { useState, useRef } from 'react';
import { FlatList, StyleSheet, Text, View, ViewToken } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, fontFamily, gradients, radius, shadows } from '../../constants/theme';
import { Announcement } from '../../types';

type AnnouncementCarouselProps = {
  items: Announcement[];
};

export const AnnouncementCarousel = ({ items }: AnnouncementCarouselProps) => {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!items.length) {
    return null;
  }

  const onViewableItemsChanged = useRef(({
    viewableItems,
  }: {
    viewableItems: ViewToken<Announcement>[];
  }) => {
    if (viewableItems[0]?.index != null) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <View style={styles.card}>
              <LinearGradient
                colors={['#EFF6FF', '#DBEAFE']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.topRow}>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{item.tag || 'UPDATE'}</Text>
                </View>
                <View style={styles.livePulse} />
              </View>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.message}>{item.message}</Text>
            </View>
          </View>
        )}
      />

      {items.length > 1 ? (
        <View style={styles.dots}>
          {items.map((item, index) => (
            <View key={item.id} style={[styles.dot, index === activeIndex && styles.dotActive]} />
          ))}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  cardWrapper: {
    width: 320,
    marginRight: 12,
  },
  card: {
    borderRadius: 20,
    padding: 18,
    gap: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    ...shadows.card,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tag: {
    borderRadius: radius.pill,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 10.5,
    letterSpacing: 0.8,
    color: colors.cyan,
    textTransform: 'uppercase',
  },
  livePulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.successLight,
  },
  title: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 17,
    color: '#FFFFFF',
  },
  message: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  dotActive: {
    width: 20,
    backgroundColor: colors.cyan,
  },
});

