import React, { useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../../store/useGameStore';
import './NarrativeDialog.css';

export const NarrativeDialog: React.FC = () => {
  const { t } = useTranslation();
  const currentDialog = useGameStore((state) => state.currentDialog);
  const closeDialog = useGameStore((state) => state.closeDialog);

  const handleAdvance = useCallback(() => {
    if (currentDialog) {
      closeDialog();
    }
  }, [currentDialog, closeDialog]);

  useEffect(() => {
    if (!currentDialog) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        handleAdvance();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentDialog, handleAdvance]);

  if (!currentDialog) return null;

  const translatedText = t(currentDialog.textKey, { defaultValue: currentDialog.textKey });

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        handleAdvance();
      }}
      className="narrative-dialog-container"
    >
      <div className="narrative-dialog-box">
        {/* Header Label */}
        <div className="narrative-dialog-header">
          <span>LAURENCE LINDNER</span>
          <span className="narrative-dialog-prompt">[ ESPACE / CLIC ] ▶</span>
        </div>

        {/* Narrative Text Content */}
        <p className="narrative-dialog-text">
          {translatedText}
        </p>
      </div>
    </div>
  );
};
