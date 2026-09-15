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

    constructor() {
        super('ProfessorOffice');
    }

    preload() {
        this.load.image('city_night', '/assets/cityNight.jpg');
        this.load.image('office_interior', '/assets/Desk.jpg');
        this.load.image('letter_asset', '/assets/letterAsset.png');

        // Gestion de la sécurité sur le chargement audio pour éviter les blocages de scène
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
        useGameStore.getState().setScene('ProfessorOffice');
        this.cameras.main.setBackgroundColor('#000000');
        this.cameras.main.fadeIn(1000, 0, 0, 0);

        // --- INVENTAIRE : Injection des objets de départ ---
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

        // Surveillance du store pour la vue Trapezoèdre et la consommation obligatoire du tuto
        this.unsubscribeStore = useGameStore.subscribe((state, prevState) => {
            if (this.isOfficeVisible) {
                this.updateTrueViewVisibility(state.trapezohedron?.trueViewActive ?? false);
            }

            // Détection stricte de la consommation du Whisky pendant le tuto
            if (this.waitingForConsumption) {
                const hadWhisky = prevState.inventory.some((item) => item.id === 'whisky');
                const hasWhisky = state.inventory.some((item) => item.id === 'whisky');

                // Dès que l'objet 'whisky' disparaît de l'inventaire
                if (hadWhisky && !hasWhisky) {
                    this.waitingForConsumption = false;
                    this.triggerExhaustionTutorial();
                }
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
            examineText: 'Du tabac brun séché. Rouler une cigarette permet de rassembler ses idées et de calmer le cœur qui bat trop vite.',
            quantity: 1,
            stackable: true,
            consumable: true
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

                store.openDocument({
                    title: i18next.t('intro.letter_title'),
                    content: i18next.t('intro.letter_content'),
                    onClose: () => {
                        if (!isAlreadyRead) {
                            store.updateAct1Progress({ letterRead: true });

                            const currentConsciousness = store.consciousness || 0;
                            const mentalDelta = currentConsciousness > 10 ? -10 : -20;

                            store.modifyStat('mental', mentalDelta);

                            // 1. Tuto : Santé Mentale
                            this.time.delayedCall(600, () => {
                                store.setDialog({
                                    textKey: 'intro.tutoriel_jauges_reaction',
                                    type: 'center',
                                    onComplete: () => {
                                        // 2. Tuto : Inventaire
                                        this.time.delayedCall(400, () => {
                                            store.setDialog({
                                                textKey: 'intro.tutoriel_inventaire',
                                                type: 'center',
                                                onComplete: () => {
                                                    // OBLIGATION : On active l'écoute de la consommation du whisky
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
            // 3. Tuto : Épuisement & Rêves
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

        // Désabonnement du store Zustand pour éviter l'erreur de "entries" sur la scène en destruction
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