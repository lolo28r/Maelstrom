import type { StateCreator } from 'zustand';
import type { GameState } from './useGameStore';
import type { PersistenceSlice } from './types';
import { initialAct1Progress, initialTrapezohedron } from './worldSlice';

const SAVE_KEY = 'maelstrom_save_v1';

type SavedGame = Partial<Pick<GameState,
    | 'mentalHealth'
    | 'exhaustion'
    | 'consciousness'
    | 'currentScene'
    | 'inventory'
    | 'trapezohedron'
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
                mentalHealth: state.mentalHealth,
                exhaustion: state.exhaustion,
                consciousness: state.consciousness,
                currentScene: state.currentScene,
                inventory: state.inventory,
                trapezohedron: state.trapezohedron,
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
                mentalHealth: data.mentalHealth ?? 100,
                exhaustion: data.exhaustion ?? 0,
                consciousness: data.consciousness ?? 0,
                currentScene: data.currentScene ?? 'ProfessorOffice',
                inventory: data.inventory ?? [],
                selectedItem: null,
                trapezohedron: data.trapezohedron ?? { ...initialTrapezohedron },
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
        mentalHealth: 100,
        exhaustion: 0,
        consciousness: 0,
        activeToast: null,
        currentScene: 'MainMenu',
        inventory: [],
        selectedItem: null,
        isInventoryLocked: true,
        choicesHistory: {},
        trapezohedron: { ...initialTrapezohedron },
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
