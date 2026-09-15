import React, { useEffect, useCallback, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../../store/useGameStore';
import './NarrativeDialog.css';

export const NarrativeDialog: React.FC = () => {
    const { t } = useTranslation();
    const currentDialog = useGameStore((state) => state.currentDialog);
    const closeDialog = useGameStore((state) => state.closeDialog);

    const [currentStep, setCurrentStep] = useState(0);
    const [displayedCharCount, setDisplayedCharCount] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // 1. Récupération sécurisée même si currentDialog est null (évite les crashs de Hooks)
    const dialogKey = currentDialog?.textKey ?? '';
    const isCenterModal = currentDialog?.type === 'center';

    const rawTranslation = t(dialogKey, { returnObjects: true });
    const steps: string[] = Array.isArray(rawTranslation)
        ? (rawTranslation as string[])
        : typeof rawTranslation === 'string'
            ? [rawTranslation]
            : [dialogKey];

    const currentFullText = steps[currentStep] || '';
    const isTypewriterComplete = displayedCharCount >= currentFullText.length;

    useEffect(() => {
        if (currentDialog) {
            setCurrentStep(0);
            setDisplayedCharCount(0);
        }
    }, [dialogKey]);

    useEffect(() => {
        if (!currentDialog || isCenterModal) return;

        if (displayedCharCount < currentFullText.length) {
            timerRef.current = setTimeout(() => {
                setDisplayedCharCount((prev) => prev + 1);
            }, 25);
        }

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
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

    // 2. Sortie conditionnelle placée APRÈS TOUS les Hooks sans exception
    if (!currentDialog || isCenterModal) return null;

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
                    <span className="narrative-dialog-prompt">
                        {isTypewriterComplete ? '[ ESPACE / CLIC ] ▶' : '[ SUIVANT... ]'}
                    </span>
                </div>

                {/* Narrative Text Content */}
                <p className="narrative-dialog-text">
                    {currentFullText.slice(0, displayedCharCount)}
                </p>
            </div>
        </div>
    );
};