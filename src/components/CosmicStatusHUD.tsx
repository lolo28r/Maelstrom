import React from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/useGameStore';
import './CosmicStatusHUD.css';

export const CosmicStatusHUD: React.FC<{ embedded?: boolean }> = ({ embedded = false }) => {
    const { t } = useTranslation();
    const lucidity = useGameStore((state) => state.lucidity);
    const consciousness = useGameStore((state) => state.consciousness);
    const crisisSuppressed = useGameStore((state) => state.crisisSuppressed);
    const isStatusRevealed = useGameStore((state) => state.isStatusRevealed);
    const isSmokingActive = useGameStore((state) => state.isSmokingActive);

    if (embedded ? !isSmokingActive : !isStatusRevealed || isSmokingActive) return null;

    return (
        <div className="cosmic-status-hud-overlay">
            <div className="cosmic-status-container">
                <div className="status-title">— {t('stats.innerState')} —</div>
                <div className="status-row">
                    <span className="status-label">{t('stats.lucidity')}</span>
                    <div className="status-bar-bg">
                        <div className="status-bar-fill lucidity-fill" style={{ width: `${lucidity}%` }} />
                    </div>
                    <span className="status-value">{Math.round(lucidity)}%</span>
                </div>
                <div className="status-row">
                    <span className="status-label">{t('stats.cosmicConsciousness')}</span>
                    <div className="status-bar-bg">
                        <div className="status-bar-fill consciousness-fill" style={{ width: `${consciousness}%` }} />
                    </div>
                    <span className="status-value">{Math.round(consciousness)}%</span>
                </div>
                {crisisSuppressed && <div className="status-muted-note">{t('stats.crisisSuppressed')}</div>}
            </div>
        </div>
    );
};
