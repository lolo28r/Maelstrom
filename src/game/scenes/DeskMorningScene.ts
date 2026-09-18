import Phaser from 'phaser';
import { useGameStore } from '../../store/useGameStore';
import i18n from '../../i18n';

export class DeskMorningScene extends Phaser.Scene {
    private musicOst?: HTMLAudioElement;
    private vinylSound?: HTMLAudioElement;
    private quietRoomSound?: HTMLAudioElement;
    private streetAmbianceSound?: HTMLAudioElement;

    constructor() {
        super('DeskMorningScene');
    }

    preload() {
        this.load.image('deskDay', '/assets/DeskDay.jpg');
    }

    create() {
        useGameStore.getState().setScene('DeskMorningScene');
        this.cameras.main.setBackgroundColor('#000000');
        this.cameras.main.fadeIn(1500, 0, 0, 0);

        const bg = this.add.image(640, 360, 'deskDay');
        bg.setDisplaySize(1280, 720);
        bg.setAlpha(0.7);

        // --- LANCEMENT DE L'AMBIANCE AUDIO DU MATIN (Mix enrichi) ---
        try {
            this.musicOst = new Audio('/assets/ostDeskDay.mp3');
            this.musicOst.loop = true;
            this.musicOst.volume = 0.18;
            this.musicOst.play().catch(err => console.warn("Lecture ostDeskDay bloquée :", err));

            this.vinylSound = new Audio('/assets/vinyl.mp3');
            this.vinylSound.loop = true;
            this.vinylSound.volume = 0.06;
            this.vinylSound.play().catch(err => console.warn("Lecture vinyl bloquée :", err));

            this.quietRoomSound = new Audio('/assets/quietRoom.mp3');
            this.quietRoomSound.loop = true;
            this.quietRoomSound.volume = 0.05;
            this.quietRoomSound.play().catch(err => console.warn("Lecture quietRoom bloquée :", err));

            this.streetAmbianceSound = new Audio('/assets/streetAmbiance.mp3');
            this.streetAmbianceSound.loop = true;
            this.streetAmbianceSound.volume = 0.01;
            this.streetAmbianceSound.play().catch(err => console.warn("Lecture streetAmbiance bloquée :", err));

        } catch (e) {
            console.warn("Impossible d'initialiser l'ambiance sonore du bureau :", e);
        }

        this.startMorningSequence();
    }

    startMorningSequence() {
        const store = useGameStore.getState();

        // 1. Premier dialogue : Le réveil / mal de crâne
        store.setDialog({
            textKey: 'act1_morning.headache',
            type: 'bottom',
            onComplete: () => {
                // 2. Deuxième dialogue : La constatation des objets manquants
                store.setDialog({
                    textKey: 'act1_morning.missing',
                    type: 'bottom',
                    onComplete: () => {
                        this.triggerJournalTutorial();
                    }
                });
            }
        });
    }

    triggerJournalTutorial() {
        const store = useGameStore.getState();

        // Déverrouillage du journal et ajout de la première note
        store.unlockJournal();
        store.addJournalNote(
            i18n.t('act1_morning.note_title'),
            i18n.t('act1_morning.note_content'),
            i18n.t('act1_morning.note_timestamp')
        );

        // Affichage de la modale centrale de tutoriel du journal
        store.setDialog({
            textKey: 'act1_morning.tutorial_desc',
            type: 'center',
            onComplete: () => {
                // Une fois validé, on active la zone de sortie de la pièce
                this.setupExitHotspot();
            }
        });
    }

    setupExitHotspot() {
        // Zone interactive discrète pour laisser le joueur explorer son inventaire avant de partir
        const exitZone = this.add.zone(1150, 650, 120, 60)
            .setInteractive({ useHandCursor: false }); // On gère via nos curseurs CSS

        const exitText = this.add.text(1150, 650, "➔ Sortir", {
            fontFamily: 'serif',
            fontSize: '18px',
            color: '#aaaaaa'
        }).setOrigin(0.5);

        exitZone.on('pointerover', () => {
            exitText.setColor('#ffffff');
            this.game.canvas.classList.add('cursor-path');
        });

        exitZone.on('pointerout', () => {
            exitText.setColor('#aaaaaa');
            this.game.canvas.classList.remove('cursor-path');
        });

        exitZone.on('pointerdown', () => {
            this.game.canvas.classList.remove('cursor-path');
            exitZone.disableInteractive();
            exitText.destroy();
            this.triggerFreshAirThought();
        });
    }

    triggerFreshAirThought() {
        const store = useGameStore.getState();

        // Pensée intime de Laurence : il faut sortir prendre l'air
        store.setDialog({
            textKey: 'act1_morning.need_fresh_air',
            type: 'bottom',
            onComplete: () => {
                store.recordChoice('LEAVE_DESK', 'DeskMorningScene', { exhaustionDelta: 5 });
                this.transitionToDestination();
            }
        });
    }

    transitionToDestination() {
        // --- COUPURE PROPRE DES QUATRE PISTES AUDIO ---
        if (this.musicOst) { this.musicOst.pause(); this.musicOst.currentTime = 0; }
        if (this.vinylSound) { this.vinylSound.pause(); this.vinylSound.currentTime = 0; }
        if (this.quietRoomSound) { this.quietRoomSound.pause(); this.quietRoomSound.currentTime = 0; }
        if (this.streetAmbianceSound) { this.streetAmbianceSound.pause(); this.streetAmbianceSound.currentTime = 0; }

        this.cameras.main.fadeOut(1000, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.scene.start('CityExplorerScene');
        });
    }
}