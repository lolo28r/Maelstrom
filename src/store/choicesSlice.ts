import type { StateCreator } from 'zustand';
import { ChoiceSystem, type RecordedChoice } from '../game/helper/ChoiceSystem';
import type { GameState } from './useGameStore';
import { createStatNotification } from './statsSlice';
import type { ChoicesSlice } from './types';

export const createChoicesSlice: StateCreator<GameState, [], [], ChoicesSlice> = (set, get) => ({
    choicesHistory: {},

    recordChoice: (choiceId, currentScene, consequences) => set((state) => {
        const recordedChoice: RecordedChoice = {
            id: choiceId,
            scene: currentScene,
            timestamp: Date.now(),
            consequences: { ...consequences },
            customPayload: consequences.customPayload,
        };

        const mentalDelta = consequences.mentalDelta ?? 0;
        const exhaustionDelta = consequences.exhaustionDelta ?? 0;
        const consciousnessDelta = consequences.consciousnessDelta ?? 0;
        const toast = mentalDelta
            ? createStatNotification('mental', mentalDelta)
            : exhaustionDelta
                ? createStatNotification('exhaustion', exhaustionDelta)
                : consciousnessDelta
                    ? createStatNotification('consciousness', consciousnessDelta)
                    : null;

        return {
            choicesHistory: { ...state.choicesHistory, [choiceId]: recordedChoice },
            mentalHealth: Math.min(100, Math.max(0, state.mentalHealth + mentalDelta)),
            exhaustion: Math.min(100, Math.max(0, state.exhaustion + exhaustionDelta)),
            consciousness: Math.min(100, Math.max(0, state.consciousness + consciousnessDelta)),
            activeToast: toast,
        };
    }),
    hasMadeChoice: (choiceId) => ChoiceSystem.hasMade(get().choicesHistory, choiceId),
    getChoiceInfo: (choiceId) => ChoiceSystem.getChoiceDetails(get().choicesHistory, choiceId),
});
