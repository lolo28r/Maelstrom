import type { StateCreator } from 'zustand';
import { ChoiceSystem, type RecordedChoice } from '../game/helper/ChoiceSystem';
import type { GameState } from './useGameStore';
import { createStatNotification } from './statsSlice';
import type { ChoicesSlice } from './types';

export const createChoicesSlice: StateCreator<GameState, [], [], ChoicesSlice> = (set, get) => ({
    choicesHistory: {},

    recordChoice: (choiceId, currentScene, consequences) => {
        set((state) => {
            const recordedChoice: RecordedChoice = {
                id: choiceId,
                scene: currentScene,
                timestamp: Date.now(),
                consequences: { ...consequences },
                customPayload: consequences.customPayload,
            };

            const lucidityDelta = consequences.lucidityDelta ?? 0;
            const consciousnessDelta = consequences.consciousnessDelta ?? 0;
            const toast = lucidityDelta
                ? createStatNotification('lucidity', lucidityDelta)
                : consciousnessDelta
                    ? createStatNotification('consciousness', consciousnessDelta)
                    : null;

            const lucidity = Math.min(100, Math.max(0, state.lucidity + lucidityDelta));

            return {
                choicesHistory: { ...state.choicesHistory, [choiceId]: recordedChoice },
                lucidity,
                crisisState: lucidity === 0 ? 'crisis' : lucidity <= 30 ? 'warning' : 'stable',
                consciousness: Math.min(100, state.consciousness + Math.max(0, consciousnessDelta)),
                activeToast: toast,
            };
        });
        get().saveGame();
    },
    hasMadeChoice: (choiceId) => ChoiceSystem.hasMade(get().choicesHistory, choiceId),
    getChoiceInfo: (choiceId) => ChoiceSystem.getChoiceDetails(get().choicesHistory, choiceId),
    getAttitudeScore: (attitude) => ChoiceSystem.getAttitudeScore(get().choicesHistory, attitude),
    getNarrativeTendency: () => ChoiceSystem.getNarrativeTendency(get().choicesHistory),
});
