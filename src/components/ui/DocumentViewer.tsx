import React from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../../store/useGameStore';
import './DocumentViewer.css';

export const DocumentViewer: React.FC = () => {
  const { t } = useTranslation();
  const activeDocument = useGameStore((state) => state.activeDocument);
  const closeDocument = useGameStore((state) => state.closeDocument);

  if (!activeDocument) return null;

  const titleText = t(activeDocument.titleKey, { defaultValue: activeDocument.titleKey });
  const contentText = t(activeDocument.contentKey, { defaultValue: activeDocument.contentKey });

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        closeDocument();
      }}
      className="document-viewer-overlay"
    >
      {/* Aged Parchment / Manuscript Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="document-viewer-parchment"
      >
        {/* Document Header */}
        <div className="document-viewer-header">
          <h2 className="document-viewer-title">
            {titleText}
          </h2>
          <button
            onClick={closeDocument}
            className="document-viewer-close-btn"
            title="Fermer"
          >
            ✕
          </button>
        </div>

        {/* Document Content */}
        <div className="document-viewer-content">
          {contentText}
        </div>

        {/* Footer Action */}
        <div className="document-viewer-footer">
          <button
            onClick={closeDocument}
            className="document-viewer-action-btn"
          >
            [ REPOSER LE DOCUMENT ]
          </button>
        </div>
      </div>
    </div>
  );
};
