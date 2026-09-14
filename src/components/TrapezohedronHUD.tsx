import React, { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import './TrapezohedronHUD.css';

export const TrapezohedronHUD: React.FC = () => {
  const trapezohedron = useGameStore((state) => state.trapezohedron);
  const toggleTrueView = useGameStore((state) => state.toggleTrueView);
  const toggleRadio = useGameStore((state) => state.toggleRadio);
  const setFrequency = useGameStore((state) => state.setFrequency);
  const [showRadioPanel, setShowRadioPanel] = useState(false);

  if (!trapezohedron.acquired) return null;

  return (
    <>
      {/* Quick Access Bar Top-Right */}
      <div className="trapezohedron-bar">
        {/* True View Lens Button */}
        <button
          onClick={toggleTrueView}
          className={`trapezohedron-btn ${
            trapezohedron.trueViewActive ? 'trapezohedron-btn-active iridescent-glow' : ''
          }`}
        >
          <span className="flex items-center gap-2">
            <span
              className={`w-2-5 h-2-5 rounded-full ${
                trapezohedron.trueViewActive ? 'bg-purple-400 animate-ping' : 'bg-cyan-500'
              }`}
            />
            {trapezohedron.trueViewActive ? 'VRAIE VUE : ACTIVE' : 'LENTILLE TRAPÉZOÈDRE'}
          </span>
        </button>

        {/* Radio Receiver Toggle */}
        <button
          onClick={() => {
            toggleRadio();
            setShowRadioPanel(!showRadioPanel);
          }}
          className={`trapezohedron-btn ${
            trapezohedron.radioActive ? 'trapezohedron-radio-btn-active' : ''
          }`}
        >
          <span className="flex items-center gap-2">
            <span>📻</span>
            {trapezohedron.radioActive ? 'RADIO : ON' : 'RADIO NYARLATHOTEP'}
          </span>
        </button>
      </div>

      {/* Nyarlathotep Radio Tuner Panel */}
      {(showRadioPanel || trapezohedron.radioActive) && (
        <div className="trapezohedron-radio-panel">
          <div className="trapezohedron-radio-header">
            <span className="font-bold tracking-wider">RÉCEPTEUR RADIO ARTEFACT</span>
            <span className="text-10px text-slate-400">CANAL OCCULTE</span>
          </div>

          {/* Signal Indicator */}
          <div className="my-3 space-y-1-5">
            <div className="flex justify-between text-xs text-slate-300">
              <span>FREQUENCE :</span>
              <span className="font-mono text-cyan-300 font-bold">
                {trapezohedron.frequency.toFixed(1)} MHz
              </span>
            </div>

            <input
              type="range"
              min="88.0"
              max="108.0"
              step="0.1"
              value={trapezohedron.frequency}
              onChange={(e) => setFrequency(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 bg-slate-800 h-2 rounded cursor-pointer"
            />

            <div className="flex justify-between text-11px text-slate-400 pt-1">
              <span>SIGNAL :</span>
              <span className="font-mono text-emerald-400 font-bold">
                {Math.round(trapezohedron.signalStrength)}%
              </span>
            </div>
            <div className="h-2 w-full bg-slate-900 border border-emerald-500/30 overflow-hidden">
              <div
                className="h-full bg-emerald-400 transition-all duration-200"
                style={{ width: `${trapezohedron.signalStrength}%` }}
              />
            </div>
          </div>

          {/* Active Broadcast Message Box */}
          <div className="trapezohedron-message-box">
            {trapezohedron.activeMessage ? (
              <div>
                <span className="text-10px font-tech text-purple-400 block mb-1 font-bold">
                  [ EMISSION DETECTEE — NYARLATHOTEP ]
                </span>
                <p className="leading-relaxed">{trapezohedron.activeMessage}</p>
              </div>
            ) : (
              <span className="text-slate-500 text-11px font-tech italic">
                Sifflements cosmiques et grésillements... Ajustez la fréquence (essayez 94.2 MHz ou 103.6 MHz).
              </span>
            )}
          </div>
        </div>
      )}
    </>
  );
};
