import { create } from 'zustand';
import { createChoicesSlice } from './choicesSlice';
import { createDevSlice, type DevSlice } from './devSlice';
import { createInventorySlice } from './inventorySlice';
import { createJournalSlice, type JournalSlice } from './journalSlice';
import { createNarrativeSlice } from './narrativeSlice';
import { createPersistenceSlice } from './persistenceSlice';
import { createStatsSlice } from './statsSlice';
import type {
    ChoicesSlice,
    InventorySlice,
    NarrativeSlice,
    PersistenceSlice,
    StatsSlice,
    WorldSlice,
} from './types';
import { createWorldSlice } from './worldSlice';

export type GameState = StatsSlice
    & InventorySlice
    & ChoicesSlice
    & WorldSlice
    & NarrativeSlice
    & JournalSlice
    & DevSlice
    & PersistenceSlice;

export type {
    ActiveDocumentState,
    Act1Progress,
    ChoiceOption,
    Item,
    NarrativeDialogState,
    StatNotification,
    TrapezohedronState,
} from './types';

export const useGameStore = create<GameState>()((set, get, store) => ({
    ...createStatsSlice(set, get, store),
    ...createInventorySlice(set, get, store),
    ...createChoicesSlice(set, get, store),
    ...createWorldSlice(set, get, store),
    ...createNarrativeSlice(set, get, store),
    ...createJournalSlice(set, get, store),
    ...createDevSlice(set, get, store),
    ...createPersistenceSlice(set, get, store),
}));
