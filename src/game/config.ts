import Phaser from 'phaser';
import { MainMenuScene } from './scenes/MainMenuScene';
import { IntroSequenceScene } from './scenes/IntroSequenceScene';
import { ProfessorOfficeScene } from './scenes/ProfessorOfficeScene';
import { DreamScene } from "./scenes/DreamScene.ts";
import { DeskMorningScene } from './scenes/DeskMorningScene';
import { CityExplorerScene } from './scenes/CityExplorerScene';
import { ChapterEndScene } from './scenes/ChapterEndScene';
import { NightmareScene } from './scenes/NightmareScene';
import { Day2OfficeScene } from './scenes/Day2OfficeScene';
import { AsylumScene } from './scenes/AsylumScene';
import { Day2CityScene } from './scenes/Day2CityScene';
import { Day2DreamScene } from './scenes/Day2DreamScene';
import { Day3ForestScene } from './scenes/Day3ForestScene';
import { Day3SilentDreamScene } from './scenes/Day3SilentDreamScene';
import { Day4ThomasScene } from './scenes/Day4ThomasScene';

export const phaserGameConfig: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    parent: 'phaser-container',
    backgroundColor: '#020408',
    pixelArt: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        fullscreenTarget: 'game-shell',
    },
    dom: {
        createContainer: true, // <--- Indispensable pour injecter du HTML/CSS (comme le titre en Tangerine)
    },
    scene: [MainMenuScene, IntroSequenceScene, ProfessorOfficeScene, DreamScene, DeskMorningScene, CityExplorerScene, NightmareScene, ChapterEndScene, Day2OfficeScene, AsylumScene, Day2CityScene, Day2DreamScene, Day3ForestScene, Day3SilentDreamScene, Day4ThomasScene],
};
