import Phaser from 'phaser';
import { useGameStore } from '../../store/useGameStore';

export type SceneNavigationButtonKind = 'back' | 'forward';

interface SceneNavigationButtonConfig {
    scene: Phaser.Scene;
    kind: SceneNavigationButtonKind;
    label: string;
    onClick: () => void;
    isBlocked?: () => boolean;
}

export const isSceneInteractionBlocked = () => {
    const store = useGameStore.getState();
    return Boolean(
        store.currentDialog
        || store.activeDocument
        || store.selectedItem
        || store.connectionBoardOpen
        || store.audioSettingsOpen,
    );
};

export const createSceneNavigationButton = ({
    scene,
    kind,
    label,
    onClick,
    isBlocked = isSceneInteractionBlocked,
}: SceneNavigationButtonConfig) => {
    const isBack = kind === 'back';
    // Forward actions sit above the persistent journal HUD button. Keeping them
    // on the bottom edge lets the DOM overlay cover them and swallow the click.
    const button = scene.add.text(isBack ? 24 : 1256, isBack ? 24 : 630, label, {
        fontFamily: '"Cormorant Garamond", serif',
        fontSize: '18px',
        color: '#d2c8b5',
        backgroundColor: '#020408d9',
        padding: { x: 14, y: 8 },
    })
        .setOrigin(isBack ? 0 : 1, isBack ? 0 : 1)
        .setInteractive({ useHandCursor: false })
        .setDepth(1001);

    const canvas = scene.game.canvas;
    button.on('pointerover', () => {
        if (isBlocked()) return;
        button.setColor('#ffffff');
        canvas.classList.add('cursor-path');
    });
    button.on('pointerout', () => {
        button.setColor('#d2c8b5');
        canvas.classList.remove('cursor-path');
    });
    button.on('pointerdown', () => {
        if (isBlocked()) return;
        canvas.classList.remove('cursor-path');
        onClick();
    });

    return button;
};
