import Phaser from 'phaser';
import { useGameStore } from '../../store/useGameStore';
import { InteractiveObject } from '../helper/InteractiveObject.ts';
import i18next from 'i18next'; // À ajouter en haut de ton fichier si ce n'est pas déjà importé

export class ProfessorOfficeScene extends Phaser.Scene {
    private cityBgGroup!: Phaser.GameObjects.Group;
    private officeBgGroup!: Phaser.GameObjects.Group;
    private normalGroup!: Phaser.GameObjects.Group;
    private trueViewGroup!: Phaser.GameObjects.Group;
    private unsubscribeStore?: () => void;
    private isOfficeVisible: boolean = false;
    private currentAmbientSound: Phaser.Sound.BaseSound | null = null;
    private letterObject?: InteractiveObject;

    constructor() {
        super('ProfessorOffice');
    }

    preload() {
        this.load.image('city_night', '/assets/cityNight.jpg');
        this.load.image('office_interior', '/assets/Desk.jpg');
        this.load.image('letter_asset', '/assets/letterAsset.png');

        if (!this.cache.audio.exists('street_rain')) {
            this.load.audio('street_rain', '/assets/streetRain.mp3');
        }
        if (!this.cache.audio.exists('desk_rain')) {
            this.load.audio('desk_rain', '/assets/deskRain.mp3');
        }
    }

    create() {
        useGameStore.getState().setScene('ProfessorOffice');
        this.cameras.main.setBackgroundColor('#000000');
        this.cameras.main.fadeIn(1000, 0, 0, 0);

        this.cityBgGroup = this.add.group();
        this.officeBgGroup = this.add.group();
        this.normalGroup = this.add.group();
        this.trueViewGroup = this.add.group();

        this.createCityBackground();
        this.createOfficeBackground();

        // Tout le contenu du bureau et les objets interactifs sont masqués au départ
        this.officeBgGroup.setVisible(false);
        this.normalGroup.setVisible(false);
        this.trueViewGroup.setVisible(false);

        this.playAmbientSound('street_rain', 0.2);

        this.unsubscribeStore = useGameStore.subscribe((state) => {
            if (this.isOfficeVisible) {
                this.updateTrueViewVisibility(state.trapezohedron?.trueViewActive ?? false);
            }
        });

        this.time.delayedCall(800, () => {
            this.showLocationIntro(() => {
                useGameStore.getState().setDialog({
                    textKey: 'intro.monologue_city_steps',
                    onComplete: () => this.transitionToOffice(),
                });
            });
        });
    }

    private createCityBackground() {
        const cityImg = this.add.image(640, 360, 'city_night').setDisplaySize(1280, 720);
        this.cityBgGroup.add(cityImg);
    }

    private createOfficeBackground() {
        const officeImg = this.add.image(640, 360, 'office_interior').setDisplaySize(1280, 720);
        this.officeBgGroup.add(officeImg);

        // Création de l'objet interactif de la lettre
        this.letterObject = new InteractiveObject({
            scene: this,
            x: 640,
            y: 480,
            texture: 'letter_asset',
            scale: 0.5,
            actionLabel: "Lire",
            onClick: () => {
                const store = useGameStore.getState() as any;
                const isAlreadyRead = store.act1Progress?.letterRead;

                store.openDocument({
                    title: i18next.t('intro.letter_title'),
                    content: i18next.t('intro.letter_content'),
                    onClose: () => {
                        // S'exécute uniquement à la première fermeture
                        if (!isAlreadyRead) {
                            store.updateAct1Progress({ letterRead: true });

                            const currentConsciousness = store.consciousness || 0;
                            const mentalDelta = currentConsciousness > 10 ? -10 : -20;

                            store.modifyStat('mental', mentalDelta);

                            this.time.delayedCall(600, () => {
                                store.setDialog({
                                    textKey: 'intro.tutoriel_jauges_reaction',
                                    type: 'center', // <--- C'est ici qu'il faut l'ajouter !
                                });
                            });
                        }
                    }
                });
            }
        });

        // On s'assure que l'élément visuel de la lettre est bien inclus dans normalGroup
        // pour obéir au masquage global pendant la vue de la ville
        this.normalGroup.add(this.letterObject.getContainer());

        const trueG = this.add.graphics();
        trueG.fillStyle(0x3b0764, 0.25);
        trueG.fillRect(0, 0, 1280, 720);
        this.trueViewGroup.add(trueG);
    }

    private openLetterDocument() {
        const store = useGameStore.getState() as any;
        if (typeof store.openDocument === 'function') {
            store.openDocument({
                title: i18next.t('intro.letter_title'),
                content: i18next.t('intro.letter_content'),
                onClose: () => {
                    // Impact sur la santé mentale à la fermeture
                    store.modifyStat('mental', -15);

                    this.time.delayedCall(600, () => {
                        store.setDialog({
                            textKey: 'intro.tutoriel_jauges_reaction',
                            type: 'center', // <--- Force l'affichage au milieu de l'écran
                        });
                    });
                }
            });
        }
    }

    private showLocationIntro(onComplete: () => void) {
        const locationText = this.add.text(640, 580, "Arkham, Massachusetts — Janvier 1925", {
            fontFamily: '"Tangerine", cursive',
            fontSize: '56px',
            color: '#cbd5e1',
            fontStyle: 'bold',
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: locationText,
            alpha: 1,
            duration: 1800,
            hold: 3500,
            yoyo: true,
            onComplete: () => {
                locationText.destroy();
                onComplete();
            }
        });
    }

    private playAmbientSound(key: string, volume: number) {
        try {
            if (this.currentAmbientSound) {
                this.currentAmbientSound.stop();
            }
            if (this.cache.audio.exists(key)) {
                this.currentAmbientSound = this.sound.add(key, { volume: 0, loop: true });
                this.currentAmbientSound.play();
                this.tweens.add({
                    targets: this.currentAmbientSound,
                    volume: volume,
                    duration: 2000,
                });
            }
        } catch (e) {
            console.warn('Ambient audio restricted:', e);
        }
    }

    private transitionToOffice() {
        this.cameras.main.fadeOut(800, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.isOfficeVisible = true;
            this.cityBgGroup.setVisible(false);

            // Révélation de l'intérieur du bureau et des éléments normaux (dont la lettre)
            this.officeBgGroup.setVisible(true);
            this.normalGroup.setVisible(true);

            this.playAmbientSound('desk_rain', 0.15);

            const isTrueView = useGameStore.getState().trapezohedron?.trueViewActive ?? false;
            this.updateTrueViewVisibility(isTrueView);

            if (typeof useGameStore.getState().saveGame === 'function') {
                useGameStore.getState().saveGame();
            }

            this.cameras.main.fadeIn(1000, 0, 0, 0);
            this.time.delayedCall(400, () => {
                useGameStore.getState().setDialog({
                    textKey: 'intro.monologue_office_steps',
                });
            });
        });
    }

    private updateTrueViewVisibility(active: boolean) {
        this.trueViewGroup.setVisible(active);
    }

    destroy() {
        if (this.unsubscribeStore) {
            this.unsubscribeStore();
        }
        if (this.currentAmbientSound) {
            this.currentAmbientSound.stop();
        }
        if (this.letterObject) {
            this.letterObject.destroy();
        }
    }
}