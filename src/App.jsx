import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { MainMenu } from './game/scenes/MainMenu';
import { IntroSequence } from './game/scenes/IntroSequence';

const gameConfig = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  parent: 'phaser-container',
  backgroundColor: '#000000',
  scale: {
    mode: Phaser.Scale.FIT,          // Remplit l'écran en gardant le ratio 16:9
    autoCenter: Phaser.Scale.CENTER_BOTH // Centre le canvas à la perfection
  },
  scene: [MainMenu, IntroSequence]
};

function App() {
  const gameRef = useRef(null);

  useEffect(() => {
    if (!gameRef.current) {
      gameRef.current = new Phaser.Game(gameConfig);
    }
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div className="w-screen h-screen bg-black flex items-center justify-center overflow-hidden m-0 p-0">
      <div id="phaser-container" className="w-full h-full flex items-center justify-center" />
    </div>
  );
}

export default App;