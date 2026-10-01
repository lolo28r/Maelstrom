import React, { useState } from 'react';
import i18n from '../../i18n';
import { useGameStore } from '../../store/useGameStore';
import { INVESTIGATION_FRAGMENTS } from '../../constants/investigation';
import './JournalModal.css';

export const JournalModal: React.FC = () => {
    const journalUnlocked = useGameStore((state) => state.journalUnlocked);
    const currentDate = useGameStore((state) => state.currentDate); // <-- Récupération de la date dynamique
    const notes = useGameStore((state) => state.notes);
    const discoveredKeywords = useGameStore((state) => state.discoveredKeywords);
    const documents = useGameStore((state) => state.documents);
    const investigationConclusions = useGameStore((state) => state.investigationConclusions);
    const acquiredFragments = useGameStore((state) => state.acquiredFragments);
    const hasNewJournalEntry = useGameStore((state) => state.hasNewJournalEntry);
    const pendingNote = useGameStore((state) => state.pendingNote);
    const commitPendingNote = useGameStore((state) => state.commitPendingNote);
    const markJournalAsRead = useGameStore((state) => state.markJournalAsRead);

    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'notes' | 'fragments' | 'conclusions' | 'keywords' | 'documents'>('notes');
    const [selectedDoc, setSelectedDoc] = useState<{ title: string; content: string; } | null>(null);
    const [isWritingAnim, setIsWritingAnim] = useState(false);

    if (!journalUnlocked) return null;

    const handleOpen = () => {
        setIsOpen(true);
        markJournalAsRead();
    };

    const handleWritingInteraction = () => {
        setIsWritingAnim(true);
        setTimeout(() => {
            commitPendingNote();
            setIsWritingAnim(false);
        }, 1200);
    };

    return (
        <>
            <button className="journal-hud-btn" onClick={handleOpen}>
                📖 Journal
                {hasNewJournalEntry && <span className="journal-badge-dot" />}
            </button>

            {isOpen && (
                <div className="journal-overlay" onClick={() => setIsOpen(false)}>
                    <div className="journal-container" onClick={(e) => e.stopPropagation()}>
                        <div className="journal-header">
                            <div>
                                <h2>JOURNAL DE BORD - LAURENCE LINDNER</h2>
                                {/* Affichage de la date actuelle d'Arkham sous le titre */}
                                <p className="journal-sub-date">Arkham — {currentDate}</p>
                            </div>
                            <button className="journal-close-btn" onClick={() => { setIsOpen(false); setSelectedDoc(null); }}>✕</button>
                        </div>

                        <div className="journal-tabs">
                            <button
                                className={activeTab === 'notes' ? 'active' : ''}
                                onClick={() => { setActiveTab('notes'); setSelectedDoc(null); }}
                            >
                                Notes ({notes.length + (pendingNote ? 1 : 0)})
                            </button>
                            <button
                                className={activeTab === 'fragments' ? 'active' : ''}
                                onClick={() => { setActiveTab('fragments'); setSelectedDoc(null); }}
                            >
                                {i18n.t('investigation.journal.fragments')} ({acquiredFragments.length})
                            </button>
                            <button
                                className={activeTab === 'conclusions' ? 'active' : ''}
                                onClick={() => { setActiveTab('conclusions'); setSelectedDoc(null); }}
                            >
                                {i18n.t('investigation.journal.conclusions')} ({investigationConclusions.length})
                            </button>
                            <button
                                className={activeTab === 'keywords' ? 'active' : ''}
                                onClick={() => { setActiveTab('keywords'); setSelectedDoc(null); }}
                            >
                                Indices ({discoveredKeywords.length})
                            </button>
                            <button
                                className={activeTab === 'documents' ? 'active' : ''}
                                onClick={() => { setActiveTab('documents'); setSelectedDoc(null); }}
                            >
                                Documents ({documents.length})
                            </button>
                        </div>

                        <div className="journal-body">
                            {/* ONGLET NOTES */}
                            {activeTab === 'notes' && (
                                <div className="journal-notes-list">
                                    {pendingNote && (
                                        <div className={`journal-pending-box ${isWritingAnim ? 'writing-effect' : ''}`}>
                                            <span className="pending-tag">✍️ PENSÉE EN ATTENTE D'ÉCRITURE</span>
                                            <h4>{pendingNote.title}</h4>
                                            <p>{pendingNote.content}</p>
                                            <button className="journal-write-btn" onClick={handleWritingInteraction} disabled={isWritingAnim}>
                                                {isWritingAnim ? "Laurence trempe sa plume..." : "[ CONSIGNER CETTE NOTE DANS LE JOURNAL ]"}
                                            </button>
                                        </div>
                                    )}

                                    {notes.length === 0 && !pendingNote && (
                                        <p className="journal-empty">Aucune note consignée pour le moment.</p>
                                    )}

                                    {notes.map((note) => (
                                        <div key={note.id} className="journal-note-item">
                                            <div className="journal-note-meta">
                                                <span className="journal-note-timestamp">{note.timestamp}</span>
                                                <h3 className="journal-note-title">{note.title}</h3>
                                            </div>
                                            <p className="journal-note-content">{note.content}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'fragments' && (
                                <div className="journal-notes-list">
                                    {acquiredFragments.length === 0 ? (
                                        <p className="journal-empty">{i18n.t('investigation.journal.noFragments')}</p>
                                    ) : acquiredFragments.map((fragmentId) => {
                                        const fragment = INVESTIGATION_FRAGMENTS[fragmentId];
                                        if (!fragment) return null;
                                        return (
                                            <div key={fragment.id} className="journal-note-item">
                                                <div className="journal-note-meta">
                                                    <span className="conclusion-status">{i18n.t(`investigation.kinds.${fragment.kind}`)}</span>
                                                    <span className="journal-note-timestamp">{i18n.t(fragment.sourceKey)}</span>
                                                </div>
                                                <h3 className="journal-note-title">{i18n.t(fragment.titleKey)}</h3>
                                                <p className="journal-note-content">{i18n.t(fragment.contentKey)}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {activeTab === 'conclusions' && (
                                <div className="journal-notes-list">
                                    {investigationConclusions.length === 0 ? (
                                        <p className="journal-empty">{i18n.t('investigation.journal.noConclusions')}</p>
                                    ) : investigationConclusions.map((conclusion) => (
                                        <div key={conclusion.id} className={`journal-note-item conclusion-${conclusion.status}`}>
                                            <div className="journal-note-meta">
                                                <span className="journal-note-timestamp">{conclusion.acquiredAt}</span>
                                                <span className="conclusion-status">{i18n.t(`investigation.status.${conclusion.status}`)}</span>
                                            </div>
                                            <h3 className="journal-note-title">{i18n.t(conclusion.titleKey)}</h3>
                                            <p className="journal-note-content">{i18n.t(conclusion.contentKey)}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* ONGLET MOTS-CLÉS */}
                            {activeTab === 'keywords' && (
                                <div className="journal-keywords-list">
                                    {discoveredKeywords.length === 0 ? (
                                        <p className="journal-empty">Aucun indice marquant découvert.</p>
                                    ) : (
                                        discoveredKeywords.map((kw) => (
                                            <div key={kw.id} className="journal-keyword-badge">
                                                <span>🔍 {kw.label}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* ONGLET DOCUMENTS */}
                            {activeTab === 'documents' && (
                                <div className="journal-documents-view">
                                    {selectedDoc ? (
                                        <div className="document-reader">
                                            <button className="back-to-docs-btn" onClick={() => setSelectedDoc(null)}>← Retour à la liste</button>
                                            <h3 className="doc-reader-title">{selectedDoc.title}</h3>
                                            <div className="doc-reader-content">
                                                {selectedDoc.content.split('\n\n').map((paragraph, idx) => (
                                                    <p key={idx}>{paragraph}</p>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="journal-documents-list">
                                            {documents.length === 0 ? (
                                                <p className="journal-empty">Aucun document officiel ou lettre récupéré.</p>
                                            ) : (
                                                documents.map((doc) => (
                                                    <div
                                                        key={doc.id}
                                                        className="journal-doc-item"
                                                        onClick={() => setSelectedDoc({ title: doc.title, content: doc.content })}
                                                    >
                                                        <span className="journal-doc-timestamp">{doc.timestamp}</span>
                                                        <h4>📜 {doc.title}</h4>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
