import Phaser from 'phaser';
import { useGameStore } from '../../store/useGameStore';

export class DreamScene extends Phaser.Scene {
    private bgImage!: Phaser.GameObjects.Image;
    private flashOverlay!: Phaser.GameObjects.Rectangle;

    constructor() {
        super('DreamScene');
    }

    preload() {
        // Arrière-plan de la silhouette dans le brouillard
        this.load.image('nyarlathotep_bg', '/assets/nyarlathotep.jpg');
    }

    create() {
        const store = useGameStore.getState();
        store.setScene('DreamScene');

        this.cameras.main.setBackgroundColor('#000000');

        // Visuel de fond
        this.bgImage = this.add.image(640, 360, 'nyarlathotep_bg')
            .setDisplaySize(1280, 720)
            .setAlpha(0);

        // Flash blanc pour le climax
        this.flashOverlay = this.add.rectangle(640, 360, 1280, 720, 0xffffff)
            .setAlpha(0)
            .setDepth(999);

        // Apparition lente de la scène
        this.tweens.add({
            targets: this.bgImage,
            alpha: 1,
            duration: 3000,
            onComplete: () => {
                this.time.delayedCall(800, () => {
                    this.startDialogueSequence();
                });
            }
        });
    }

    private startDialogueSequence() {
        const store = useGameStore.getState();

        // Utilisation du composant de dialogue classique (DialogueOverlay / NarrativeDialog)
        store.setDialog({
            textKey: 'dream.scene_1.steps',
            onComplete: () => {
                this.triggerClimaxAndWakeUp();
            }
        });
    }

    private triggerClimaxAndWakeUp() {
        const store = useGameStore.getState();

        // Secousse et flash de fin de rêve
        this.cameras.main.shake(300, 0.025);

        this.tweens.add({
            targets: this.flashOverlay,
            alpha: 0.8,
            duration: 100,
            yoyo: true,
            hold: 150,
            onComplete: () => {
                // 1. Gain de Conscience Cosmique (+15)
                store.modifyStat('consciousness', 15);

                // 2. Fermeture des paupières via l'overlay React
                store.setEyelidsClosing(true);

                // 3. Réveil et retour dans le bureau d'Arkham
                this.time.delayedCall(1800, () => {
                    store.setEyelidsClosing(false);
                    store.setScene('ProfessorOffice');
                    this.scene.start('ProfessorOffice');
                });
            }
        });
    }
}