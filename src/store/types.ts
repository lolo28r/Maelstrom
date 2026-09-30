import type { RecordedChoice } from '../game/helper/ChoiceSystem';

export type StatType = 'mental' | 'exhaustion' | 'consciousness';

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
    mentalDelta?: number;
    exhaustionDelta?: number;
    consciousnessDelta?: number;
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

export interface TrapezohedronState {
    acquired: boolean;
    trueViewActive: boolean;
}

export interface Act1Progress {
    deskSearched: boolean;
    journalRead: boolean;
    letterRead: boolean;
    secretDrawerUnlocked: boolean;
    secretLabOpened: boolean;
    trapezohedronCollected: boolean;
    priestEncountered?: boolean;
    listenedToDispute?: boolean;
    metMrBell?: boolean;
    cityFatigueTriggered?: boolean;
    storeRationedToday?: boolean;
}

export interface StatNotification {
    id: number;
    statName: string;
    delta: number;
    type: StatType;
}

export interface StatsSlice {
    mentalHealth: number;
    exhaustion: number;
    consciousness: number;
    activeToast: StatNotification | null;
    modifyStat: (stat: StatType, delta: number) => void;
    triggerStatChange: (label: string, type: 'up' | 'down', color: 'red' | 'green' | 'purple') => void;
    clearToast: () => void;
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
}

export interface WorldSlice {
    currentScene: string;
    trapezohedron: TrapezohedronState;
    isStatusRevealed: boolean;
    isSmokingActive: boolean;
    act1Progress: Act1Progress;
    setScene: (scene: string) => void;
    setTrapezohedronAcquired: (acquired: boolean) => void;
    toggleTrueView: () => void;
    setTrueView: (active: boolean) => void;
    setStatusRevealed: (revealed: boolean) => void;
    setSmokingActive: (active: boolean) => void;
    updateAct1Progress: (updates: Partial<Act1Progress>) => void;
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
