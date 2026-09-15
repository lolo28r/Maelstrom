import Phaser from 'phaser';
import { useGameStore } from '../../store/useGameStore';

interface InteractiveConfig {
    scene: Phaser.Scene;
    x: number;
    y: number;
    texture: string;
    scale?: number;
    actionLabel?: string;
    onClick: () => void;
    hasBeenRead?: () => boolean; // <--- Optionnel : vérifie si l'objet a déjà été consommé/lu
}

export class InteractiveObject {
    private container: Phaser.GameObjects.Container;
    private image: Phaser.GameObjects.Image;
    private tooltipText?: Phaser.GameObjects.Text;
    private isHovered: boolean = false;

    constructor(config: InteractiveConfig) {
        const { scene, x, y, texture, scale = 1, actionLabel = "Examiner", onClick, hasBeenRead } = config;

        this.container = scene.add.container(x, y);

        this.image = scene.add.image(0, 0, texture).setScale(scale).setInteractive({ useHandCursor: true });
        this.container.add(this.image);

        if (actionLabel) {
            this.tooltipText = scene.add.text(0, (-this.image.displayHeight / 2) - 15, `[ ${actionLabel} ]`, {
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: '18px',
                color: '#00f0ff',
                backgroundColor: '#020408cc',
                padding: { x: 6, y: 2 }
            }).setOrigin(0.5).setAlpha(0);
            this.container.add(this.tooltipText);
        }

        this.image.on('pointerover', () => {
            if (this.isInteractionBlocked()) return;
            this.isHovered = true;
            this.image.setScale(scale * 1.1);
            this.image.setTint(0xffffff);
            if (this.tooltipText) this.tooltipText.setAlpha(1);
        });

        this.image.on('pointerout', () => {
            this.isHovered = false;
            this.image.setScale(scale);
            this.image.clearTint();
            if (this.tooltipText) this.tooltipText.setAlpha(0);
        });

        this.image.on('pointerdown', () => {
            if (this.isInteractionBlocked()) return;

            // Si l'objet a déjà été lu/utilisé, on peut changer dynamiquement son comportement ou son libellé si besoin,
            // mais l'action principale s'exécute quand même (ex: réouvrir la lettre sans le malus).
            onClick();
        });
    }

    private isInteractionBlocked(): boolean {
        const store = useGameStore.getState() as any;
        if (store.currentDialog || store.isDialogueActive || store.activeDocument) {
            return true;
        }
        return false;
    }

    public getContainer(): Phaser.GameObjects.Container {
        return this.container;
    }

    public setVisible(visible: boolean) {
        this.container.setVisible(visible);
        if (!visible) {
            this.image.disableInteractive();
        } else {
            this.image.setInteractive({ useHandCursor: true });
        }
    }

    public destroy() {
        this.container.destroy();
    }
}