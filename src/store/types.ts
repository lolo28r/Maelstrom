import type { NarrativeAttitude, NarrativeTendency, RecordedChoice } from '../game/helper/ChoiceSystem';

export type StatType = 'lucidity' | 'consciousness';

export type CrisisState = 'stable' | 'warning' | 'crisis';
export type FragmentKind = 'memory' | 'observation' | 'testimony' | 'document' | 'vision';
export type ConclusionStatus = 'fact' | 'hypothesis' | 'fragile' | 'suggestion' | 'rejected_suggestion';

export interface InvestigationFragment {
    id: string;
    kind: FragmentKind;
    titleKey: string;
    contentKey: string;
    sourceKey: string;
}

export interface InvestigationConclusion {
    id: string;
    connectionId: string;
    status: ConclusionStatus;
    titleKey: string;
    contentKey: string;
    acquiredAt: string;
}

export interface Item {
    id: string;
    name: string;
    icon: string;
    description: string;
    examineText: string;
    quantity?: number;
    stackable?: boolean;
    consumable?: boolean;
}

export interface ChoiceConsequences {
    lucidityDelta?: number;
    consciousnessDelta?: number;
    attitudeTag?: NarrativeAttitude;
    attitudeTags?: NarrativeAttitude[];
    customPayload?: string | number;
}

export interface ChoiceOption {
    id: string;
    text: string;
    consequences: ChoiceConsequences;
    requiredFlag?: string;
}

export interface NarrativeDialogState {
    textKey: string;
    type?: 'bottom' | 'center';
    speaker?: string;
    choices?: ChoiceOption[];
    onSelectChoice?: (choice: ChoiceOption) => void;
    onComplete?: (selectedChoiceId?: string) => void;
}

export interface ActiveDocumentState {
    title: string;
    content: string;
    onClose?: () => void;
}

export interface Act1Progress {
    deskSearched: boolean;
    journalRead: boolean;
    letterRead: boolean;
    secretDrawerUnlocked: boolean;
    secretLabOpened: boolean;
    priestEncountered?: boolean;
    listenedToDispute?: boolean;
    metMrBell?: boolean;
    cityFatigueTriggered?: boolean;
    storeRationedToday?: boolean;
    bellTopicsHeard: string[];
}

export interface Day2Progress {
    started: boolean;
    officeIntroSeen: boolean;
    asylumVisited: boolean;
    asylumReceptionBriefed: boolean;
    roomClues: string[];
    disappearanceConfirmed: boolean;
    suitcaseItems: string[];
    fatherEffectsCollected: boolean;
    cemeteryLeadKnown: boolean;
    virginMemoryTriggered: boolean;
    thomasConversationCompleted: boolean;
    thomasTopicsAsked: string[];
    thomasNightDeflectionHeard: boolean;
    shopkeeperRumorHeard: boolean;
    cultMeetingKnown: boolean;
    organicAnomalies: string[];
    optionalDiscoveries: string[];
    organicShockApplied: boolean;
    cemeteryVisited: boolean;
    mausoleumUnlocked: boolean;
    yithCacheOpened: boolean;
    futureObjectRecovered: boolean;
    yithVisionSeen: boolean;
    finalConnectionsCompleted: boolean;
    day2Completed: boolean;
}

export interface StatNotification {
    id: number;
    statName: string;
    delta: number;
    type: StatType;
}

export interface StatsSlice {
    lucidity: number;
    consciousness: number;
    crisisState: CrisisState;
    crisisSuppressed: boolean;
    usedAnchors: Record<string, string[]>;
    activeToast: StatNotification | null;
    modifyStat: (stat: StatType, delta: number) => void;
    suppressCrisis: () => void;
    clearCrisisSuppression: () => void;
    useAnchor: (stageId: string, anchorId: string, amount: number) => boolean;
    hasUsedAnchor: (stageId: string, anchorId: string) => boolean;
    triggerStatChange: (label: string, type: 'up' | 'down', color: 'red' | 'green' | 'purple') => void;
    clearToast: () => void;
}

export interface InvestigationSlice {
    acquiredFragments: string[];
    resolvedConnections: string[];
    investigationConclusions: InvestigationConclusion[];
    connectionBoardOpen: boolean;
    connectionBoardScope: 'nightmare' | 'day2';
    connectionBoardRevision: number;
    grantFragment: (fragmentId: string) => void;
    hasFragment: (fragmentId: string) => boolean;
    resolveConnection: (connectionId: string) => boolean;
    hasResolvedConnection: (connectionId: string) => boolean;
    addInvestigationConclusion: (conclusion: InvestigationConclusion) => void;
    upsertInvestigationConclusion: (conclusion: InvestigationConclusion) => void;
    rejectSuggestion: (suggestionId: string, titleKey: string, contentKey: string) => void;
    openConnectionBoard: (scope?: 'nightmare' | 'day2') => void;
    closeConnectionBoard: () => void;
    completeConnectionBoard: () => void;
}

export interface InventorySlice {
    inventory: Item[];
    selectedItem: Item | null;
    isInventoryLocked: boolean;
    setSelectedItem: (item: Item | null) => void;
    addItem: (item: Item) => void;
    removeItem: (itemId: string) => void;
    removeItemFromInventory: (itemId: string) => void;
    setInventoryLocked: (locked: boolean) => void;
}

export interface ChoicesSlice {
    choicesHistory: Record<string, RecordedChoice>;
    recordChoice: (choiceId: string, currentScene: string, consequences: ChoiceConsequences) => void;
    hasMadeChoice: (choiceId: string) => boolean;
    getChoiceInfo: (choiceId: string) => RecordedChoice | undefined;
    getAttitudeScore: (attitude: NarrativeAttitude) => number;
    getNarrativeTendency: () => NarrativeTendency;
}

export interface WorldSlice {
    currentScene: string;
    isStatusRevealed: boolean;
    isSmokingActive: boolean;
    act1Progress: Act1Progress;
    day2Progress: Day2Progress;
    setScene: (scene: string) => void;
    setStatusRevealed: (revealed: boolean) => void;
    setSmokingActive: (active: boolean) => void;
    updateAct1Progress: (updates: Partial<Act1Progress>) => void;
    updateDay2Progress: (updates: Partial<Day2Progress>) => void;
}

export interface NarrativeSlice {
    currentDialog: NarrativeDialogState | null;
    activeDocument: ActiveDocumentState | null;
    isEyelidsClosing: boolean;
    setDialog: (dialog: NarrativeDialogState | null) => void;
    startDialogue: (dialog: { speaker?: string; text: string; choices?: ChoiceOption[] }) => void;
    closeDialog: () => void;
    setDocument: (doc: ActiveDocumentState | null) => void;
    openDocument: (doc: ActiveDocumentState) => void;
    closeDocument: () => void;
    setEyelidsClosing: (closing: boolean) => void;
}

export interface PersistenceSlice {
    saveGame: () => void;
    loadGame: () => boolean;
    hasSave: () => boolean;
    resetGame: () => void;
}

export interface AudioSlice {
    masterVolume: number;
    musicVolume: number;
    sfxVolume: number;
    audioSettingsOpen: boolean;
    setMasterVolume: (volume: number) => void;
    setMusicVolume: (volume: number) => void;
    setSfxVolume: (volume: number) => void;
    setAudioSettingsOpen: (open: boolean) => void;
}
