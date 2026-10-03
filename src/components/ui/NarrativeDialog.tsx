import React, { useEffect, useCallback, useState, useRef, useMemo } from 'react';
import { useGameStore, ChoiceOption } from '../../store/useGameStore';
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

function obscureWords(text: string, seed: string): string {
    const offset = seed.length % 6;
    return text.split(' ').map((word, index) => {
        if ((index + offset) % 6 !== 0 || !/[A-Za-zÀ-ÿ]{5,}/.test(word)) return word;
        return word.replace(/[A-Za-zÀ-ÿ]{5,}/, '……');
    }).join(' ');
}

function shouldInsertHallucination(dialogKey: string): boolean {
    if (dialogKey.includes('.crisis.')) return true;
    const score = [...dialogKey].reduce((total, character) => total + character.charCodeAt(0), 0);
    return score % 4 === 0;
}

export const NarrativeDialog: React.FC = () => {
    const currentDialog = useGameStore((state) => state.currentDialog);
    const closeDialog = useGameStore((state) => state.closeDialog);
    const recordChoice = useGameStore((state) => state.recordChoice);
    const currentScene = useGameStore((state) => state.currentScene);
    const hasMadeChoice = useGameStore((state) => state.hasMadeChoice);
    const lucidity = useGameStore((state) => state.lucidity);
    const crisisSuppressed = useGameStore((state) => state.crisisSuppressed);

    const [currentStep, setCurrentStep] = useState(0);
    const [displayedCharCount, setDisplayedCharCount] = useState(0);
    const timerRef = useRef<number | null>(null);

    const dialogKey = currentDialog?.textKey ?? '';
    const isCenterModal = currentDialog?.type === 'center';
    const speakerName = currentDialog?.speaker ?? i18n.t('characters.laurence');
    const choices = currentDialog?.choices ?? [];

    const steps = useMemo(() => {
        const resolved = resolveSteps(dialogKey);
        if (!currentDialog?.distortible || crisisSuppressed) return resolved;
        const distorted = lucidity <= 15
            ? resolved.map((step, index) => obscureWords(step, `${dialogKey}_${index}`))
            : resolved;
        if (lucidity <= 15 && currentDialog.hallucinationKey && shouldInsertHallucination(dialogKey)) {
            const hallucination = i18n.t(currentDialog.hallucinationKey);
            if (typeof hallucination === 'string') distorted.push(hallucination);
        }
        return distorted;
    }, [dialogKey, currentDialog?.distortible, currentDialog?.hallucinationKey, crisisSuppressed, lucidity]);
    const currentFullText = steps[currentStep] || '';
    const isTypewriterComplete = displayedCharCount >= currentFullText.length;

    const isLastStep = currentStep === steps.length - 1;
    const showChoices = isTypewriterComplete && isLastStep && choices.length > 0;

    useEffect(() => {
        if (currentDialog) {
            setCurrentStep(0);
            setDisplayedCharCount(0);
        }
    }, [dialogKey, currentDialog]);

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
            className={`narrative-dialog-container ${currentDialog.distortible && lucidity <= 30 ? 'lucidity-warning' : ''} ${currentDialog.distortible && lucidity <= 15 && !crisisSuppressed ? 'lucidity-critical' : ''}`}
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
