import type { StateCreator } from 'zustand';
import i18n from '../i18n';
import type { GameState } from './useGameStore';
import type { StatNotification, StatsSlice, StatType } from './types';

const STAT_LABEL_KEYS: Record<StatType, string> = {
    mental: 'stats.mentalHealth',
    exhaustion: 'stats.exhaustion',
    consciousness: 'stats.cosmicConsciousness',
};

export const createStatNotification = (type: StatType, delta: number): StatNotification => ({
    id: Date.now(),
    statName: i18n.t(STAT_LABEL_KEYS[type]),
    delta,
    type,
});

export const createStatsSlice: StateCreator<GameState, [], [], StatsSlice> = (set, get) => ({
    mentalHealth: 100,
    exhaustion: 0,
    consciousness: 0,
    activeToast: null,

    modifyStat: (stat, delta) => set((state) => ({
        mentalHealth: stat === 'mental'
            ? Math.min(100, Math.max(0, state.mentalHealth + delta))
            : state.mentalHealth,
        exhaustion: stat === 'exhaustion'
            ? Math.min(100, Math.max(0, state.exhaustion + delta))
            : state.exhaustion,
        consciousness: stat === 'consciousness'
            ? Math.min(100, Math.max(0, state.consciousness + delta))
            : state.consciousness,
        activeToast: createStatNotification(stat, delta),
    })),

    // Kept for backward compatibility; new code should call modifyStat with a StatType.
    triggerStatChange: (label, direction) => {
        const normalizedLabel = label.toLocaleLowerCase(i18n.language);
        const exhaustionLabels = [i18n.t('stats.exhaustion'), i18n.t('stats.fatigue')]
            .map((value) => value.toLocaleLowerCase(i18n.language));
        const consciousnessLabel = i18n.t('stats.cosmicConsciousness').toLocaleLowerCase(i18n.language);
        const stat: StatType = exhaustionLabels.some((value) => normalizedLabel.includes(value))
            ? 'exhaustion'
            : normalizedLabel.includes(consciousnessLabel)
                ? 'consciousness'
                : 'mental';

        get().modifyStat(stat, direction === 'up' ? 10 : -10);
    },

    clearToast: () => set({ activeToast: null }),
});
