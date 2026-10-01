import type { StateCreator } from 'zustand';
import type { GameState } from './useGameStore';
import type { Act1Progress, WorldSlice } from './types';

export const initialAct1Progress: Act1Progress = {
    deskSearched: false,
    journalRead: false,
    letterRead: false,
    secretDrawerUnlocked: false,
    secretLabOpened: false,
    priestEncountered: false,
    listenedToDispute: false,
    metMrBell: false,
    cityFatigueTriggered: false,
    storeRationedToday: false,
    bellTopicsHeard: [],
};

export const createWorldSlice: StateCreator<GameState, [], [], WorldSlice> = (set) => ({
    currentScene: 'MainMenu',
    isStatusRevealed: false,
    isSmokingActive: false,
    act1Progress: { ...initialAct1Progress },

    setScene: (scene) => set({ currentScene: scene }),
    setStatusRevealed: (revealed) => set({ isStatusRevealed: revealed }),
    setSmokingActive: (active) => set({ isSmokingActive: active }),
    updateAct1Progress: (updates) => set((state) => ({
        act1Progress: { ...state.act1Progress, ...updates },
    })),
});
