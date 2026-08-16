import React, { useState, useRef } from 'react';
import { FlatList, StyleSheet, Text, View, ViewToken } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, fontFamily, radius, shadows } from '../../constants/theme';
import { Announcement } from '../../types';

type AnnouncementCarouselProps = {
  items: Announcement[];
};

export const AnnouncementCarousel = React.memo(({ items }: AnnouncementCarouselProps) => {
  const [activeIndex, setActiveIndex] = useState(0);

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

  if (!items || !items.length) {
    return null;
  }

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
                <View style={styles.liveDot} />
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
});

const styles = StyleSheet.create({
  container: {
    gap: 10,
    width: '100%',
  },
  cardWrapper: {
    width: 320,
    marginRight: 12,
  },
  card: {
    borderRadius: 20,
    padding: 16,
    gap: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tag: {
    borderRadius: radius.pill,
    backgroundColor: '#DBEAFE',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  tagText: {
    fontFamily: fontFamily.bodyBold,
    fontSize: 10.5,
    letterSpacing: 0.8,
    color: colors.primary,
    textTransform: 'uppercase',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  title: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 16,
    color: '#0F172A',
  },
  message: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 19,
    color: '#475569',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  dotActive: {
    width: 18,
    backgroundColor: colors.primary,
  },
});
