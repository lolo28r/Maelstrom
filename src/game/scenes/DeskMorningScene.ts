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
            // 1. La musique classique principale (Schubert / Piano feutré)
            this.musicOst = new Audio('/assets/ostDeskDay.mp3');
            this.musicOst.loop = true;
            this.musicOst.volume = 0.18;
            this.musicOst.play().catch(err => console.warn("Lecture ostDeskDay bloquée :", err));

            // 2. Le grésillement du vinyle (Texture rétro très discrète)
            this.vinylSound = new Audio('/assets/vinyl.mp3');
            this.vinylSound.loop = true;
            this.vinylSound.volume = 0.06;
            this.vinylSound.play().catch(err => console.warn("Lecture vinyl bloquée :", err));

            // 3. Le bruit de la pièce / souffle feutré (Fond silencieux)
            this.quietRoomSound = new Audio('/assets/quietRoom.mp3');
            this.quietRoomSound.loop = true;
            this.quietRoomSound.volume = 0.05;
            this.quietRoomSound.play().catch(err => console.warn("Lecture quietRoom bloquée :", err));

            // 4. L'ambiance de rue lointaine (Très bas volume pour suggérer l'extérieur)
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

        // Affichage de la modale centrale de tutoriel
        store.setDialog({
            textKey: 'act1_morning.tutorial_desc',
            type: 'center', // <--- Force l'utilisation du CenterNarrativeModal
            onComplete: () => {
                // Une fois que le joueur clique sur [ COMPRIS ], on active la zone de sortie
                this.setupExitHotspot();
            }
        });
    }

    setupExitHotspot() {
        // Zone interactive discrète (Point-and-Click) pour laisser le joueur explorer son inventaire
        const exitZone = this.add.zone(1150, 650, 120, 60)
            .setInteractive({ useHandCursor: true });

        const exitText = this.add.text(1150, 650, "➔ Sortir", {
            fontFamily: 'serif',
            fontSize: '18px',
            color: '#aaaaaa'
        }).setOrigin(0.5);

        exitZone.on('pointerover', () => exitText.setColor('#ffffff'));
        exitZone.on('pointerout', () => exitText.setColor('#aaaaaa'));

        exitZone.on('pointerdown', () => {
            exitZone.disableInteractive();
            exitText.destroy();
            this.triggerFreshAirChoice();
        });
    }

    triggerFreshAirChoice() {
        const store = useGameStore.getState();

        store.setDialog({
            textKey: 'act1_morning.need_fresh_air',
            type: 'bottom',
            onComplete: () => {
                store.setDialog({
                    textKey: 'act1_morning.choice_prompt',
                    type: 'bottom',
                    choices: [
                        {
                            id: 'GO_TO_ASYLUM',
                            text: i18n.t('act1_morning.choice_asylum'),
                            consequences: { mentalDelta: 2 }
                        },
                        {
                            id: 'GO_TO_CITY',
                            text: i18n.t('act1_morning.choice_city'),
                            consequences: { exhaustionDelta: 5 }
                        }
                    ],
                    onComplete: (selectedChoiceId?: string) => {
                        if (!selectedChoiceId) return;

                        const consequences = selectedChoiceId === 'GO_TO_ASYLUM'
                            ? { mentalDelta: 2 }
                            : { exhaustionDelta: 5 };

                        store.recordChoice(selectedChoiceId, 'DeskMorningScene', consequences);
                        this.transitionToDestination(selectedChoiceId);
                    }
                });
            }
        });
    }

    transitionToDestination(choiceId: string) {
        // --- COUPURE PROPRE DES QUATRE PISTES AUDIO ---
        if (this.musicOst) { this.musicOst.pause(); this.musicOst.currentTime = 0; }
        if (this.vinylSound) { this.vinylSound.pause(); this.vinylSound.currentTime = 0; }
        if (this.quietRoomSound) { this.quietRoomSound.pause(); this.quietRoomSound.currentTime = 0; }
        if (this.streetAmbianceSound) { this.streetAmbianceSound.pause(); this.streetAmbianceSound.currentTime = 0; }

        this.cameras.main.fadeOut(1000, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            if (choiceId === 'GO_TO_ASYLUM') {
                this.scene.start('AsylumOfficeScene');
            } else {
                this.scene.start('CityExplorerScene');
            }
        });
    }
}