import type { StateCreator } from 'zustand';
import i18n from '../i18n';
import type { GameState } from './useGameStore';
import type { StatNotification, StatsSlice, StatType } from './types';

const STAT_LABEL_KEYS: Record<StatType, string> = {
    lucidity: 'stats.lucidity',
    consciousness: 'stats.cosmicConsciousness',
};

const getCrisisState = (lucidity: number) => lucidity === 0
    ? 'crisis' as const
    : lucidity <= 30
        ? 'warning' as const
        : 'stable' as const;

export const createStatNotification = (type: StatType, delta: number): StatNotification => ({
    id: Date.now(),
    statName: i18n.t(STAT_LABEL_KEYS[type]),
    delta,
    type,
});

export const createStatsSlice: StateCreator<GameState, [], [], StatsSlice> = (set, get) => ({
    lucidity: 100,
    consciousness: 0,
    crisisState: 'stable',
    crisisSuppressed: false,
    usedAnchors: {},
    activeToast: null,

    modifyStat: (stat, delta) => set((state) => {
        const lucidity = stat === 'lucidity'
            ? Math.min(100, Math.max(0, state.lucidity + delta))
            : state.lucidity;
        const consciousness = stat === 'consciousness'
            ? Math.min(100, Math.max(state.consciousness, state.consciousness + Math.max(0, delta)))
            : state.consciousness;
        return {
            lucidity,
            consciousness,
            crisisState: getCrisisState(lucidity),
            activeToast: delta === 0 ? state.activeToast : createStatNotification(stat, delta),
        };
    }),

    suppressCrisis: () => set({ crisisSuppressed: true }),
    clearCrisisSuppression: () => set({ crisisSuppressed: false }),
    useAnchor: (stageId, anchorId, amount) => {
        if (get().hasUsedAnchor(stageId, anchorId)) return false;
        set((state) => ({
            usedAnchors: {
                ...state.usedAnchors,
                [stageId]: [...(state.usedAnchors[stageId] ?? []), anchorId],
            },
        }));
        get().modifyStat('lucidity', Math.max(0, amount));
        return true;
    },
    hasUsedAnchor: (stageId, anchorId) => (get().usedAnchors[stageId] ?? []).includes(anchorId),

    // Kept for backward compatibility; new code should call modifyStat with a StatType.
    triggerStatChange: (label, direction) => {
        const normalizedLabel = label.toLocaleLowerCase(i18n.language);
        const consciousnessLabel = i18n.t('stats.cosmicConsciousness').toLocaleLowerCase(i18n.language);
        const stat: StatType = normalizedLabel.includes(consciousnessLabel) ? 'consciousness' : 'lucidity';

        get().modifyStat(stat, direction === 'up' ? 10 : -10);
    },

    clearToast: () => set({ activeToast: null }),
});
