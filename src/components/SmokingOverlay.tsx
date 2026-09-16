import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';
import { CosmicStatusHUD } from './CosmicStatusHUD';
import './SmokingOverlay.css';

export const SmokingOverlay: React.FC = () => {
    const isSmokingActive = useGameStore((state) => state.isSmokingActive);
    const setSmokingActive = useGameStore((state) => state.setSmokingActive);
    const setStatusRevealed = useGameStore((state) => state.setStatusRevealed);

    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (isSmokingActive) {
            setStatusRevealed(true);

            try {
                audioRef.current = new Audio('/assets/smokeVFX.mp3');
                audioRef.current.volume = 0.5;
                audioRef.current.play().catch(err => {
                    console.warn("Lecture audio bloquée par le navigateur :", err);
                });
            } catch (e) {
                console.warn("Erreur lors de la création de l'audio :", e);
            }
        } else {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        }
    }, [isSmokingActive, setStatusRevealed]);

    if (!isSmokingActive) return null;

    const handleFinishCigarette = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSmokingActive(false);
        setStatusRevealed(false);
    };

    return (
        <div className="smoking-overlay-container" onClick={(e) => e.stopPropagation()}>
            <img
                src="/assets/smokeBackground.jpg"
                alt="Rituel tabac"
                className="smoking-bg"
                onError={(e) => console.error("Erreur de chargement de l'image de fond : /assets/smokeBackground.jpg", e)}
            />

            {/* Conteneur centralisé pour les jauges ET le bouton */}
            <div className="smoking-center-content">
                <CosmicStatusHUD />
                <button onClick={handleFinishCigarette} className="finish-cigarette-btn">
                    [ FINIR LA CIGARETTE ]
                </button>
            </div>
        </div>
    );
};