import type { StateCreator } from 'zustand';
import type { GameState } from './useGameStore';
import type { Act1Progress, TrapezohedronState, WorldSlice } from './types';

export const initialTrapezohedron: TrapezohedronState = {
    acquired: false,
    trueViewActive: false,
};

export const initialAct1Progress: Act1Progress = {
    deskSearched: false,
    journalRead: false,
    letterRead: false,
    secretDrawerUnlocked: false,
    secretLabOpened: false,
    trapezohedronCollected: false,
    priestEncountered: false,
    listenedToDispute: false,
    metMrBell: false,
    cityFatigueTriggered: false,
    storeRationedToday: false,
};

export const createWorldSlice: StateCreator<GameState, [], [], WorldSlice> = (set, get) => ({
    currentScene: 'MainMenu',
    trapezohedron: { ...initialTrapezohedron },
    isStatusRevealed: false,
    isSmokingActive: false,
    act1Progress: { ...initialAct1Progress },

    setScene: (scene) => set({ currentScene: scene }),
    setTrapezohedronAcquired: (acquired) => set((state) => ({
        trapezohedron: { ...state.trapezohedron, acquired },
    })),
    toggleTrueView: () => {
        const active = !get().trapezohedron.trueViewActive;
        get().modifyStat('consciousness', active ? 3 : -3);
        set((state) => ({ trapezohedron: { ...state.trapezohedron, trueViewActive: active } }));
    },
    setTrueView: (active) => set((state) => ({
        trapezohedron: { ...state.trapezohedron, trueViewActive: active },
    })),
    setStatusRevealed: (revealed) => set({ isStatusRevealed: revealed }),
    setSmokingActive: (active) => set({ isSmokingActive: active }),
    updateAct1Progress: (updates) => set((state) => ({
        act1Progress: { ...state.act1Progress, ...updates },
    })),
});
