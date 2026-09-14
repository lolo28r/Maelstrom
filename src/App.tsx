import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { phaserGameConfig } from './game/config';
import { CosmicBackground } from './components/CosmicBackground';
import { CosmicConsciousnessGauge } from './components/CosmicConsciousnessGauge';
import { TrapezohedronHUD } from './components/TrapezohedronHUD';
import { InventoryHUD } from './components/InventoryHUD';
import { DialogueOverlay } from './components/DialogueOverlay';
import { NarrativeDialog } from './components/ui/NarrativeDialog';
import { DocumentViewer } from './components/ui/DocumentViewer';
import './i18n';

export const App: React.FC = () => {
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!gameRef.current) {
      gameRef.current = new Phaser.Game(phaserGameConfig);
    }
  }, []);

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden m-0 p-0">
      {/* Phaser 2D Game Canvas */}
      <div id="phaser-container" className="absolute inset-0 w-full h-full" />

      {/* Cosmic Nebula Canvas Overlay */}
      <CosmicBackground />

      {/* CRT Scanlines & Vignette Shading */}
      <div className="absolute inset-0 scanlines pointer-events-none z-20" />
      <div className="absolute inset-0 vignette pointer-events-none z-20" />

      {/* HD Vector UI Layer */}
      <CosmicConsciousnessGauge />
      <TrapezohedronHUD />
      <InventoryHUD />
      <DialogueOverlay />

      {/* Narrative Monologues & Document Viewer Overlays */}
      <NarrativeDialog />
      <DocumentViewer />
    </div>
  );
};

export default App;
