
import React, { useEffect, useCallback, useState, useRef } from 'react';
import { useGameStore } from '../../store/useGameStore';
import './NarrativeDialog.css';
import i18n from '../../i18n';

/** Résout une clé i18n en tableau de strings, quel que soit le format */
function resolveSteps(textKey: string): string[] {
    const raw = i18n.t(textKey, { returnObjects: true }) as unknown;

    if (Array.isArray(raw)) {
        // Clé pointe directement sur un tableau : ['step1', 'step2', ...]
        return raw.filter((s): s is string => typeof s === 'string');
    }

    if (typeof raw === 'object' && raw !== null && 'steps' in raw) {
        // Clé pointe sur un objet { speaker, steps } — on prend steps
        const steps = (raw as { steps: unknown }).steps;
        if (Array.isArray(steps)) {
            return steps.filter((s): s is string => typeof s === 'string');
        }
    }

    if (typeof raw === 'string') {
        return [raw];
    }

    // Fallback : afficher la clé brute
    return [textKey];
}

export const NarrativeDialog: React.FC = () => {
    const currentDialog = useGameStore((state) => state.currentDialog);
    const closeDialog = useGameStore((state) => state.closeDialog);

    const [currentStep, setCurrentStep] = useState(0);
    const [displayedCharCount, setDisplayedCharCount] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const dialogKey = currentDialog?.textKey ?? '';
    const isCenterModal = currentDialog?.type === 'center';
    const speakerName = currentDialog?.speaker ?? 'LAURENCE LINDNER';

    const steps = resolveSteps(dialogKey);
    const currentFullText = steps[currentStep] || '';
    const isTypewriterComplete = displayedCharCount >= currentFullText.length;

    // Reset à chaque nouveau dialogue
    useEffect(() => {
        if (currentDialog) {
            setCurrentStep(0);
            setDisplayedCharCount(0);
        }
    }, [dialogKey]);

    // Effet machine à écrire
    useEffect(() => {
        if (!currentDialog || isCenterModal) return;
        if (displayedCharCount < currentFullText.length) {
            timerRef.current = setTimeout(() => {
                setDisplayedCharCount((prev) => prev + 1);
            }, 25);
        }
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [displayedCharCount, currentFullText, currentDialog, isCenterModal]);

    const handleAdvance = useCallback(() => {
        if (!currentDialog) return;

        if (!isTypewriterComplete) {
            if (timerRef.current) clearTimeout(timerRef.current);
            setDisplayedCharCount(currentFullText.length);
        } else if (currentStep < steps.length - 1) {
            setCurrentStep((prev) => prev + 1);
            setDisplayedCharCount(0);
        } else {
            const onComplete = currentDialog.onComplete;
            closeDialog();
            if (onComplete) onComplete();
        }
    }, [currentDialog, isTypewriterComplete, currentFullText, currentStep, steps.length, closeDialog]);

    // Raccourcis clavier
    useEffect(() => {
        if (!currentDialog || isCenterModal) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.code === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                handleAdvance();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentDialog, isCenterModal, handleAdvance]);

    if (!currentDialog || isCenterModal) return null;

    return (
        <div
            onClick={(e) => { e.stopPropagation(); handleAdvance(); }}
            className="narrative-dialog-container"
        >
            <div className="narrative-dialog-box">
                <div className="narrative-dialog-header">
                    <span>{speakerName.toUpperCase()}</span>
                    <span className="narrative-dialog-prompt">
                        {isTypewriterComplete ? '[ ESPACE / CLIC ] ▶' : '[ SUIVANT... ]'}
                    </span>
                </div>
                <p className="narrative-dialog-text">
                    {currentFullText.slice(0, displayedCharCount)}
                </p>
            </div>
        </div>
    );
};