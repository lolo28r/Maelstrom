import React, { useEffect, useMemo, useState } from 'react';
import { configureHtmlAudio } from '../../audio/audioMix';
import { useGameStore } from '../../store/useGameStore';
import { paginateDocument } from '../../utils/documentPages';
import './DocumentViewer.css';

export const DocumentViewer: React.FC = () => {
    const activeDocument = useGameStore((state) => state.activeDocument);
    const closeDocument = useGameStore((state) => state.closeDocument);
    const pages = useMemo(() => paginateDocument(activeDocument?.content ?? ''), [activeDocument?.content]);
    const [navigation, setNavigation] = useState({ document: activeDocument, page: 0 });
    const page = navigation.document === activeDocument ? Math.min(navigation.page, pages.length - 1) : 0;
    const changePage = (nextPage: number) => setNavigation({ document: activeDocument, page: nextPage });

    useEffect(() => {
        if (!activeDocument) return;
        const audio = new Audio(`${import.meta.env.BASE_URL}assets/sheetSfx.mp3`);
        const unsubscribe = configureHtmlAudio(audio, 'sfx', 0.4);
        audio.play().catch((error) => console.warn('Lecture du son de papier bloquée :', error));
        return () => {
            audio.pause();
            audio.currentTime = 0;
            unsubscribe();
        };
    }, [activeDocument, page]);

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
                <div key={page} className="document-viewer-content" aria-live="polite">
                    {pages[page]}
                </div>

                {/* Footer Action */}
                <div className="document-viewer-footer">
                    {pages.length > 1 && (
                        <nav className="document-viewer-pagination" aria-label="Pages du document">
                            <button type="button" className="document-viewer-action-btn"
                                disabled={page === 0} onClick={() => changePage(page - 1)} aria-label="Page précédente">
                                ←
                            </button>
                            <span>Page {page + 1} / {pages.length}</span>
                            <button type="button" className="document-viewer-action-btn"
                                disabled={page === pages.length - 1} onClick={() => changePage(page + 1)} aria-label="Page suivante">
                                →
                            </button>
                        </nav>
                    )}
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
