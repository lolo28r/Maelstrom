import Phaser from 'phaser';
import { MainMenuScene } from './scenes/MainMenuScene';
import { IntroSequenceScene } from './scenes/IntroSequenceScene';
import { ProfessorOfficeScene } from './scenes/ProfessorOfficeScene';
import { DreamScene } from "./scenes/DreamScene.ts";
import { DeskMorningScene } from './scenes/DeskMorningScene';
import { CityExplorerScene } from './scenes/CityExplorerScene';
import { ChapterEndScene } from './scenes/ChapterEndScene';

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
    },
    dom: {
        createContainer: true, // <--- Indispensable pour injecter du HTML/CSS (comme le titre en Tangerine)
    },
    scene: [MainMenuScene, IntroSequenceScene, ProfessorOfficeScene, DreamScene, DeskMorningScene, CityExplorerScene, ChapterEndScene],
};