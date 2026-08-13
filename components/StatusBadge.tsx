import React from 'react';
import { Text, View } from 'react-native';

export type FinancialStatus =
  | 'ACTIVE'
  | 'APPROVED'
  | 'COMPLETED'
  | 'SUCCESS'
  | 'VERIFIED'
  | 'PENDING'
  | 'PENDING_APPROVAL'
  | 'UNDER_REVIEW'
  | 'PAUSED'
  | 'MATURED'
  | 'PROCESSING'
  | 'INITIATED'
  | 'IN_PROGRESS'
  | 'FAILED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'SUSPENDED'
  | 'BLOCKED'
  | 'DRAFT'
  | 'CLOSED'
  | string;

export function getStatusTheme(status?: string | null) {
  const norm = String(status || '').toUpperCase();
  switch (norm) {
    case 'ACTIVE':
    case 'APPROVED':
    case 'COMPLETED':
    case 'SUCCESS':
    case 'VERIFIED':
      return { bg: 'bg-emerald-500/15', text: 'text-emerald-700', border: 'border-emerald-500/30' };
    case 'PENDING':
    case 'PENDING_APPROVAL':
    case 'UNDER_REVIEW':
    case 'PAUSED':
      return { bg: 'bg-amber-500/15', text: 'text-amber-700', border: 'border-amber-500/30' };
    case 'MATURED':
      return { bg: 'bg-indigo-500/15', text: 'text-indigo-700', border: 'border-indigo-500/30' };
    case 'PROCESSING':
    case 'INITIATED':
    case 'IN_PROGRESS':
      return { bg: 'bg-blue-500/15', text: 'text-blue-700', border: 'border-blue-500/30' };
    case 'FAILED':
    case 'REJECTED':
    case 'CANCELLED':
    case 'SUSPENDED':
    case 'BLOCKED':
      return { bg: 'bg-rose-500/15', text: 'text-rose-700', border: 'border-rose-500/30' };
    default:
      return { bg: 'bg-slate-500/15', text: 'text-slate-700', border: 'border-slate-500/30' };
  }
}

export default function StatusBadge({ status }: { status?: string | null }) {
  const theme = getStatusTheme(status);
  const label = String(status || 'UNKNOWN').replace('_', ' ').toUpperCase();

  return (
    <View className={`inline-flex flex-row items-center px-2.5 py-1 rounded-full border ${theme.bg} ${theme.border}`}>
      <View className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      <Text className={`text-[10px] font-bold tracking-wider ${theme.text}`}>
        {label}
      </Text>
    </View>
  );
}
