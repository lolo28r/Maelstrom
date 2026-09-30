import React from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../../store/useGameStore';
import './CenterNarrativeModal.css';

export const CenterNarrativeModal: React.FC = () => {
    const { t } = useTranslation();
    const currentDialog = useGameStore((state) => state.currentDialog);
    const closeDialog = useGameStore((state) => state.closeDialog);

    // Ce composant ne s'affiche QUE pour les dialogues de type 'center'
    if (!currentDialog || currentDialog.type !== 'center') return null;

    const raw = t(currentDialog.textKey, {
        returnObjects: true,
        defaultValue: currentDialog.textKey,
    }) as unknown;

    let paragraphs: string[] = [currentDialog.textKey];

    if (Array.isArray(raw)) {
        paragraphs = raw.filter((paragraph): paragraph is string => typeof paragraph === 'string');
    } else if (typeof raw === 'string') {
        paragraphs = raw.split('\n\n');
    }

    const handleClose = () => {
        const onComplete = currentDialog.onComplete;
        closeDialog();
        if (onComplete) onComplete();
    };

    return (
        <div className="center-modal-overlay" onClick={handleClose}>
            <div className="center-modal-parchment" onClick={(e) => e.stopPropagation()}>
                <div className="center-modal-header-tag">
                    <span>{t('intro.psychological_event_tag', { defaultValue: ' AIDE ' })}</span>
                </div>

                <div className="center-modal-content">
                    {paragraphs.map((para, index) => (
                        <p key={index}>{para}</p>
                    ))}
                </div>

                <div className="center-modal-footer">
                    <button onClick={handleClose} className="center-modal-btn">
                        [ COMPRIS ]
                    </button>
                </div>
            </div>
        </div>
    );
};
