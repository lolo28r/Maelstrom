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
    'day2AsylumMusic',
    'day2GraveyardMusic',
    'day3OfficeMusic',
    'day3ForestMusic',
    'prologueMusic',
    'ostNyarla',
]);

const SFX_RELATIVE_GAINS: Record<string, number> = {
    day3TrainSfx: 0.5,
    street_rain: 0.3,
    desk_rain: 0.22,
    day3ForestAmbience: 0.2,
};

const MUSIC_RELATIVE_GAINS: Record<string, number> = {
    prologueMusic: 2,
};

export const getMusicVolume = (key?: string) => useGameStore.getState().musicVolume * (key ? MUSIC_RELATIVE_GAINS[key] ?? 1 : 1);
export const getSfxVolume = () => useGameStore.getState().sfxVolume;

export const applyPhaserAudioMix = (game: Phaser.Game) => {
    const { masterVolume, musicVolume, sfxVolume } = useGameStore.getState();
    game.sound.volume = masterVolume;

    for (const sound of game.sound.getAllPlaying()) {
        const channelVolume = MUSIC_KEYS.has(sound.key)
            ? musicVolume * (MUSIC_RELATIVE_GAINS[sound.key] ?? 1)
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
