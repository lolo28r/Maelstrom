import React, { useEffect, useCallback, useState, useRef } from 'react';
import { useGameStore, ChoiceOption } from '../../store/useGameStore';
// @ts-ignore
import './NarrativeDialog.css';
import i18n from '../../i18n';

function resolveSteps(textKey: string): string[] {
    const raw = i18n.t(textKey, { returnObjects: true }) as unknown;

    if (Array.isArray(raw)) {
        return raw.filter((s): s is string => typeof s === 'string');
    }

    if (typeof raw === 'object' && raw !== null && 'steps' in raw) {
        const steps = (raw as { steps: unknown; }).steps;
        if (Array.isArray(steps)) {
            return steps.filter((s): s is string => typeof s === 'string');
        }
    }

    if (typeof raw === 'string') {
        return [raw];
    }

    return [textKey];
}

export const NarrativeDialog: React.FC = () => {
    const currentDialog = useGameStore((state) => state.currentDialog);
    const closeDialog = useGameStore((state) => state.closeDialog);
    const recordChoice = useGameStore((state) => state.recordChoice);
    const currentScene = useGameStore((state) => state.currentScene);
    const hasMadeChoice = useGameStore((state) => state.hasMadeChoice);

    const [currentStep, setCurrentStep] = useState(0);
    const [displayedCharCount, setDisplayedCharCount] = useState(0);
    const timerRef = useRef<number | null>(null);

    const dialogKey = currentDialog?.textKey ?? '';
    const isCenterModal = currentDialog?.type === 'center';
    const speakerName = currentDialog?.speaker ?? 'LAURENCE LINDNER';
    const choices = currentDialog?.choices ?? [];

    const steps = resolveSteps(dialogKey);
    const currentFullText = steps[currentStep] || '';
    const isTypewriterComplete = displayedCharCount >= currentFullText.length;

    const isLastStep = currentStep === steps.length - 1;
    const showChoices = isTypewriterComplete && isLastStep && choices.length > 0;

    useEffect(() => {
        if (currentDialog) {
            setCurrentStep(0);
            setDisplayedCharCount(0);
        }
    }, [dialogKey]);

    useEffect(() => {
        if (!currentDialog || isCenterModal) return;
        if (displayedCharCount < currentFullText.length) {
            const isNyarlathotepSpeaking = speakerName.includes('????????????') || speakerName.includes('NYARLATHOTEP');
            const speed = isNyarlathotepSpeaking ? 65 : 25;

            timerRef.current = window.setTimeout(() => {
                setDisplayedCharCount((prev) => prev + 1);
            }, speed);
        }
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, [displayedCharCount, currentFullText, currentDialog, isCenterModal, speakerName]);

    const handleAdvance = useCallback(() => {
        if (!currentDialog || showChoices) return;

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
    }, [currentDialog, isTypewriterComplete, currentFullText, currentStep, steps.length, closeDialog, showChoices]);

    const handleChoiceClick = (choice: ChoiceOption, e: React.MouseEvent) => {
        e.stopPropagation();
        recordChoice(choice.id, currentScene, choice.consequences);
        const onComplete = currentDialog?.onComplete;
        closeDialog();
        if (onComplete) {
            onComplete(choice.id);
        }
    };

    useEffect(() => {
        if (!currentDialog || isCenterModal || showChoices) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.code === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                handleAdvance();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentDialog, isCenterModal, handleAdvance, showChoices]);

    if (!currentDialog || isCenterModal) return null;

    return (
        <div
            onClick={(e) => { e.stopPropagation(); handleAdvance(); }}
            className="narrative-dialog-container"
        >
            <div className="narrative-dialog-box" onClick={(e) => e.stopPropagation()}>
                <div className="narrative-dialog-header">
                    <span className="narrative-speaker-name">{speakerName.toUpperCase()}</span>
                    {!showChoices && (
                        <span className="narrative-dialog-prompt">
                            {isTypewriterComplete ? '[ ESPACE / CLIC ] ▶' : '[ SUIVANT... ]'}
                        </span>
                    )}
                </div>

                <p className="narrative-dialog-text">
                    {currentFullText.slice(0, displayedCharCount)}
                </p>

                {showChoices && (
                    <div className="narrative-choices-container">
                        {choices.map((choice, index) => {
                            if (choice.requiredFlag && !hasMadeChoice(choice.requiredFlag)) {
                                return null;
                            }
                            return (
                                <button
                                    key={choice.id}
                                    className={`narrative-choice-btn ${choice.id === 'choice_old_ones_what' ? 'narrative-choice-occult' : ''}`}
                                    style={{ '--index': index } as React.CSSProperties}
                                    onClick={(e) => handleChoiceClick(choice, e)}
                                >
                                    <span>{choice.text}</span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};