import React, { useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import './StatToast.css';

export const StatToast: React.FC = () => {
    const activeToast = useGameStore((state) => state.activeToast);
    const clearToast = useGameStore((state) => state.clearToast);

    useEffect(() => {
        if (!activeToast) return;
        const timer = window.setTimeout(clearToast, 6000);
        return () => window.clearTimeout(timer);
    }, [activeToast, clearToast]);

    if (!activeToast) return null;
    const isPositive = activeToast.delta > 0;
    const toneClass = activeToast.type === 'consciousness'
        ? 'toast-cosmic'
        : isPositive ? 'toast-green' : 'toast-red';

    return (
        <div className={`stat-toast-container ${toneClass}`}>
            <span className="toast-icon">{activeToast.type === 'consciousness' ? '◉' : '◇'}</span>
            <span className="toast-label">{activeToast.statName}</span>
            <span className="toast-arrow">{isPositive ? '▲' : '▼'}</span>
        </div>
    );
};
