import React, { useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import './StatToast.css';

export const StatToast: React.FC = () => {
    const activeToast = useGameStore((state) => state.activeToast);
    const clearToast = useGameStore((state) => state.clearToast);

    useEffect(() => {
        if (!activeToast) return;
        const timer = setTimeout(() => {
            clearToast();
        }, 6000);
        return () => clearTimeout(timer);
    }, [activeToast, clearToast]);

    if (!activeToast) return null;

    const isPositive = activeToast.delta > 0;
    const arrowSymbol = isPositive ? '▲' : '▼';

    // Attribution d'un glyphe / picto selon la stat touchée
    let iconSymbol = '🕳️';
    let toneClass = 'toast-neutral';

    if (activeToast.type === 'mental') {
        iconSymbol = '🧠'; // Cerveau / Santé Mentale
        toneClass = isPositive ? 'toast-green' : 'toast-red';
    } else if (activeToast.type === 'exhaustion') {
        iconSymbol = '⏳'; // Épuisement / Temps / Fatigue
        toneClass = isPositive ? 'toast-amber' : 'toast-green';
    } else if (activeToast.type === 'consciousness') {
        iconSymbol = '👁️'; // Conscience Cosmique / Vraie Vue
        toneClass = 'toast-cosmic';
    }

    return (
        <div className={`stat-toast-container ${toneClass}`}>
            <span className="toast-icon">{iconSymbol}</span>
            <span className="toast-label">{activeToast.statName}</span>
            <span className="toast-arrow">{arrowSymbol}</span>
        </div>
    );
};