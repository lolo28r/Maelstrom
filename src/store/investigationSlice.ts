import type { StateCreator } from 'zustand';
import { NIGHTMARE_CONNECTIONS } from '../constants/investigation';
import type { GameState } from './useGameStore';
import type { InvestigationSlice } from './types';

export const createInvestigationSlice: StateCreator<GameState, [], [], InvestigationSlice> = (set, get) => ({
    acquiredFragments: [],
    resolvedConnections: [],
    investigationConclusions: [],
    connectionBoardOpen: false,
    connectionBoardRevision: 0,

    grantFragment: (fragmentId) => set((state) => state.acquiredFragments.includes(fragmentId)
        ? state
        : { acquiredFragments: [...state.acquiredFragments, fragmentId], hasNewJournalEntry: true }),
    hasFragment: (fragmentId) => get().acquiredFragments.includes(fragmentId),
    resolveConnection: (connectionId) => {
        const state = get();
        if (state.resolvedConnections.includes(connectionId)) return true;
        const definition = NIGHTMARE_CONNECTIONS.find((entry) => entry.id === connectionId);
        if (!definition || !definition.requiredFragmentIds.every((id) => state.acquiredFragments.includes(id))) return false;

        const conclusion = {
            id: `conclusion_${connectionId}`,
            connectionId,
            status: definition.status,
            titleKey: definition.titleKey,
            contentKey: definition.contentKey,
            acquiredAt: '1925 - Acte I',
        } as const;
        set((current) => ({
            resolvedConnections: [...current.resolvedConnections, connectionId],
            investigationConclusions: current.investigationConclusions.some((item) => item.id === conclusion.id)
                ? current.investigationConclusions
                : [conclusion, ...current.investigationConclusions],
            hasNewJournalEntry: true,
        }));
        if (definition.consciousnessReward > 0) get().modifyStat('consciousness', definition.consciousnessReward);
        return true;
    },
    hasResolvedConnection: (connectionId) => get().resolvedConnections.includes(connectionId),
    addInvestigationConclusion: (conclusion) => set((state) => state.investigationConclusions.some((item) => item.id === conclusion.id)
        ? state
        : { investigationConclusions: [conclusion, ...state.investigationConclusions], hasNewJournalEntry: true }),
    rejectSuggestion: (suggestionId, titleKey, contentKey) => get().addInvestigationConclusion({
        id: `rejected_${suggestionId}`,
        connectionId: suggestionId,
        status: 'rejected_suggestion',
        titleKey,
        contentKey,
        acquiredAt: '1925 - Acte I',
    }),
    openConnectionBoard: () => set({ connectionBoardOpen: true }),
    completeConnectionBoard: () => set((state) => ({ connectionBoardOpen: false, connectionBoardRevision: state.connectionBoardRevision + 1 })),
});
