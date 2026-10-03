import React, { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/useGameStore';
import { CosmicStatusHUD } from './CosmicStatusHUD';
import './SmokingOverlay.css';
import { configureHtmlAudio } from '../audio/audioMix';

const SMOKING_OVERLAY_DURATION_MS = 8000;

export const SmokingOverlay: React.FC = () => {
    const { t } = useTranslation();
    const isSmokingActive = useGameStore((state) => state.isSmokingActive);
    const setSmokingActive = useGameStore((state) => state.setSmokingActive);
    const setStatusRevealed = useGameStore((state) => state.setStatusRevealed);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const baseUrl = import.meta.env.BASE_URL;

    const closeOverlay = useCallback(() => {
        setSmokingActive(false);
        setStatusRevealed(false);
    }, [setSmokingActive, setStatusRevealed]);

    useEffect(() => {
        if (!isSmokingActive) return;

        let unsubscribeAudioMix: (() => void) | undefined;

        try {
            audioRef.current = new Audio(`${baseUrl}assets/smokeVFX.mp3`);
            unsubscribeAudioMix = configureHtmlAudio(audioRef.current, 'sfx');
            audioRef.current.play().catch((error) => {
                console.warn('Lecture audio bloquée par le navigateur :', error);
            });
        } catch (error) {
            console.warn("Erreur lors de la création de l'audio :", error);
        }

        const autoCloseTimer = window.setTimeout(closeOverlay, SMOKING_OVERLAY_DURATION_MS);
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') closeOverlay();
        };
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.clearTimeout(autoCloseTimer);
            window.removeEventListener('keydown', handleKeyDown);
            audioRef.current?.pause();
            audioRef.current = null;
            unsubscribeAudioMix?.();
        };
    }, [isSmokingActive, closeOverlay, baseUrl]);

    if (!isSmokingActive) return null;

    const handleFinishCigarette = (event: React.MouseEvent) => {
        event.stopPropagation();
        closeOverlay();
    };

    return (
        <div
            className="smoking-overlay-container"
            role="dialog"
            aria-modal="true"
            aria-label={t('new_content.smoking.title')}
            onClick={closeOverlay}
        >
            <img
                src={`${baseUrl}assets/smokeBackground.jpg`}
                alt=""
                className="smoking-bg"
                onError={(e) => console.error(`Erreur de chargement de l'image de fond : ${baseUrl}assets/smokeBackground.jpg`, e)}
            />

            <div className="smoking-center-content" onClick={(event) => event.stopPropagation()}>
                <CosmicStatusHUD embedded />
                <div className="smoking-timebar" aria-hidden="true">
                    <div className="smoking-timebar-fill" />
                </div>
                <p className="smoking-auto-close-hint">{t('new_content.smoking.autoCloseHint')}</p>
                <button onClick={handleFinishCigarette} className="finish-cigarette-btn">
                    {t('new_content.smoking.closeNow')}
                </button>
            </div>
        </div>
    );
};
