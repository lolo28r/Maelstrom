import type { StateCreator } from 'zustand';
import i18n from '../i18n';
import type { GameState } from './useGameStore';
import type { NarrativeDialogState, NarrativeSlice } from './types';

const resolveSpeaker = (dialog: NarrativeDialogState): string => {
    if (dialog.speaker) return dialog.speaker;

    const parts = dialog.textKey.split('.');
    const speakerKey = parts.length >= 2 ? `${parts[0]}.${parts[1]}.speaker` : '';
    if (speakerKey && i18n.exists(speakerKey)) return i18n.t(speakerKey);

    return dialog.textKey.includes('dream.scene_1')
        ? i18n.t('characters.unknownEntity')
        : i18n.t('characters.laurence');
};

export const createNarrativeSlice: StateCreator<GameState, [], [], NarrativeSlice> = (set) => ({
    currentDialog: null,
    activeDocument: null,
    isEyelidsClosing: false,

    setDialog: (dialog) => set({
        currentDialog: dialog ? { ...dialog, speaker: resolveSpeaker(dialog) } : null,
    }),
    startDialogue: ({ text, speaker, choices }) => set({
        currentDialog: {
            textKey: text,
            type: 'bottom',
            speaker: speaker ?? i18n.t('characters.laurence'),
            choices,
        },
    }),
    closeDialog: () => set({ currentDialog: null }),
    setDocument: (doc) => set({ activeDocument: doc }),
    openDocument: (doc) => set({ activeDocument: doc }),
    closeDocument: () => set({ activeDocument: null }),
    setEyelidsClosing: (closing) => set({ isEyelidsClosing: closing }),
});
