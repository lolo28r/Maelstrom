import type { StateCreator } from 'zustand';
import type { AudioSlice } from './types';

const STORAGE_KEY = 'maelstrom-audio-settings';

const clampVolume = (value: number) => Math.max(0, Math.min(1, value));

const loadPreferences = () => {
    const defaults = { masterVolume: 0.8, musicVolume: 0.45, sfxVolume: 0.7 };
    if (typeof window === 'undefined') return defaults;

    try {
        const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}') as Partial<typeof defaults>;
        return {
            masterVolume: clampVolume(saved.masterVolume ?? defaults.masterVolume),
            musicVolume: clampVolume(saved.musicVolume ?? defaults.musicVolume),
            sfxVolume: clampVolume(saved.sfxVolume ?? defaults.sfxVolume),
        };
    } catch {
        return defaults;
    }
};

const savePreferences = (values: Pick<AudioSlice, 'masterVolume' | 'musicVolume' | 'sfxVolume'>) => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        masterVolume: values.masterVolume,
        musicVolume: values.musicVolume,
        sfxVolume: values.sfxVolume,
    }));
};

export const createAudioSlice: StateCreator<AudioSlice, [], [], AudioSlice> = (set, get) => ({
    ...loadPreferences(),
    audioSettingsOpen: false,
    setMasterVolume: (masterVolume) => {
        set({ masterVolume: clampVolume(masterVolume) });
        savePreferences(get());
    },
    setMusicVolume: (musicVolume) => {
        set({ musicVolume: clampVolume(musicVolume) });
        savePreferences(get());
    },
    setSfxVolume: (sfxVolume) => {
        set({ sfxVolume: clampVolume(sfxVolume) });
        savePreferences(get());
    },
    setAudioSettingsOpen: (audioSettingsOpen) => set({ audioSettingsOpen }),
});
