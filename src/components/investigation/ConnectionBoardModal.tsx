import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DAY2_CONNECTIONS, DAY2_FRAGMENT_IDS, INVESTIGATION_FRAGMENTS, NIGHTMARE_CONNECTIONS } from '../../constants/investigation';
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
    const scope = useGameStore((state) => state.connectionBoardScope);
    const resolvedConnections = useGameStore((state) => state.resolvedConnections);
    const resolveConnection = useGameStore((state) => state.resolveConnection);
    const closeConnectionBoard = useGameStore((state) => state.closeConnectionBoard);
    const completeConnectionBoard = useGameStore((state) => state.completeConnectionBoard);
    const [selected, setSelected] = useState<string[]>([]);
    const [feedbackKey, setFeedbackKey] = useState('investigation.board.instructions');
    const [lastResult, setLastResult] = useState<string | null>(null);

    const scopedConnections = scope === 'day2' ? DAY2_CONNECTIONS : NIGHTMARE_CONNECTIONS;
    const scopedFragmentIds = scope === 'day2' ? DAY2_FRAGMENT_IDS : NIGHTMARE_FRAGMENT_IDS;
    const maximumSelection = scope === 'day2' ? 3 : 2;
    const instructionKey = scope === 'day2' ? 'day2.board.instructions' : 'investigation.board.instructions';
    const visibleFragments = scopedFragmentIds
        .filter((id) => acquiredFragments.includes(id))
        .map((id) => INVESTIGATION_FRAGMENTS[id]);

    const solvableConnections = scopedConnections.filter((connection) =>
        connection.requiredFragmentIds.every((id) => acquiredFragments.includes(id))
    );
    const solvedAvailableCount = solvableConnections.filter((connection) => resolvedConnections.includes(connection.id)).length;
    const canFinish = scope === 'day2'
        ? solvedAvailableCount === scopedConnections.length
        : solvedAvailableCount === solvableConnections.length;
    const missingTestimony = scope === 'nightmare' && NIGHTMARE_CONNECTIONS.some((connection) =>
        connection.requiredFragmentIds.some((id) => !acquiredFragments.includes(id))
    );

    useEffect(() => {
        if (!isOpen) return;
        setSelected([]);
        setLastResult(null);
        setFeedbackKey(instructionKey);
    }, [isOpen, instructionKey]);

    if (!isOpen) return null;

    const toggleFragment = (id: string) => {
        setLastResult(null);
        setSelected((current) => {
            if (current.includes(id)) return current.filter((entry) => entry !== id);
            if (current.length >= maximumSelection) return [...current.slice(1), id];
            return [...current, id];
        });
    };

    const connect = () => {
        if (selected.length < 2 || selected.length > maximumSelection) {
            setFeedbackKey(scope === 'day2' ? 'day2.board.selectTwoOrThree' : 'investigation.board.selectTwo');
            return;
        }
        const match = scopedConnections.find((connection) =>
            connection.requiredFragmentIds.length === selected.length
            && connection.requiredFragmentIds.every((id) => selected.includes(id))
        );
        if (!match) {
            const cultFragments = ['cult_meeting', 'shopkeeper_night_bell', 'organic_growth', 'organic_hoofprints', 'virgin_dream_memory', 'rosary_street_reaction', 'thomas_slip'];
            const yithFragments = ['asylum_sealed_room', 'asylum_room_undisturbed', 'asylum_no_departure', 'asylum_admission_1924', 'asylum_change_1921', 'father_photo_before_1921', 'father_note_cache', 'yith_cache_found', 'future_object', 'yith_library_vision'];
            const crossesThreads = selected.some((id) => cultFragments.includes(id)) && selected.some((id) => yithFragments.includes(id));
            setFeedbackKey(crossesThreads ? 'day2.board.separateThreads' : 'investigation.board.insufficient');
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
                    {lastResult && <strong>{t(scopedConnections.find((item) => item.id === lastResult)?.titleKey ?? '')}</strong>}
                    <p>{t(feedbackKey)}</p>
                </section>

                <footer className="connection-actions">
                    <button onClick={() => { setSelected([]); setLastResult(null); setFeedbackKey(instructionKey); }}>
                        {t('investigation.board.undo')}
                    </button>
                    <button className="connect-button" onClick={connect} disabled={selected.length < 2 || selected.length > maximumSelection}>
                        {t('investigation.board.connect')}
                    </button>
                    <button className="finish-button" onClick={completeConnectionBoard} disabled={!canFinish}>
                        {missingTestimony ? t('investigation.board.admitMissing') : t('investigation.board.finish')}
                    </button>
                </footer>
                {scope === 'day2' && (
                    <button className="board-close-button" onClick={closeConnectionBoard}>
                        {t('day2.board.resumeInvestigation')}
                    </button>
                )}
                <p className="connection-progress">{t('investigation.board.progress', { solved: solvedAvailableCount, total: scope === 'day2' ? scopedConnections.length : solvableConnections.length })}</p>
            </div>
        </div>
    );
};
