import { useState, useRef } from 'react';
import { FlatList, StyleSheet, Text, View, ViewToken } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, fontFamily, gradients, radius } from '../../constants/theme';
import { Announcement } from '../../types';

type AnnouncementCarouselProps = {
  items: Announcement[];
};

export const AnnouncementCarousel = ({ items }: AnnouncementCarouselProps) => {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!items.length) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={gradients.surface} style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Announcements</Text>
          <Text style={styles.emptyMessage}>No announcements available right now.</Text>
        </LinearGradient>
      </View>
    );
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
          <LinearGradient colors={gradients.primary} style={styles.card}>
            <Text style={styles.tag}>{item.tag}</Text>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.message}>{item.message}</Text>
          </LinearGradient>
        )}
      />

      <View style={styles.dots}>
        {items.map((item, index) => (
          <View key={item.id} style={[styles.dot, index === activeIndex && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  card: {
    width: 320,
    borderRadius: radius.md,
    padding: 18,
    gap: 8,
  },
  emptyCard: {
    borderRadius: radius.md,
    padding: 18,
    gap: 8,
  },
  emptyTitle: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 18,
    color: colors.text,
  },
  emptyMessage: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 20,
    color: colors.muted,
  },
  tag: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontFamily: fontFamily.bodyBold,
    fontSize: 11,
    color: colors.surface,
  },
  title: {
    fontFamily: fontFamily.headingSemi,
    fontSize: 18,
    color: colors.surface,
  },
  message: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.84)',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CBD5E1',
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.primary,
  },
});
