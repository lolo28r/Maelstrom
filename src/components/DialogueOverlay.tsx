import React from 'react';
import { useGameStore } from '../store/useGameStore';
import './DialogueOverlay.css';

export const DialogueOverlay: React.FC = () => {
  const activeDialogue = useGameStore((state) => state.activeDialogue);
  const closeDialogue = useGameStore((state) => state.closeDialogue);
  const increaseConsciousness = useGameStore((state) => state.increaseConsciousness);

  if (!activeDialogue) return null;

  const isNyarlathotep = activeDialogue.speaker.toUpperCase().includes('NYARLATHOTEP');

  return (
    <div className="dialogue-overlay-container">
      <div
        className={`dialogue-overlay-box ${isNyarlathotep ? 'dialogue-overlay-box-alert' : ''
          }`}
      >
        {/* Header Speaker Label */}
        <div className="dialogue-header">
          <span className={`dialogue-speaker ${isNyarlathotep ? 'dialogue-speaker-alert' : ''}`}>
            [ {activeDialogue.speaker} ]
          </span>
          <span className="dialogue-tag">ARCHIVE DE L'OCCULTE</span>
        </div>

        {/* Text Body */}
        <p className="narrative-dialog-text mb-4">
          {activeDialogue.text}
        </p>

        {/* Choices or Continue */}
        {activeDialogue.choices && activeDialogue.choices.length > 0 ? (
          <div className="space-y-2 mt-4 pt-3 border-t border-slate-800">
            {activeDialogue.choices.map((choice, index) => (
              <button
                key={index}
                onClick={() => {
                  if (choice.consciousnessDelta) {
                    increaseConsciousness(choice.consciousnessDelta);
                  }
                  closeDialogue();
                  choice.onSelect();
                }}
                className="dialogue-choice-btn group"
              >
                <span>— {choice.text}</span>
                <span className="opacity-0 group-hover:opacity-100 text-stone-300 font-bold transition-opacity">
                  ›
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex justify-end pt-2">
            <button
              onClick={() => {
                const onComp = activeDialogue.onComplete;
                closeDialogue();
                if (onComp) onComp();
              }}
              className="dialogue-continue-btn"
            >
              CONTINUER ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
};