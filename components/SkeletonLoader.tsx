import React from 'react';
import { View } from 'react-native';

export function CardSkeleton() {
  return (
    <View className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm animate-pulse space-y-3">
      <View className="h-4 w-1/3 bg-slate-200 rounded" />
      <View className="h-7 w-1/2 bg-slate-200 rounded" />
      <View className="h-3 w-1/4 bg-slate-200 rounded" />
    </View>
  );
}

export function ListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View className="space-y-3">
      {Array.from({ length: count }).map((_, idx) => (
        <View key={idx} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm animate-pulse flex-row items-center justify-between">
          <View className="space-y-2 flex-1">
            <View className="h-4 w-1/2 bg-slate-200 rounded" />
            <View className="h-3 w-1/3 bg-slate-200 rounded" />
          </View>
          <View className="h-8 w-16 bg-slate-200 rounded-lg" />
        </View>
      ))}
    </View>
  );
}
