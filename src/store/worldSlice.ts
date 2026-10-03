import type { StateCreator } from 'zustand';
import type { GameState } from './useGameStore';
import type { Act1Progress, Day2Progress, WorldSlice } from './types';

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

export const initialDay2Progress: Day2Progress = {
    started: false,
    officeIntroSeen: false,
    asylumVisited: false,
    asylumReceptionBriefed: false,
    roomClues: [],
    disappearanceConfirmed: false,
    suitcaseItems: [],
    fatherEffectsCollected: false,
    cemeteryLeadKnown: false,
    virginMemoryTriggered: false,
    thomasConversationCompleted: false,
    thomasTopicsAsked: [],
    thomasNightDeflectionHeard: false,
    shopkeeperRumorHeard: false,
    cultMeetingKnown: false,
    organicAnomalies: [],
    optionalDiscoveries: [],
    organicShockApplied: false,
    cemeteryVisited: false,
    mausoleumUnlocked: false,
    yithCacheOpened: false,
    futureObjectRecovered: false,
    yithVisionSeen: false,
    finalConnectionsCompleted: false,
    day2Completed: false,
};

export const createWorldSlice: StateCreator<GameState, [], [], WorldSlice> = (set) => ({
    currentScene: 'MainMenu',
    isStatusRevealed: false,
    isSmokingActive: false,
    act1Progress: { ...initialAct1Progress },
    day2Progress: { ...initialDay2Progress },

    setScene: (scene) => set({ currentScene: scene }),
    setStatusRevealed: (revealed) => set({ isStatusRevealed: revealed }),
    setSmokingActive: (active) => set({ isSmokingActive: active, isStatusRevealed: false }),
    updateAct1Progress: (updates) => set((state) => ({
        act1Progress: { ...state.act1Progress, ...updates },
    })),
    updateDay2Progress: (updates) => set((state) => ({
        day2Progress: { ...state.day2Progress, ...updates },
    })),
});
