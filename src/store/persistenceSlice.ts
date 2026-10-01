import type { StateCreator } from 'zustand';
import type { GameState } from './useGameStore';
import type { PersistenceSlice } from './types';
import { initialAct1Progress } from './worldSlice';

const SAVE_KEY = 'maelstrom_save_v2';

type SavedGame = Partial<Pick<GameState,
    | 'lucidity'
    | 'consciousness'
    | 'crisisState'
    | 'crisisSuppressed'
    | 'usedAnchors'
    | 'acquiredFragments'
    | 'resolvedConnections'
    | 'investigationConclusions'
    | 'currentScene'
    | 'inventory'
    | 'act1Progress'
    | 'choicesHistory'
    | 'journalUnlocked'
    | 'currentDate'
    | 'notes'
    | 'discoveredKeywords'
    | 'documents'
>>;

export const createPersistenceSlice: StateCreator<GameState, [], [], PersistenceSlice> = (set, get) => ({
    saveGame: () => {
        try {
            const state = get();
            const saveData: SavedGame = {
                lucidity: state.lucidity,
                consciousness: state.consciousness,
                crisisState: state.crisisState,
                crisisSuppressed: state.crisisSuppressed,
                usedAnchors: state.usedAnchors,
                acquiredFragments: state.acquiredFragments,
                resolvedConnections: state.resolvedConnections,
                investigationConclusions: state.investigationConclusions,
                currentScene: state.currentScene,
                inventory: state.inventory,
                act1Progress: state.act1Progress,
                choicesHistory: state.choicesHistory,
                journalUnlocked: state.journalUnlocked,
                currentDate: state.currentDate,
                notes: state.notes,
                discoveredKeywords: state.discoveredKeywords,
                documents: state.documents,
            };
            localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
        } catch (error) {
            console.warn('Unable to save the game locally:', error);
        }
    },

    loadGame: () => {
        try {
            const serializedData = localStorage.getItem(SAVE_KEY);
            if (!serializedData) return false;

            const data = JSON.parse(serializedData) as SavedGame;
            set({
                lucidity: data.lucidity ?? 100,
                consciousness: data.consciousness ?? 0,
                crisisState: data.crisisState ?? 'stable',
                crisisSuppressed: data.crisisSuppressed ?? false,
                usedAnchors: data.usedAnchors ?? {},
                acquiredFragments: data.acquiredFragments ?? [],
                resolvedConnections: data.resolvedConnections ?? [],
                investigationConclusions: data.investigationConclusions ?? [],
                connectionBoardOpen: false,
                connectionBoardRevision: 0,
                currentScene: data.currentScene ?? 'ProfessorOffice',
                inventory: data.inventory ?? [],
                selectedItem: null,
                act1Progress: data.act1Progress ?? { ...initialAct1Progress },
                choicesHistory: data.choicesHistory ?? {},
                journalUnlocked: data.journalUnlocked ?? false,
                currentDate: data.currentDate ?? get().currentDate,
                notes: data.notes ?? [],
                discoveredKeywords: data.discoveredKeywords ?? [],
                documents: data.documents ?? [],
                pendingNote: null,
                hasNewJournalEntry: false,
                isStatusRevealed: false,
                isSmokingActive: false,
                isInventoryLocked: false,
                activeToast: null,
                currentDialog: null,
                activeDocument: null,
                isEyelidsClosing: false,
            });
            return true;
        } catch (error) {
            console.warn('Unable to load the local save:', error);
            return false;
        }
    },

    hasSave: () => localStorage.getItem(SAVE_KEY) !== null,

    resetGame: () => set({
        lucidity: 100,
        consciousness: 0,
        crisisState: 'stable',
        crisisSuppressed: false,
        usedAnchors: {},
        acquiredFragments: [],
        resolvedConnections: [],
        investigationConclusions: [],
        connectionBoardOpen: false,
        connectionBoardRevision: 0,
        activeToast: null,
        currentScene: 'MainMenu',
        inventory: [],
        selectedItem: null,
        isInventoryLocked: true,
        choicesHistory: {},
        isStatusRevealed: false,
        isSmokingActive: false,
        act1Progress: { ...initialAct1Progress },
        currentDialog: null,
        activeDocument: null,
        isEyelidsClosing: false,
        journalUnlocked: false,
        notes: [],
        discoveredKeywords: [],
        documents: [],
        pendingNote: null,
        hasNewJournalEntry: false,
    }),
});
