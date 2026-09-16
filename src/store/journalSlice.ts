import { StateCreator } from 'zustand';
import { GameState } from './useGameStore';

export interface JournalNote {
    id: string;
    title: string;
    content: string;
    timestamp: string;
}

export interface InvestigationKeyword {
    id: string;
    label: string;
    discovered: boolean;
}

export interface ArchivedDocument {
    id: string;
    title: string;
    content: string;
    timestamp: string;
}

export interface JournalSlice {
    journalUnlocked: boolean;
    currentDate: string; // <-- Ajout de la date actuelle (ex: "20 Janvier 1925")
    notes: JournalNote[];
    discoveredKeywords: InvestigationKeyword[];
    documents: ArchivedDocument[];
    pendingNote: { title: string; content: string; timestamp: string; } | null;
    hasNewJournalEntry: boolean;

    unlockJournal: () => void;
    setCurrentDate: (date: string) => void; // <-- Permet de changer de jour si besoin
    addJournalNote: (title: string, content: string, timestamp: string) => void;
    addInvestigationKeyword: (id: string, label: string) => void;
    addArchivedDocument: (id: string, title: string, content: string, timestamp: string) => void;
    silentAddArchivedDocument: (id: string, title: string, content: string, timestamp: string) => void;
    commitPendingNote: () => void;
    markJournalAsRead: () => void;
}

export const createJournalSlice: StateCreator<GameState, [], [], JournalSlice> = (set) => ({
    journalUnlocked: false,
    currentDate: "20 Janvier 1925", // <-- Initialisation au premier jour de l'enquête
    notes: [],
    discoveredKeywords: [],
    documents: [],
    pendingNote: null,
    hasNewJournalEntry: false,

    unlockJournal: () => set({ journalUnlocked: true }),

    setCurrentDate: (date) => set({ currentDate: date }),

    addJournalNote: (title, content, timestamp) => set({
        pendingNote: { title, content, timestamp },
        hasNewJournalEntry: true,
    }),

    addInvestigationKeyword: (id, label) => set((state) => {
        if (state.discoveredKeywords.some((k) => k.id === id)) state;
        return {
            discoveredKeywords: [...state.discoveredKeywords, { id, label, discovered: true }],
            hasNewJournalEntry: true,
        };
    }),

    addArchivedDocument: (id, title, content, timestamp) => set((state) => {
        if (state.documents.some((doc) => doc.id === id)) return state;
        return {
            documents: [{ id, title, content, timestamp }, ...state.documents],
            hasNewJournalEntry: true,
        };
    }),

    silentAddArchivedDocument: (id, title, content, timestamp) => set((state) => {
        if (state.documents.some((doc) => doc.id === id)) return state;
        return {
            documents: [{ id, title, content, timestamp }, ...state.documents],
        };
    }),

    commitPendingNote: () => set((state) => {
        if (!state.pendingNote) return state;
        const newNote: JournalNote = {
            id: Date.now().toString(),
            ...state.pendingNote,
        };
        return {
            notes: [newNote, ...state.notes],
            pendingNote: null,
            hasNewJournalEntry: false,
        };
    }),

    markJournalAsRead: () => set({ hasNewJournalEntry: false }),
});