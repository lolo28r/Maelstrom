import React from 'react';
import { useGameStore } from '../store/useGameStore';
import './CosmicConsciousnessGauge.css';

export const CosmicConsciousnessGauge: React.FC = () => {
  const consciousness = useGameStore((state) => state.consciousness);

  const getStatusText = (val: number) => {
    if (val < 25) return { label: 'HUMAIN', color: 'text-cyan-400' };
    if (val < 50) return { label: 'PERCEPTIF', color: 'text-blue-400' };
    if (val < 75) return { label: 'ALTÉRÉ', color: 'text-purple-400' };
    return { label: 'ÉVEILLÉ (COSMIQUE)', color: 'text-pink-500 animate-pulse' };
  };

  const status = getStatusText(consciousness);

  return (
    <div className="consciousness-gauge-panel">
      <div className="consciousness-gauge-header">
        <span className="flex items-center gap-1-5">
          <span className="consciousness-gauge-dot" />
          CONSCIENCE COSMIQUE
        </span>
        <span className={`font-bold ${status.color}`}>{status.label}</span>
      </div>

      {/* Progress Bar Container */}
      <div className="consciousness-gauge-bar-container">
        <div
          className="consciousness-gauge-bar-fill"
          style={{ width: `${consciousness}%` }}
        />
      </div>

      <div className="consciousness-gauge-footer">
        <span>FRÉQ: 432 Hz</span>
        <span className="consciousness-gauge-val">{consciousness} / 100 %</span>
      </div>
    </div>
  );
};
