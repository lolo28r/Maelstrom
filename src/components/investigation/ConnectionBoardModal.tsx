import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { INVESTIGATION_FRAGMENTS, NIGHTMARE_CONNECTIONS } from '../../constants/investigation';
import { useGameStore } from '../../store/useGameStore';
import './ConnectionBoardModal.css';

const NIGHTMARE_FRAGMENT_IDS = [
    'father_forgot_name_at_station',
    'bell_change_1921',
    'bell_retained_scholarship',
];

export const ConnectionBoardModal: React.FC = () => {
    const { t } = useTranslation();
    const isOpen = useGameStore((state) => state.connectionBoardOpen);
    const acquiredFragments = useGameStore((state) => state.acquiredFragments);
    const resolvedConnections = useGameStore((state) => state.resolvedConnections);
    const resolveConnection = useGameStore((state) => state.resolveConnection);
    const completeConnectionBoard = useGameStore((state) => state.completeConnectionBoard);
    const [selected, setSelected] = useState<string[]>([]);
    const [feedbackKey, setFeedbackKey] = useState('investigation.board.instructions');
    const [lastResult, setLastResult] = useState<string | null>(null);

    const visibleFragments = useMemo(() => NIGHTMARE_FRAGMENT_IDS
        .filter((id) => acquiredFragments.includes(id))
        .map((id) => INVESTIGATION_FRAGMENTS[id]), [acquiredFragments]);

    const solvableConnections = NIGHTMARE_CONNECTIONS.filter((connection) =>
        connection.requiredFragmentIds.every((id) => acquiredFragments.includes(id))
    );
    const solvedAvailableCount = solvableConnections.filter((connection) => resolvedConnections.includes(connection.id)).length;
    const canFinish = solvedAvailableCount === solvableConnections.length;
    const missingTestimony = NIGHTMARE_CONNECTIONS.some((connection) =>
        connection.requiredFragmentIds.some((id) => !acquiredFragments.includes(id))
    );

    if (!isOpen) return null;

    const toggleFragment = (id: string) => {
        setLastResult(null);
        setSelected((current) => {
            if (current.includes(id)) return current.filter((entry) => entry !== id);
            if (current.length >= 2) return [current[1], id];
            return [...current, id];
        });
    };

    const connect = () => {
        if (selected.length !== 2) {
            setFeedbackKey('investigation.board.selectTwo');
            return;
        }
        const match = NIGHTMARE_CONNECTIONS.find((connection) =>
            connection.requiredFragmentIds.every((id) => selected.includes(id))
        );
        if (!match) {
            setFeedbackKey('investigation.board.insufficient');
            setLastResult(null);
            return;
        }
        resolveConnection(match.id);
        setFeedbackKey(match.contentKey);
        setLastResult(match.id);
        setSelected([]);
    };

    return (
        <div className="connection-board-overlay" role="dialog" aria-modal="true" aria-label={t('investigation.board.title')}>
            <div className="connection-board">
                <header className="connection-board-header">
                    <p>{t('investigation.board.eyebrow')}</p>
                    <h2>{t('investigation.board.title')}</h2>
                    <span>{t('investigation.board.question')}</span>
                </header>

                <div className="fragment-grid">
                    {visibleFragments.map((fragment) => {
                        const isSelected = selected.includes(fragment.id);
                        return (
                            <button
                                key={fragment.id}
                                className={`fragment-card ${isSelected ? 'selected' : ''}`}
                                onClick={() => toggleFragment(fragment.id)}
                                aria-pressed={isSelected}
                            >
                                <span className="fragment-kind">{t(`investigation.kinds.${fragment.kind}`)}</span>
                                <strong>{t(fragment.titleKey)}</strong>
                                <span>{t(fragment.contentKey)}</span>
                                <small>{t(fragment.sourceKey)}</small>
                            </button>
                        );
                    })}
                    {missingTestimony && (
                        <div className="fragment-card missing">
                            <span className="fragment-kind">{t('investigation.kinds.testimony')}</span>
                            <strong>{t('investigation.board.missingTitle')}</strong>
                            <span>{t('investigation.board.missingText')}</span>
                        </div>
                    )}
                </div>

                <section className={`connection-result ${lastResult ? 'resolved' : ''}`} aria-live="polite">
                    {lastResult && <strong>{t(NIGHTMARE_CONNECTIONS.find((item) => item.id === lastResult)?.titleKey ?? '')}</strong>}
                    <p>{t(feedbackKey)}</p>
                </section>

                <footer className="connection-actions">
                    <button onClick={() => { setSelected([]); setLastResult(null); setFeedbackKey('investigation.board.instructions'); }}>
                        {t('investigation.board.undo')}
                    </button>
                    <button className="connect-button" onClick={connect} disabled={selected.length !== 2}>
                        {t('investigation.board.connect')}
                    </button>
                    <button className="finish-button" onClick={completeConnectionBoard} disabled={!canFinish}>
                        {missingTestimony ? t('investigation.board.admitMissing') : t('investigation.board.finish')}
                    </button>
                </footer>
                <p className="connection-progress">{t('investigation.board.progress', { solved: solvedAvailableCount, total: solvableConnections.length })}</p>
            </div>
        </div>
    );
};
