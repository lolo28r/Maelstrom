import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import './DocumentViewer.css';

export const DocumentViewer: React.FC = () => {
    const activeDocument = useGameStore((state) => state.activeDocument);
    const closeDocument = useGameStore((state) => state.closeDocument);

    if (!activeDocument) return null;

    const handleClose = () => {
        if (activeDocument.onClose) {
            activeDocument.onClose();
        }
        closeDocument();
    };

    return (
        <div
            onClick={(e) => {
                e.stopPropagation();
                handleClose();
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
                        {activeDocument.title}
                    </h2>
                    <button
                        onClick={handleClose}
                        className="document-viewer-close-btn"
                        title="Fermer"
                    >
                        ✕
                    </button>
                </div>

                {/* Document Content */}
                <div className="document-viewer-content" style={{ whiteSpace: 'pre-line' }}>
                    {activeDocument.content}
                </div>

                {/* Footer Action */}
                <div className="document-viewer-footer">
                    <button
                        onClick={handleClose}
                        className="document-viewer-action-btn"
                    >
                        [ REPOSER LE DOCUMENT ]
                    </button>
                </div>
            </div>
        </div>
    );
};