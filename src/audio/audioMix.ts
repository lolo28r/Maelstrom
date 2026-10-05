import type Phaser from 'phaser';
import { useGameStore } from '../store/useGameStore';

export type AudioChannel = 'music' | 'sfx';

const MUSIC_KEYS = new Set([
    'menu_music',
    'intro_theme',
    'streetOst',
    'ostSalon',
    'ostStore',
    'ostEglise',
    'day2StreetMusic',
    'day2StoreMusic',
    'day2ChurchMusic',
    'day2DreamMusic',
    'day2OfficeMusic',
    'day3OfficeMusic',
    'prologueMusic',
    'ostNyarla',
]);

const SFX_RELATIVE_GAINS: Record<string, number> = {
    street_rain: 0.3,
    desk_rain: 0.22,
};

export const getMusicVolume = () => useGameStore.getState().musicVolume;
export const getSfxVolume = () => useGameStore.getState().sfxVolume;

export const applyPhaserAudioMix = (game: Phaser.Game) => {
    const { masterVolume, musicVolume, sfxVolume } = useGameStore.getState();
    game.sound.volume = masterVolume;

    for (const sound of game.sound.getAllPlaying()) {
        const channelVolume = MUSIC_KEYS.has(sound.key)
            ? musicVolume
            : sfxVolume * (SFX_RELATIVE_GAINS[sound.key] ?? 1);
        const adjustableSound = sound as Phaser.Sound.BaseSound & { setVolume?: (volume: number) => unknown };
        adjustableSound.setVolume?.(channelVolume);
    }
};

export const configureHtmlAudio = (
    audio: HTMLAudioElement,
    channel: AudioChannel,
    relativeGain = 1,
) => {
    const apply = () => {
        const state = useGameStore.getState();
        const channelVolume = channel === 'music' ? state.musicVolume : state.sfxVolume;
        audio.volume = Math.max(0, Math.min(1, state.masterVolume * channelVolume * relativeGain));
    };

    apply();
    const unsubscribe = useGameStore.subscribe((state, previousState) => {
        if (
            state.masterVolume !== previousState.masterVolume
            || state.musicVolume !== previousState.musicVolume
            || state.sfxVolume !== previousState.sfxVolume
        ) {
            apply();
        }
    });

    return unsubscribe;
};
