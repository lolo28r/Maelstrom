import { create } from 'zustand';
import i18n from '../i18n';
import { RecordedChoice, ChoiceSystem } from '../game/helper/ChoiceSystem';
import { JournalSlice, createJournalSlice } from './journalSlice';
import { DevSlice, createDevSlice } from './devSlice';

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

export interface ChoiceOption {
    id: string;
    text: string;
    consequences: {
        mentalDelta?: number;
        exhaustionDelta?: number;
        consciousnessDelta?: number;
        customPayload?: string | number;
    };
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
}

export interface StatNotification {
    id: number;
    statName: string;
    delta: number;
    type: 'mental' | 'exhaustion' | 'consciousness';
}

// Fusion du GameState avec JournalSlice et DevSlice pour éviter les erreurs TypeScript
export interface GameState extends JournalSlice, DevSlice {
    mentalHealth: number;
    exhaustion: number;
    consciousness: number;
    modifyStat: (stat: 'mental' | 'exhaustion' | 'consciousness', delta: number) => void;
    triggerStatChange: (label: string, type: 'up' | 'down', color: 'red' | 'green' | 'purple') => void;

    activeToast: StatNotification | null;
    clearToast: () => void;

    currentScene: string;
    setScene: (scene: string) => void;

    inventory: Item[];
    selectedItem: Item | null;
    setSelectedItem: (item: Item | null) => void;
    addItem: (item: Item) => void;
    removeItem: (itemId: string) => void;
    removeItemFromInventory: (itemId: string) => void;

    isInventoryLocked: boolean;
    setInventoryLocked: (locked: boolean) => void;

    choicesHistory: Record<string, RecordedChoice>;
    recordChoice: (choiceId: string, currentScene: string, consequences: ChoiceOption['consequences']) => void;
    hasMadeChoice: (choiceId: string) => boolean;
    getChoiceInfo: (choiceId: string) => RecordedChoice | undefined;

    trapezohedron: TrapezohedronState;
    setTrapezohedronAcquired: (acquired: boolean) => void;
    toggleTrueView: () => void;
    setTrueView: (active: boolean) => void;

    isStatusRevealed: boolean;
    setStatusRevealed: (revealed: boolean) => void;

    isSmokingActive: boolean;
    setSmokingActive: (active: boolean) => void;

    act1Progress: Act1Progress;
    updateAct1Progress: (updates: Partial<Act1Progress>) => void;

    currentDialog: NarrativeDialogState | null;
    setDialog: (dialog: NarrativeDialogState | null) => void;
    startDialogue: (dialog: { speaker?: string; text: string; choices?: ChoiceOption[]; }) => void;
    closeDialog: () => void;

    activeDocument: ActiveDocumentState | null;
    setDocument: (doc: ActiveDocumentState | null) => void;
    openDocument: (doc: ActiveDocumentState) => void;
    closeDocument: () => void;

    isEyelidsClosing: boolean;
    setEyelidsClosing: (closing: boolean) => void;

    saveGame: () => void;
    loadGame: () => boolean;
    hasSave: () => boolean;
    resetGame: () => void;
}

const SAVE_KEY = 'maelstrom_save_v1';

const initialTrapezohedron: TrapezohedronState = {
    acquired: false,
    trueViewActive: false,
};

const initialAct1Progress: Act1Progress = {
    deskSearched: false,
    journalRead: false,
    letterRead: false,
    secretDrawerUnlocked: false,
    secretLabOpened: false,
    trapezohedronCollected: false,
    priestEncountered: false
};

export const useGameStore = create<GameState>()((set, get, store) => ({
    mentalHealth: 100,
    exhaustion: 0,
    consciousness: 0,
    isStatusRevealed: false,
    isSmokingActive: false,
    isInventoryLocked: true,

    activeToast: null,

    modifyStat: (stat, delta) => {
        set((state) => {
            let updatedToast: StatNotification | null = null;
            let newMental = state.mentalHealth;
            let newExhaustion = state.exhaustion;
            let newConsciousness = state.consciousness;

            if (stat === 'mental') {
                newMental = Math.min(100, Math.max(0, state.mentalHealth + delta));
                updatedToast = { id: Date.now(), statName: "Santé Mentale", delta, type: 'mental' };
            } else if (stat === 'exhaustion') {
                newExhaustion = Math.min(100, Math.max(0, state.exhaustion + delta));
                updatedToast = { id: Date.now(), statName: "Épuisement", delta, type: 'exhaustion' };
            } else if (stat === 'consciousness') {
                newConsciousness = Math.min(100, Math.max(0, state.consciousness + delta));
                updatedToast = { id: Date.now(), statName: "Conscience Cosmique", delta, type: 'consciousness' };
            }

            return {
                mentalHealth: newMental,
                exhaustion: newExhaustion,
                consciousness: newConsciousness,
                activeToast: updatedToast,
            };
        });
    },

    triggerStatChange: (label, type, color) => {
        const delta = type === 'up' ? 10 : -10;
        let statType: 'mental' | 'exhaustion' | 'consciousness' = 'mental';

        if (label.toLowerCase().includes('épuisement') || label.toLowerCase().includes('fatigue')) {
            statType = 'exhaustion';
        } else if (label.toLowerCase().includes('conscience')) {
            statType = 'consciousness';
        }

        get().modifyStat(statType, delta);
    },

    clearToast: () => set({ activeToast: null }),

    currentScene: 'MainMenu',
    setScene: (scene) => set({ currentScene: scene }),

    inventory: [],
    selectedItem: null,
    setSelectedItem: (item) => set({ selectedItem: item }),

    addItem: (item) =>
        set((state) => {
            const existingIndex = state.inventory.findIndex((i) => i.id === item.id);
            const isStackable = item.stackable !== false;

            if (existingIndex !== -1 && isStackable) {
                const updatedInventory = [...state.inventory];
                const currentQty = updatedInventory[existingIndex].quantity || 1;
                updatedInventory[existingIndex] = {
                    ...updatedInventory[existingIndex],
                    quantity: currentQty + (item.quantity || 1),
                };
                return { inventory: updatedInventory };
            }

            return {
                inventory: [...state.inventory, { ...item, quantity: item.quantity || 1 }],
            };
        }),

    removeItem: (itemId) =>
        set((state) => {
            const itemToRemove = state.inventory.find((i) => i.id === itemId);
            if (!itemToRemove) return state;

            const currentQty = itemToRemove.quantity || 1;

            if (currentQty > 1) {
                const updatedInventory = state.inventory.map((i) =>
                    i.id === itemId ? { ...i, quantity: currentQty - 1 } : i
                );

                const updatedSelectedItem = state.selectedItem?.id === itemId
                    ? { ...state.selectedItem, quantity: currentQty - 1 }
                    : state.selectedItem;

                return {
                    inventory: updatedInventory,
                    selectedItem: updatedSelectedItem,
                };
            }

            return {
                inventory: state.inventory.filter((i) => i.id !== itemId),
                selectedItem: state.selectedItem?.id === itemId ? null : state.selectedItem,
            };
        }),

    removeItemFromInventory: (itemId) => get().removeItem(itemId),
    setInventoryLocked: (locked) => set({ isInventoryLocked: locked }),

    choicesHistory: {},

    recordChoice: (choiceId, currentScene, consequences) => {
        set((state) => {
            const recordedChoice: RecordedChoice = {
                id: choiceId,
                scene: currentScene,
                timestamp: Date.now(),
                consequences: {
                    mentalDelta: consequences.mentalDelta,
                    exhaustionDelta: consequences.exhaustionDelta,
                    consciousnessDelta: consequences.consciousnessDelta,
                    customPayload: consequences.customPayload,
                },
                customPayload: consequences.customPayload,
            };

            let newMental = state.mentalHealth;
            let newExhaustion = state.exhaustion;
            let newConsciousness = state.consciousness;
            let toastToSet: StatNotification | null = null;

            if (consequences.mentalDelta) {
                newMental = Math.min(100, Math.max(0, state.mentalHealth + consequences.mentalDelta));
                toastToSet = { id: Date.now(), statName: "Santé Mentale", delta: consequences.mentalDelta, type: 'mental' };
            } else if (consequences.exhaustionDelta) {
                newExhaustion = Math.min(100, Math.max(0, state.exhaustion + consequences.exhaustionDelta));
                toastToSet = { id: Date.now(), statName: "Épuisement", delta: consequences.exhaustionDelta, type: 'exhaustion' };
            } else if (consequences.consciousnessDelta) {
                newConsciousness = Math.min(100, Math.max(0, state.consciousness + consequences.consciousnessDelta));
                toastToSet = { id: Date.now(), statName: "Conscience Cosmique", delta: consequences.consciousnessDelta, type: 'consciousness' };
            }

            return {
                choicesHistory: { ...state.choicesHistory, [choiceId]: recordedChoice },
                mentalHealth: newMental,
                exhaustion: newExhaustion,
                consciousness: newConsciousness,
                activeToast: toastToSet,
            };
        });
    },

    hasMadeChoice: (choiceId) => {
        return ChoiceSystem.hasMade(get().choicesHistory, choiceId);
    },

    getChoiceInfo: (choiceId) => {
        return ChoiceSystem.getChoiceDetails(get().choicesHistory, choiceId);
    },

    trapezohedron: initialTrapezohedron,
    setTrapezohedronAcquired: (acquired) =>
        set((state) => ({
            trapezohedron: { ...state.trapezohedron, acquired },
        })),
    toggleTrueView: () =>
        set((state) => {
            const nextView = !state.trapezohedron.trueViewActive;
            const delta = nextView ? 3 : -3;
            get().modifyStat('consciousness', delta);
            return {
                trapezohedron: { ...state.trapezohedron, trueViewActive: nextView },
            };
        }),
    setTrueView: (active) =>
        set((state) => ({
            trapezohedron: { ...state.trapezohedron, trueViewActive: active },
        })),

    setStatusRevealed: (revealed) => set({ isStatusRevealed: revealed }),
    setSmokingActive: (active) => set({ isSmokingActive: active }),

    act1Progress: initialAct1Progress,
    updateAct1Progress: (updates) =>
        set((state) => ({
            act1Progress: { ...state.act1Progress, ...updates },
        })),

    currentDialog: null,

    setDialog: (dialog) =>
        set(() => {
            if (!dialog) return { currentDialog: null };

            let resolvedSpeaker = dialog.speaker;

            if (!resolvedSpeaker) {
                const parts = dialog.textKey.split('.');
                let speakerKey = '';

                if (parts.length >= 2) {
                    speakerKey = `${parts[0]}.${parts[1]}.speaker`;
                }

                const hasCustomSpeaker = speakerKey && i18n.exists(speakerKey);
                const rawSpeaker = hasCustomSpeaker ? i18n.t(speakerKey) : null;

                if (typeof rawSpeaker === 'string' && rawSpeaker) {
                    resolvedSpeaker = rawSpeaker;
                } else if (dialog.textKey.includes('dream.scene_1')) {
                    resolvedSpeaker = '????????????';
                } else {
                    resolvedSpeaker = 'Laurence Lindner';
                }
            }

            return {
                currentDialog: {
                    ...dialog,
                    speaker: resolvedSpeaker,
                },
            };
        }),

    startDialogue: ({ text, speaker, choices }) => set({
        currentDialog: {
            textKey: text,
            type: 'bottom',
            speaker: speaker || 'Laurence Lindner',
            choices: choices
        }
    }),

    closeDialog: () => set({ currentDialog: null }),

    activeDocument: null,
    setDocument: (doc) => set({ activeDocument: doc }),
    openDocument: (doc) => set({ activeDocument: doc }),
    closeDocument: () => set({ activeDocument: null }),

    isEyelidsClosing: false,
    setEyelidsClosing: (closing) => set({ isEyelidsClosing: closing }),

    // Intégration des Slices
    ...createJournalSlice(set, get, store),
    ...createDevSlice(set, get, store),

    saveGame: () => {
        try {
            const state = get();
            const saveData = {
                mentalHealth: state.mentalHealth,
                exhaustion: state.exhaustion,
                consciousness: state.consciousness,
                currentScene: state.currentScene,
                inventory: state.inventory,
                trapezohedron: state.trapezohedron,
                act1Progress: state.act1Progress,
                choicesHistory: state.choicesHistory,
                journalUnlocked: state.journalUnlocked,
                notes: state.notes,
                discoveredKeywords: state.discoveredKeywords,
            };
            localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
        } catch (e) {
            console.warn('Erreur lors de la sauvegarde locale:', e);
        }
    },

    loadGame: () => {
        try {
            const dataStr = localStorage.getItem(SAVE_KEY);
            if (!dataStr) return false;
            const data = JSON.parse(dataStr);
            set({
                mentalHealth: data.mentalHealth ?? 100,
                exhaustion: data.exhaustion ?? 0,
                consciousness: data.consciousness ?? 0,
                currentScene: data.currentScene || 'ProfessorOffice',
                inventory: data.inventory || [],
                trapezohedron: data.trapezohedron || initialTrapezohedron,
                act1Progress: data.act1Progress || initialAct1Progress,
                choicesHistory: data.choicesHistory || {},
                journalUnlocked: data.journalUnlocked ?? false,
                notes: data.notes || [],
                discoveredKeywords: data.discoveredKeywords || [],
                isStatusRevealed: false,
                isSmokingActive: false,
                isInventoryLocked: false,
            });
            return true;
        } catch (e) {
            console.warn('Erreur lors du chargement de la sauvegarde:', e);
            return false;
        }
    },

    hasSave: () => {
        return !!localStorage.getItem(SAVE_KEY);
    },

    resetGame: () =>
        set({
            mentalHealth: 100,
            exhaustion: 0,
            consciousness: 0,
            isStatusRevealed: false,
            isSmokingActive: false,
            isInventoryLocked: true,
            activeToast: null,
            currentScene: 'MainMenu',
            inventory: [],
            selectedItem: null,
            trapezohedron: initialTrapezohedron,
            act1Progress: initialAct1Progress,
            choicesHistory: {},
            currentDialog: null,
            activeDocument: null,
            isEyelidsClosing: false,
            journalUnlocked: false,
            notes: [],
            discoveredKeywords: [],
        }),
}));