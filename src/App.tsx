
import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { phaserGameConfig } from './game/config';
import { CosmicBackground } from './components/CosmicBackground';
import { TrapezohedronHUD } from './components/TrapezohedronHUD';
import { InventoryHUD } from './components/InventoryHUD';
import { DialogueOverlay } from './components/DialogueOverlay';
import { NarrativeDialog } from './components/ui/NarrativeDialog';
import { DocumentViewer } from './components/ui/DocumentViewer';
import { StatToast } from './components/ui/StatToast';
import { CenterNarrativeModal } from './components/ui/CenterNarrativeModal';
import './i18n';

export const App: React.FC = () => {
    const gameRef = useRef<Phaser.Game | null>(null);

    useEffect(() => {
        if (!gameRef.current) {
            gameRef.current = new Phaser.Game(phaserGameConfig);
        }
    }, []);

    return (
        <div style={{ position: 'relative', width: '100vw', height: '100vh', background: '#000', overflow: 'hidden', margin: 0, padding: 0 }}>
            {/* Canvas Phaser */}
            <div id="phaser-container" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, width: '100%', height: '100%' }} />

            {/* Fond cosmique (réservé pour extension future) */}
            <CosmicBackground />

            {/* Effets CRT */}
            <div className="scanlines" style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, pointerEvents: 'none', zIndex: 20 }} />
            <div className="vignette"  style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, pointerEvents: 'none', zIndex: 20 }} />

            {/* HUD React */}
            <TrapezohedronHUD />
            <InventoryHUD />
            <DialogueOverlay />

            {/* Overlays narratifs & Toasts */}
            <NarrativeDialog />
            <CenterNarrativeModal />
            <DocumentViewer />
            <StatToast />
        </div>
    );
};

export default App;