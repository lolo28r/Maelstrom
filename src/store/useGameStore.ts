import { create } from 'zustand';

export interface Item {
  id: string;
  name: string;
  icon: string;
  description: string;
  examineText: string;
}

export interface DialogueChoice {
  text: string;
  onSelect: () => void;
  consciousnessDelta?: number;
}

export interface DialogueState {
  speaker: string;
  portrait?: string;
  text: string;
  choices?: DialogueChoice[];
  onComplete?: () => void;
}

export interface NarrativeDialogState {
  textKey: string;
  onComplete?: () => void;
}

export interface ActiveDocumentState {
  titleKey: string;
  contentKey: string;
}

export interface TrapezohedronState {
  acquired: boolean;
  trueViewActive: boolean;
  radioActive: boolean;
  frequency: number; // e.g. 98.4 MHz
  signalStrength: number;
  activeMessage: string | null;
}

export interface Act1Progress {
  deskSearched: boolean;
  journalRead: boolean;
  secretDrawerUnlocked: boolean;
  secretLabOpened: boolean;
  trapezohedronCollected: boolean;
  nyarlathotepContacted: boolean;
  vanceArkhamDiscovered: boolean;
}

export interface GameState {
  consciousness: number;
  increaseConsciousness: (amount: number) => void;

  currentScene: string;
  setScene: (scene: string) => void;

  inventory: Item[];
  addItem: (item: Item) => void;
  removeItem: (itemId: string) => void;
  selectedItem: Item | null;
  setSelectedItem: (item: Item | null) => void;

  trapezohedron: TrapezohedronState;
  setTrapezohedronAcquired: (acquired: boolean) => void;
  toggleTrueView: () => void;
  setTrueView: (active: boolean) => void;
  toggleRadio: () => void;
  setFrequency: (freq: number) => void;
  checkRadioTransmissions: () => void;

  act1Progress: Act1Progress;
  updateAct1Progress: (updates: Partial<Act1Progress>) => void;

  activeDialogue: DialogueState | null;
  startDialogue: (dialogue: DialogueState) => void;
  closeDialogue: () => void;

  // Narrative Dialog & Document Viewer state
  currentDialog: NarrativeDialogState | null;
  setDialog: (dialog: NarrativeDialogState | null) => void;
  closeDialog: () => void;

  activeDocument: ActiveDocumentState | null;
  setDocument: (doc: ActiveDocumentState | null) => void;
  closeDocument: () => void;

  // Save / Load System (LocalStorage)
  saveGame: () => void;
  loadGame: () => boolean;
  hasSave: () => boolean;

  resetGame: () => void;
}

const SAVE_KEY = 'maelstrom_save_v1';

const initialTrapezohedron: TrapezohedronState = {
  acquired: false,
  trueViewActive: false,
  radioActive: false,
  frequency: 90.0,
  signalStrength: 0,
  activeMessage: null,
};

const initialAct1Progress: Act1Progress = {
  deskSearched: false,
  journalRead: false,
  secretDrawerUnlocked: false,
  secretLabOpened: false,
  trapezohedronCollected: false,
  nyarlathotepContacted: false,
  vanceArkhamDiscovered: false,
};

export const useGameStore = create<GameState>((set, get) => ({
  consciousness: 0,
  increaseConsciousness: (amount) =>
    set((state) => ({
      consciousness: Math.min(100, Math.max(0, state.consciousness + amount)),
    })),

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
      selectedItem: state.selectedItem?.id === itemId ? null : state.selectedItem,
    })),
  selectedItem: null,
  setSelectedItem: (item) => set({ selectedItem: item }),

  trapezohedron: initialTrapezohedron,
  setTrapezohedronAcquired: (acquired) =>
    set((state) => ({
      trapezohedron: { ...state.trapezohedron, acquired },
    })),
  toggleTrueView: () =>
    set((state) => {
      const nextView = !state.trapezohedron.trueViewActive;
      const newConsciousness = nextView
        ? Math.min(100, state.consciousness + 3)
        : state.consciousness;
      return {
        consciousness: newConsciousness,
        trapezohedron: { ...state.trapezohedron, trueViewActive: nextView },
      };
    }),
  setTrueView: (active) =>
    set((state) => ({
      trapezohedron: { ...state.trapezohedron, trueViewActive: active },
    })),
  toggleRadio: () =>
    set((state) => ({
      trapezohedron: { ...state.trapezohedron, radioActive: !state.trapezohedron.radioActive },
    })),
  setFrequency: (freq) => {
    set((state) => {
      const normalizedFreq = Math.round(freq * 10) / 10;
      let signal = 0;
      let msg: string | null = null;

      if (Math.abs(normalizedFreq - 94.2) < 0.3) {
        signal = Math.max(0, 100 - Math.abs(normalizedFreq - 94.2) * 300);
        if (signal > 80) {
          msg = "« Laurence... tu cherches ton père ? Il a franchi le seuil bien avant toi. Son esprit habite désormais la Cité de la Grande Race... N'aie pas peur de la vérité. »";
        }
      } else if (Math.abs(normalizedFreq - 103.6) < 0.3) {
        signal = Math.max(0, 100 - Math.abs(normalizedFreq - 103.6) * 300);
        if (signal > 80) {
          msg = "« Les murs d'Arkham ne retiendront pas ce qui s'est éveillé. Cherche les archives de Pnakotus si tu veux comprendre le Trapézoèdre... »";
        }
      }

      return {
        trapezohedron: {
          ...state.trapezohedron,
          frequency: normalizedFreq,
          signalStrength: signal,
          activeMessage: msg,
        },
      };
    });
  },
  checkRadioTransmissions: () => {
    const { frequency } = get().trapezohedron;
    get().setFrequency(frequency);
  },

  act1Progress: initialAct1Progress,
  updateAct1Progress: (updates) =>
    set((state) => ({
      act1Progress: { ...state.act1Progress, ...updates },
    })),

  activeDialogue: null,
  startDialogue: (dialogue) => set({ activeDialogue: dialogue }),
  closeDialogue: () => set({ activeDialogue: null }),

  // Narrative Dialog & Document Viewer state
  currentDialog: null,
  setDialog: (dialog) => set({ currentDialog: dialog }),
  closeDialog: () =>
    set((state) => {
      const onComp = state.currentDialog?.onComplete;
      if (onComp) onComp();
      return { currentDialog: null };
    }),

  activeDocument: null,
  setDocument: (doc) => set({ activeDocument: doc }),
  closeDocument: () => set({ activeDocument: null }),

  // Save / Load System (LocalStorage)
  saveGame: () => {
    try {
      const state = get();
      const saveData = {
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
      consciousness: 0,
      currentScene: 'MainMenu',
      inventory: [],
      selectedItem: null,
      trapezohedron: initialTrapezohedron,
      act1Progress: initialAct1Progress,
      activeDialogue: null,
      currentDialog: null,
      activeDocument: null,
    }),
}));
