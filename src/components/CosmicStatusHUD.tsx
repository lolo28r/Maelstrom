import React from 'react';
import { useGameStore } from '../store/useGameStore';
// @ts-ignore
import './CosmicStatusHUD.css';

export const CosmicStatusHUD: React.FC = () => {
    const mentalHealth = useGameStore((state) => state.mentalHealth);
    const exhaustion = useGameStore((state) => state.exhaustion);
    const consciousness = useGameStore((state) => state.consciousness);
    const isStatusRevealed = useGameStore((state) => state.isStatusRevealed);

    if (!isStatusRevealed) return null;

    return (
        <div className="cosmic-status-hud-overlay">
            <div className="cosmic-status-container">
                <div className="status-title">— ÉTAT DE LUCIDITÉ —</div>

                {/* Santé Mentale */}
                <div className="status-row">
                    <span className="status-label">Santé Mentale</span>
                    <div className="status-bar-bg">
                        <div
                            className="status-bar-fill mental-fill"
                            style={{ width: `${mentalHealth}%` }}
                        />
                    </div>
                    <span className="status-value">{Math.round(mentalHealth)}%</span>
                </div>

                {/* Épuisement */}
                <div className="status-row">
                    <span className="status-label">Épuisement</span>
                    <div className="status-bar-bg">
                        <div
                            className="status-bar-fill exhaustion-fill"
                            style={{ width: `${exhaustion}%` }}
                        />
                    </div>
                    <span className="status-value">{Math.round(exhaustion)}%</span>
                </div>

                {/* Conscience Cosmique */}
                <div className="status-row">
                    <span className="status-label">Conscience Cosmique</span>
                    <div className="status-bar-bg">
                        <div
                            className="status-bar-fill consciousness-fill"
                            style={{ width: `${consciousness}%` }}
                        />
                    </div>
                    <span className="status-value">{Math.round(consciousness)}%</span>
                </div>
            </div>
        </div>
    );
};