import React, { useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import './AudioSettings.css';

interface VolumeControlProps {
    label: string;
    value: number;
    onChange: (value: number) => void;
}

const VolumeControl: React.FC<VolumeControlProps> = ({ label, value, onChange }) => (
    <label className="audio-setting-row">
        <span>{label}</span>
        <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={Math.round(value * 100)}
            onChange={(event) => onChange(Number(event.target.value) / 100)}
        />
        <output>{Math.round(value * 100)} %</output>
    </label>
);

export const AudioSettings: React.FC = () => {
    const isOpen = useGameStore((state) => state.audioSettingsOpen);
    const setIsOpen = useGameStore((state) => state.setAudioSettingsOpen);
    const masterVolume = useGameStore((state) => state.masterVolume);
    const musicVolume = useGameStore((state) => state.musicVolume);
    const sfxVolume = useGameStore((state) => state.sfxVolume);
    const setMasterVolume = useGameStore((state) => state.setMasterVolume);
    const setMusicVolume = useGameStore((state) => state.setMusicVolume);
    const setSfxVolume = useGameStore((state) => state.setSfxVolume);

    useEffect(() => {
        if (!isOpen) return;
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setIsOpen(false);
        };
        window.addEventListener('keydown', closeOnEscape);
        return () => window.removeEventListener('keydown', closeOnEscape);
    }, [isOpen, setIsOpen]);

    return (
        <div className="audio-settings-root">
            <button
                className={`audio-settings-toggle ${isOpen ? 'active' : ''}`}
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-controls="audio-settings-panel"
                aria-label="Réglages du son"
                title="Réglages du son"
            >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 9v6h4l5 4V5L8 9H4Z" />
                    <path d="M16 9.5a4 4 0 0 1 0 5M18.5 7a7 7 0 0 1 0 10" />
                </svg>
            </button>

            {isOpen && (
                <section id="audio-settings-panel" className="audio-settings-panel" aria-label="Réglages audio">
                    <div className="audio-settings-header">
                        <h2>SON</h2>
                        <button type="button" onClick={() => setIsOpen(false)} aria-label="Fermer les réglages">×</button>
                    </div>
                    <VolumeControl label="Volume général" value={masterVolume} onChange={setMasterVolume} />
                    <VolumeControl label="Musique" value={musicVolume} onChange={setMusicVolume} />
                    <VolumeControl label="Ambiances et effets" value={sfxVolume} onChange={setSfxVolume} />
                </section>
            )}
        </div>
    );
};
