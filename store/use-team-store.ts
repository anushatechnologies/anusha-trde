import { create } from 'zustand';

import { emptyTeamGrowthSeries, emptyTeamLevels, emptyTeamTree } from '../constants/app-defaults';
import { EarningsPoint, TeamLevel, TeamPayload, TeamTreeNode } from '../types';

type TeamStore = {
  totalMembers: number;
  activeMembers: number;
  tree: TeamTreeNode[];
  levels: TeamLevel[];
  weeklyGrowthSeries: EarningsPoint[];
  hydrateFromApi: (payload: TeamPayload) => void;
};

export const useTeamStore = create<TeamStore>((set) => ({
  totalMembers: 0,
  activeMembers: 0,
  tree: emptyTeamTree,
  levels: emptyTeamLevels,
  weeklyGrowthSeries: emptyTeamGrowthSeries,
  hydrateFromApi: (payload) =>
    set({
      totalMembers: payload.totalMembers,
      activeMembers: payload.activeMembers,
      tree: payload.tree,
      levels: payload.levels,
      weeklyGrowthSeries: payload.weeklyGrowthSeries,
    }),
}));
