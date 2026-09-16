import Phaser from 'phaser';
import { useGameStore } from '../../store/useGameStore';
import { InteractiveObject } from '../helper/InteractiveObject.ts';
import i18next from 'i18next';

export class ProfessorOfficeScene extends Phaser.Scene {
    private cityBgGroup!: Phaser.GameObjects.Group;
    private officeBgGroup!: Phaser.GameObjects.Group;
    private normalGroup!: Phaser.GameObjects.Group;
    private trueViewGroup!: Phaser.GameObjects.Group;
    private unsubscribeStore?: () => void;
    private isOfficeVisible: boolean = false;
    private currentAmbientSound: Phaser.Sound.BaseSound | null = null;
    private letterObject?: InteractiveObject;
    private waitingForConsumption: boolean = false;
    private waitingForTobaccoConsumption: boolean = false; // Pour l'écoute du tabac

    constructor() {
        super('ProfessorOffice');
    }

    preload() {
        this.load.image('city_night', '/assets/cityNight.jpg');
        this.load.image('office_interior', '/assets/Desk.jpg');
        this.load.image('letter_asset', '/assets/letterAsset.png');

        this.load.on('loaderror', (fileObj: any) => {
            if (fileObj.type === 'audio') {
                console.warn(`[Audio Warning] Fichier non trouvé ou corrompu ignoré : ${fileObj.key}`);
            }
        });

        if (!this.cache.audio.exists('street_rain')) {
            this.load.audio('street_rain', '/assets/streetRain.mp3');
        }
        if (!this.cache.audio.exists('desk_rain')) {
            this.load.audio('desk_rain', '/assets/deskRain.mp3');
        }
    }

    create() {
        const store = useGameStore.getState();
        store.setScene('ProfessorOffice');

        // Verrouille l'inventaire au début de la scène pour le tutoriel
        store.setInventoryLocked(true);

        this.cameras.main.setBackgroundColor('#000000');
        this.cameras.main.fadeIn(1000, 0, 0, 0);

        this.initStarterInventory();

        this.cityBgGroup = this.add.group();
        this.officeBgGroup = this.add.group();
        this.normalGroup = this.add.group();
        this.trueViewGroup = this.add.group();

        this.createCityBackground();
        this.createOfficeBackground();

        this.officeBgGroup.setVisible(false);
        this.normalGroup.setVisible(false);
        this.trueViewGroup.setVisible(false);

        this.playAmbientSound('street_rain', 0.2);

        // Surveillance du store Zustand (Trapezoèdre, Whisky et Tabac)
        this.unsubscribeStore = useGameStore.subscribe((state, prevState) => {
            if (this.isOfficeVisible) {
                this.updateTrueViewVisibility(state.trapezohedron?.trueViewActive ?? false);
            }

            // Détection stricte de la consommation du Whisky pendant le tuto
            if (this.waitingForConsumption) {
                const hadWhisky = prevState.inventory.some((item) => item.id === 'whisky');
                const hasWhisky = state.inventory.some((item) => item.id === 'whisky');

                if (hadWhisky && !hasWhisky) {
                    this.waitingForConsumption = false;
                    this.triggerExhaustionTutorial();
                }
            }

            // --- Détection de la consommation de Tabac pour le rituel de lucidité ---
            const hadTobacco = prevState.inventory.some((item) => item.id === 'tobacco');
            const hasTobacco = state.inventory.some((item) => item.id === 'tobacco');

            // Si le tabac disparaît de l'inventaire (consommé)
            if (hadTobacco && !hasTobacco) {
                this.triggerTobaccoRitual();
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

    private initStarterInventory() {
        const store = useGameStore.getState();

        store.addItem({
            id: 'whisky',
            name: 'Flasque de Whisky',
            icon: '/assets/whiskyAsset.png',
            description: 'Bourbon de bas étage. Brûle la gorge, mais engourdit les nerfs.',
            examineText: 'Une flasque en métal cabossée qui sent l\'alcool fort. Idéal pour apaiser les crises d\'angoisse et faire remonter la Santé Mentale, au prix d\'une fatigue accrue.',
            quantity: 1,
            stackable: true,
            consumable: true
        });

        store.addItem({
            id: 'tobacco',
            name: 'Tabac à rouler',
            icon: '/assets/tabac.png',
            description: 'Une blague à tabac usée et quelques feuilles à rouler.',
            examineText: 'Du tabac brun séché. Rouler une cigarette permet de rassembler ses idées et de calmer le cœur qui bat trop vite pour évaluer son état mental.',
            quantity: 1,
            stackable: true,
            consumable: true
        });
    }

    private triggerTobaccoRitual() {
        const store = useGameStore.getState();

        store.modifyStat('mental', 15);
        store.modifyStat('exhaustion', 10);

        // Simple lancement du dialogue narratif
        store.setDialog({
            speaker: 'LAURENCE LINDNER',
            textKey: 'intro.tobacco_ritual_steps',
            type: 'bottom',
            onComplete: () => {
                // Une fois le dialogue fini, on active le mode fumette dans le store
                store.setSmokingActive(true);
            }
        });
    }

    private createCityBackground() {
        const cityImg = this.add.image(640, 360, 'city_night').setDisplaySize(1280, 720);
        this.cityBgGroup.add(cityImg);
    }

    private createOfficeBackground() {
        const officeImg = this.add.image(640, 360, 'office_interior').setDisplaySize(1280, 720);
        this.officeBgGroup.add(officeImg);
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

                const docTitle = i18next.t('intro.letter_title');
                const docContent = i18next.t('intro.letter_content');

                store.openDocument({
                    title: docTitle,
                    content: docContent,
                    onClose: () => {
                        // ARCHIVAGE SILENCIEUX (Pas de notification puisque le journal n'est pas encore débloqué)
                        store.silentAddArchivedDocument(
                            'arkham_letter',
                            docTitle,
                            docContent,
                            'Acte I - Bureau'
                        );

                        if (!isAlreadyRead) {
                            store.updateAct1Progress({ letterRead: true });

                            const currentConsciousness = store.consciousness || 0;
                            const mentalDelta = currentConsciousness > 10 ? -10 : -20;

                            store.modifyStat('mental', mentalDelta);

                            this.time.delayedCall(600, () => {
                                store.setDialog({
                                    textKey: 'intro.tutoriel_jauges_reaction',
                                    type: 'center',
                                    onComplete: () => {
                                        this.time.delayedCall(400, () => {
                                            store.setDialog({
                                                textKey: 'intro.tutoriel_inventaire',
                                                type: 'center',
                                                onComplete: () => {
                                                    store.setInventoryLocked(false);
                                                    this.waitingForConsumption = true;
                                                }
                                            });
                                        });
                                    }
                                });
                            });
                        }
                    }
                });
            }
        });
        this.normalGroup.add(this.letterObject.getContainer());

        const trueG = this.add.graphics();
        trueG.fillStyle(0x3b0764, 0.25);
        trueG.fillRect(0, 0, 1280, 720);
        this.trueViewGroup.add(trueG);
    }

    private triggerExhaustionTutorial() {
        const store = useGameStore.getState();

        this.time.delayedCall(1200, () => {
            store.setDialog({
                textKey: 'intro.tutoriel_epuisement',
                type: 'center',
                onComplete: () => {
                    this.startDreamTransition();
                }
            });
        });
    }

    private startDreamTransition() {
        const store = useGameStore.getState() as any;

        if (this.unsubscribeStore) {
            this.unsubscribeStore();
            this.unsubscribeStore = undefined;
        }

        this.time.delayedCall(500, () => {
            store.setDialog({
                textKey: 'intro.transition_sommeil',
                type: 'bottom',
                onComplete: () => {
                    if (typeof store.setEyelidsClosing === 'function') {
                        store.setEyelidsClosing(true);
                    }

                    if (this.currentAmbientSound) {
                        this.tweens.add({
                            targets: this.currentAmbientSound,
                            volume: 0,
                            duration: 2000
                        });
                    }

                    this.cameras.main.fadeOut(2500, 0, 0, 0);
                    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                        if (typeof store.setEyelidsClosing === 'function') {
                            store.setEyelidsClosing(false);
                        }
                        store.setScene('DreamScene');
                        this.scene.start('DreamScene');
                    });
                }
            });
        });
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
            console.warn('Ambient audio restricted or missing:', e);
        }
    }

    private transitionToOffice() {
        this.cameras.main.fadeOut(800, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.isOfficeVisible = true;
            this.cityBgGroup.setVisible(false);

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
        if (this.trueViewGroup && (this.trueViewGroup as any).defaultFrame !== undefined) {
            this.trueViewGroup.setVisible(active);
        }
    }

    destroy() {
        if (this.unsubscribeStore) {
            this.unsubscribeStore();
            this.unsubscribeStore = undefined;
        }
        if (this.currentAmbientSound) {
            this.currentAmbientSound.stop();
        }
        if (this.letterObject) {
            this.letterObject.destroy();
        }
    }
}