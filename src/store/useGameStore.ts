import { create } from 'zustand';
import { createChoicesSlice } from './choicesSlice';
import { createDevSlice, type DevSlice } from './devSlice';
import { createInventorySlice } from './inventorySlice';
import { createInvestigationSlice } from './investigationSlice';
import { createJournalSlice, type JournalSlice } from './journalSlice';
import { createNarrativeSlice } from './narrativeSlice';
import { createPersistenceSlice } from './persistenceSlice';
import { createStatsSlice } from './statsSlice';
import { createAudioSlice } from './audioSlice';
import type {
    AudioSlice,
    ChoicesSlice,
    InventorySlice,
    InvestigationSlice,
    NarrativeSlice,
    PersistenceSlice,
    StatsSlice,
    WorldSlice,
} from './types';
import { createWorldSlice } from './worldSlice';

export type GameState = StatsSlice
    & InventorySlice
    & InvestigationSlice
    & ChoicesSlice
    & WorldSlice
    & NarrativeSlice
    & JournalSlice
    & DevSlice
    & PersistenceSlice
    & AudioSlice;

export type {
    ActiveDocumentState,
    Act1Progress,
    Day2Progress,
    ChoiceOption,
    ChoiceConsequences,
    InvestigationConclusion,
    InvestigationFragment,
    Item,
    NarrativeDialogState,
    StatNotification,
} from './types';
export type { NarrativeAttitude, NarrativeTendency } from '../game/helper/ChoiceSystem';

export const useGameStore = create<GameState>()((set, get, store) => ({
    ...createStatsSlice(set, get, store),
    ...createInventorySlice(set, get, store),
    ...createInvestigationSlice(set, get, store),
    ...createChoicesSlice(set, get, store),
    ...createWorldSlice(set, get, store),
    ...createNarrativeSlice(set, get, store),
    ...createJournalSlice(set, get, store),
    ...createDevSlice(set, get, store),
    ...createPersistenceSlice(set, get, store),
    ...createAudioSlice(set, get, store),
}));
