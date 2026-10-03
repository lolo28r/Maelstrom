import Phaser from 'phaser';
import { getSfxVolume } from '../../audio/audioMix';
import { useGameStore } from '../../store/useGameStore';
import { InteractiveObject } from '../helper/InteractiveObject.ts';
import i18next from 'i18next';

export class ProfessorOfficeScene extends Phaser.Scene {
    private cityBgGroup!: Phaser.GameObjects.Group;
    private officeBgGroup!: Phaser.GameObjects.Group;
    private normalGroup!: Phaser.GameObjects.Group;
    private currentAmbientSound: Phaser.Sound.BaseSound | null = null;
    private letterObject?: InteractiveObject;

    constructor() {
        super('ProfessorOffice');
    }

    preload() {
        const baseUrl = import.meta.env.BASE_URL;

        this.load.image('city_night', `${baseUrl}assets/cityNight.jpg`);
        this.load.image('office_interior', `${baseUrl}assets/Desk.jpg`);
        this.load.image('letter_asset', `${baseUrl}assets/letterAsset.png`);

        this.load.on('loaderror', (fileObj: Phaser.Loader.File) => {
            if (fileObj.type === 'audio') {
                console.warn(`[Audio Warning] Fichier non trouvé ou corrompu ignoré : ${fileObj.key}`);
            }
        });

        if (!this.cache.audio.exists('street_rain')) {
            this.load.audio('street_rain', `${baseUrl}assets/streetRain.mp3`);
        }
        if (!this.cache.audio.exists('desk_rain')) {
            this.load.audio('desk_rain', `${baseUrl}assets/deskRain.mp3`);
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

        this.createCityBackground();
        this.createOfficeBackground();

        this.officeBgGroup.setVisible(false);
        this.normalGroup.setVisible(false);

        this.playAmbientSound('street_rain', 0.3);

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
        const baseUrl = import.meta.env.BASE_URL;

        store.addItem({
            id: 'whisky',
            name: i18next.t('items.whisky.name'),
            icon: `${baseUrl}assets/whiskyAsset.png`,
            description: i18next.t('items.whisky.description'),
            examineText: i18next.t('items.whisky.examineText'),
            quantity: 1,
            stackable: true,
            consumable: true
        });

        store.addItem({
            id: 'tobacco',
            name: i18next.t('items.tobacco.name'),
            icon: `${baseUrl}assets/tabac.png`,
            description: i18next.t('items.tobacco.description'),
            examineText: i18next.t('items.tobacco.examineText'),
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
            actionLabel: i18next.t('scene_actions.read'),
            onClick: () => {
                const store = useGameStore.getState();
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
                            i18next.t('journal.officeArchiveTimestamp')
                        );

                        if (!isAlreadyRead) {
                            store.updateAct1Progress({ letterRead: true });

                            store.grantFragment('asylum_letter_decline');
                            store.modifyStat('lucidity', -15);

                            this.time.delayedCall(600, () => {
                                store.setDialog({
                                    textKey: 'intro.tutoriel_jauges_reaction',
                                    type: 'center',
                                    onComplete: () => {
                                        this.time.delayedCall(400, () => {
                                            store.setDialog({
                                                textKey: 'new_content.office.prompt',
                                                type: 'bottom',
                                                choices: [
                                                    { id: 'office_verify_letter', text: i18next.t('new_content.office.verify'), consequences: {} },
                                                    { id: 'office_drink_whisky', text: i18next.t('new_content.office.drink'), consequences: {} },
                                                    { id: 'office_smoke_to_assess', text: i18next.t('new_content.office.smoke'), consequences: {} },
                                                ],
                                                onComplete: (choiceId) => this.resolveOfficeCopingChoice(choiceId),
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

    }

    private resolveOfficeCopingChoice(choiceId?: string) {
        const store = useGameStore.getState();
        if (choiceId === 'office_verify_letter') {
            store.useAnchor('act1_office', 'office_verify_letter', 10);
        } else if (choiceId === 'office_drink_whisky') {
            store.suppressCrisis();
            store.removeItemFromInventory('whisky');
        } else if (choiceId === 'office_smoke_to_assess') {
            store.setStatusRevealed(false);
            store.setSmokingActive(true);
            store.removeItemFromInventory('tobacco');
        }
        store.setInventoryLocked(false);
        store.setDialog({
            textKey: choiceId === 'office_drink_whisky'
                ? 'new_content.office.reactionDrink'
                : choiceId === 'office_smoke_to_assess'
                    ? 'new_content.office.reactionSmoke'
                    : 'new_content.office.reactionVerify',
            type: 'bottom',
            onComplete: () => this.startDreamTransition(),
        });
    }

    private startDreamTransition() {
        const store = useGameStore.getState();

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
        const locationText = this.add.text(640, 580, i18next.t('scene_ui.officeLocation'), {
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
                    volume: getSfxVolume() * volume,
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
            this.cityBgGroup.setVisible(false);

            this.officeBgGroup.setVisible(true);
            this.normalGroup.setVisible(true);

            this.playAmbientSound('desk_rain', 0.22);

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

    destroy() {
        if (this.currentAmbientSound) {
            this.currentAmbientSound.stop();
        }
        if (this.letterObject) {
            this.letterObject.destroy();
        }
    }
}
