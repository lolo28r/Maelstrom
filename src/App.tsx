import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { phaserGameConfig } from './game/config';
import { useGameStore } from './store/useGameStore';
import { CosmicBackground } from './components/CosmicBackground';
import { EyelidsOverlay } from './components/EyelidsOverlay';
import { InventoryHUD } from './components/InventoryHUD';
import { NarrativeDialog } from './components/ui/NarrativeDialog';
import { DocumentViewer } from './components/ui/DocumentViewer';
import { StatToast } from './components/ui/StatToast';
import { CenterNarrativeModal } from './components/ui/CenterNarrativeModal';
import { CosmicStatusHUD } from './components/CosmicStatusHUD';
import { JournalModal } from './components/ui/JournalModal';
import { SmokingOverlay } from './components/SmokingOverlay';
import { ConnectionBoardModal } from './components/investigation/ConnectionBoardModal';
import { FullscreenButton } from './components/FullscreenButton';
import { toggleGameFullscreen } from './utils/fullscreen';
import { AudioSettings } from './components/AudioSettings';
import { applyPhaserAudioMix } from './audio/audioMix';
import './i18n';

const stopUiEventPropagation = (event: React.SyntheticEvent) => {
    event.stopPropagation();
};

export const App: React.FC = () => {
    const gameRef = useRef<Phaser.Game | null>(null);
    const isEyelidsClosing = useGameStore((state) => state.isEyelidsClosing);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [rightControlsVisible, setRightControlsVisible] = useState(true);
    const masterVolume = useGameStore((state) => state.masterVolume);
    const musicVolume = useGameStore((state) => state.musicVolume);
    const sfxVolume = useGameStore((state) => state.sfxVolume);

    useEffect(() => {
        if (!gameRef.current) {
            gameRef.current = new Phaser.Game(phaserGameConfig);
        }

        // --- ÉCOUTEUR GLOBAL POUR LE CODE SECRET "1937" ---
        const keySequence: string[] = [];
        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null;
            const isEditing = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;
            if (!isEditing && (e.key === 'F11' || (e.altKey && e.key === 'Enter'))) {
                e.preventDefault();
                void toggleGameFullscreen();
                return;
            }
            keySequence.push(e.key);
            if (keySequence.length > 4) keySequence.shift();

            if (keySequence.join('') === '1937') {
                useGameStore.getState().toggleDevMode();
            }
        };

        const refreshLayout = () => {
            const gameShell = document.getElementById('game-shell');
            setIsFullscreen(document.fullscreenElement === gameShell);
            window.requestAnimationFrame(() => gameRef.current?.scale.refresh());
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('resize', refreshLayout);
        document.addEventListener('fullscreenchange', refreshLayout);
        refreshLayout();
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('resize', refreshLayout);
            document.removeEventListener('fullscreenchange', refreshLayout);
        };
    }, []);

    useEffect(() => {
        if (gameRef.current) applyPhaserAudioMix(gameRef.current);
    }, [masterVolume, musicVolume, sfxVolume]);

    return (
        <div id="game-shell" className="game-shell">
            {/* Canvas Phaser */}
            <div id="phaser-container" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, width: '100%', height: '100%' }} />

            <CosmicBackground />

            {/* Effets CRT */}
            <div className="scanlines" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, pointerEvents: 'none', zIndex: 20 }} />
            <div className="vignette" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, pointerEvents: 'none', zIndex: 20 }} />

            {/* HUD React */}

            <div
                className="game-ui-event-boundary"
                onClick={stopUiEventPropagation}
                onDoubleClick={stopUiEventPropagation}
                onContextMenu={stopUiEventPropagation}
                onPointerDown={stopUiEventPropagation}
                onPointerUp={stopUiEventPropagation}
                onPointerMove={stopUiEventPropagation}
                onMouseDown={stopUiEventPropagation}
                onMouseUp={stopUiEventPropagation}
                onTouchStart={stopUiEventPropagation}
                onTouchEnd={stopUiEventPropagation}
                onWheel={stopUiEventPropagation}
            >
            <InventoryHUD />
            <CosmicStatusHUD />
            <JournalModal />
            <SmokingOverlay /> {/* <-- C'est lui qui affiche le background smokeBackground.jpg */}
            <ConnectionBoardModal />

            {/* Overlays narratifs & Toasts */}
            <NarrativeDialog />
            <CenterNarrativeModal />
            <DocumentViewer />
            <StatToast />

            {/* Overlay paupières (z-index max) */}
            <EyelidsOverlay isClosing={isEyelidsClosing} />
            <button
                type="button"
                className={`right-controls-toggle ${rightControlsVisible ? 'expanded' : 'collapsed'}`}
                onClick={() => {
                    if (rightControlsVisible) useGameStore.getState().setAudioSettingsOpen(false);
                    setRightControlsVisible((visible) => !visible);
                }}
                aria-expanded={rightControlsVisible}
                aria-label={rightControlsVisible ? 'Masquer les réglages' : 'Afficher les réglages'}
                title={rightControlsVisible ? 'Masquer les réglages' : 'Afficher les réglages'}
            >
                {rightControlsVisible ? '›' : '‹'}
            </button>
            {rightControlsVisible && (
                <>
                    <FullscreenButton isFullscreen={isFullscreen} />
                    <AudioSettings />
                </>
            )}
            </div>
        </div>
    );
};

export default App;
