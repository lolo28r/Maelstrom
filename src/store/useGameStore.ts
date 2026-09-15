import { create } from 'zustand';

export interface Item {
    id: string;
    name: string;
    icon: string;
    description: string;
    examineText: string;
}

export interface NarrativeDialogState {
    textKey: string;
    type?: 'bottom' | 'center'; // Par défaut 'bottom'
    onComplete?: () => void;
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
}

export interface StatNotification {
    id: number;
    statName: string;
    delta: number;
    type: 'mental' | 'exhaustion' | 'consciousness';
}

export interface GameState {
    mentalHealth: number;
    exhaustion: number;
    consciousness: number;
    modifyStat: (stat: 'mental' | 'exhaustion' | 'consciousness', delta: number) => void;

    activeToast: StatNotification | null;
    clearToast: () => void;

    currentScene: string;
    setScene: (scene: string) => void;

    inventory: Item[];
    addItem: (item: Item) => void;
    removeItem: (itemId: string) => void;

    trapezohedron: TrapezohedronState;
    setTrapezohedronAcquired: (acquired: boolean) => void;
    toggleTrueView: () => void;
    setTrueView: (active: boolean) => void;

    act1Progress: Act1Progress;
    updateAct1Progress: (updates: Partial<Act1Progress>) => void;

    currentDialog: NarrativeDialogState | null;
    setDialog: (dialog: NarrativeDialogState | null) => void;
    closeDialog: () => void;

    activeDocument: ActiveDocumentState | null;
    setDocument: (doc: ActiveDocumentState | null) => void;
    openDocument: (doc: ActiveDocumentState) => void;
    closeDocument: () => void;

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
};

export const useGameStore = create<GameState>((set, get) => ({
    mentalHealth: 100,
    exhaustion: 0,
    consciousness: 0,

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

    clearToast: () => set({ activeToast: null }),

    currentScene: 'MainMenu',
    setScene: (scene) => set({ currentScene: scene }),

    inventory: [],
    addItem: (item) =>
        set((state) => {
            if (state.inventory.some((i) => i.id === item.id)) return state;
            return { inventory: [...state.inventory, item] };
        }),
    removeItem: (itemId) =>
        set((state) => ({
            inventory: state.inventory.filter((i) => i.id !== itemId),
        })),

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

    act1Progress: initialAct1Progress,
    updateAct1Progress: (updates) =>
        set((state) => ({
            act1Progress: { ...state.act1Progress, ...updates },
        })),

    currentDialog: null,
    setDialog: (dialog) => set({ currentDialog: dialog }),

    // CORRECTION : On retire l'appel synchrone de onComp() ici pour laisser le composant React gérer l'avancement/fermeture
    closeDialog: () => set({ currentDialog: null }),

    activeDocument: null,
    setDocument: (doc) => set({ activeDocument: doc }),
    openDocument: (doc) => set({ activeDocument: doc }),
    closeDocument: () => set({ activeDocument: null }),

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
            activeToast: null,
            currentScene: 'MainMenu',
            inventory: [],
            trapezohedron: initialTrapezohedron,
            act1Progress: initialAct1Progress,
            currentDialog: null,
            activeDocument: null,
        }),
}));