import Phaser from 'phaser';
import { useGameStore, ChoiceOption } from '../../store/useGameStore';
import { HotspotZone } from '../helper/HotSpotZone';
import i18n from '../../i18n';

type CityLocation = 'CARREFOUR' | 'JOURNAL_STREET' | 'PORTE_LIB' | 'ENTREE_LIB' | 'SALON' | 'TABAC' | 'EGLISE_EXT' | 'EGLISE_INT' | 'CHAPELLE' | 'SEPULCRE';

export class CityExplorerScene extends Phaser.Scene {
    private currentBg!: Phaser.GameObjects.Image;
    private thoughtText?: Phaser.GameObjects.Text;
    private activeHotspots: HotspotZone[] = [];
    private backButton?: Phaser.GameObjects.Text;

    private hasVisitedChurch: boolean = false;
    private hasSeenStatue: boolean = false;

    private currentLocation: CityLocation = 'CARREFOUR';

    constructor() {
        super({ key: 'CityExplorerScene' });
    }

    preload() {
        this.load.image('carrefour', 'assets/carrefour.jpg');
        this.load.image('journal', 'assets/journal.jpg');
        this.load.image('porteLib', 'assets/porteLib.jpg');
        this.load.image('entreeLib', 'assets/entreeLib.jpg');
        this.load.image('salon', 'assets/salon.png');
        this.load.image('tabac1', 'assets/tabac1.jpg');
        this.load.image('egliseExt', 'assets/egliseExt.jpg');
        this.load.image('eglise', 'assets/eglise.jpg');
        this.load.image('chapelleVierge', 'assets/chapelleVierge.jpg');
        this.load.image('priest', 'assets/priest.jpg');
    }

    create() {
        useGameStore.getState().setScene('CityExplorerScene');
        this.cameras.main.setBackgroundColor('#000000');
        this.cameras.main.fadeIn(1000, 0, 0, 0);

        this.enterCarrefour();
    }

    private clearSceneElements() {
        this.activeHotspots.forEach(h => h.destroy());
        this.activeHotspots = [];

        if (this.backButton) {
            this.backButton.destroy();
            this.backButton = undefined;
        }
        if (this.thoughtText) {
            this.thoughtText.destroy();
            this.thoughtText = undefined;
        }
    }

    private addHotspot(config: ConstructorParameters<typeof HotspotZone>[0]) {
        const hotspot = new HotspotZone(config);
        this.activeHotspots.push(hotspot);
        return hotspot;
    }

    // ==========================================
    // 1. CARREFOUR CENTRAL
    // ==========================================
    private enterCarrefour() {
        this.clearSceneElements();
        this.currentLocation = 'CARREFOUR';
        const { width, height } = this.scale;

        if (this.currentBg) this.currentBg.destroy();
        this.currentBg = this.add.image(width / 2, height / 2, 'carrefour').setDisplaySize(width, height);

        this.thoughtText = this.add.text(width / 2, 60, "Le givre craque sous mes pas. Le carrefour s'ouvre devant moi...", {
            fontFamily: 'serif', fontSize: '16px', color: '#a89f85', fontStyle: 'italic', align: 'center'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: this.thoughtText,
            alpha: { from: 0, to: 1 },
            duration: 1500, hold: 4000, yoyo: true,
            onComplete: () => { if (this.thoughtText) this.thoughtText.destroy(); }
        });

        this.addHotspot({
            scene: this, x: width * 0.5, y: height * 0.55, width: 160, height: 180,
            type: 'path', actionLabel: "Route de l'Asile",
            onClick: () => { }
        });

        this.addHotspot({
            scene: this, x: width * 0.82, y: height * 0.5, width: 220, height: 380,
            type: 'path', actionLabel: "S'engager dans la rue à droite",
            onClick: () => this.enterTobacco()
        });

        this.addHotspot({
            scene: this, x: width * 0.12, y: height * 0.5, width: 220, height: 380,
            type: 'path', actionLabel: "S'engager dans la rue à gauche",
            onClick: () => this.enterJournalStreet()
        });
    }

    // ==========================================
    // 2. BRANCHE GAUCHE : RUE & LIBRAIRIE
    // ==========================================
    private enterJournalStreet() {
        this.clearSceneElements();
        this.currentLocation = 'JOURNAL_STREET';
        const { width, height } = this.scale;
        if (this.currentBg) this.currentBg.destroy();
        this.currentBg = this.add.image(width / 2, height / 2, 'journal').setDisplaySize(width, height);

        const journalHotspot = this.addHotspot({
            scene: this, x: width * 0.42, y: height * 0.92, width: 180, height: 90,
            type: 'inspect', actionLabel: "Examiner le journal",
            onClick: () => {
                const store = useGameStore.getState();

                const title = i18n.t('act1_city.newspaper_eclipse.title');
                const content = i18n.t('act1_city.newspaper_eclipse.content');
                const timestamp = i18n.t('act1_city.newspaper_eclipse.timestamp');
                const noteTitle = i18n.t('act1_city.newspaper_eclipse.note_title');
                const noteContent = i18n.t('act1_city.newspaper_eclipse.note_content');

                store.addArchivedDocument('gazette_eclipse_1925', title, content, timestamp);
                store.addJournalNote(noteTitle, noteContent, timestamp);

                store.openDocument({
                    title: title,
                    content: content
                });

                journalHotspot.destroy();
                this.clearSceneElements();
                this.enterJournalStreet();
            }
        });

        this.addHotspot({
            scene: this, x: width * 0.5, y: height * 0.5, width: 250, height: 350,
            type: 'path', actionLabel: "Vers le fond de la rue",
            onClick: () => this.enterLibraryDoor()
        });

        this.createBackButton(() => this.enterCarrefour());
    }

    private enterLibraryDoor() {
        this.clearSceneElements();
        this.currentLocation = 'PORTE_LIB';
        const { width, height } = this.scale;
        if (this.currentBg) this.currentBg.destroy();
        this.currentBg = this.add.image(width / 2, height / 2, 'porteLib').setDisplaySize(width, height);

        this.addHotspot({
            scene: this, x: width * 0.58, y: height * 0.5, width: 180, height: 320,
            type: 'path', actionLabel: "Entrer dans la librairie",
            onClick: () => this.enterLibraryInterior()
        });

        this.createBackButton(() => this.enterJournalStreet());
    }

    private enterLibraryInterior() {
        this.clearSceneElements();
        this.currentLocation = 'ENTREE_LIB';
        const { width, height } = this.scale;
        if (this.currentBg) this.currentBg.destroy();
        this.currentBg = this.add.image(width / 2, height / 2, 'entreeLib').setDisplaySize(width, height);

        this.addHotspot({
            scene: this, x: width * 0.5, y: height * 0.5, width: 200, height: 350,
            type: 'path', actionLabel: "Avancer vers le salon",
            onClick: () => this.enterLibrarySalon()
        });

        this.createBackButton(() => this.enterLibraryDoor());
    }

    private enterLibrarySalon() {
        this.clearSceneElements();
        this.currentLocation = 'SALON';
        const { width, height } = this.scale;
        if (this.currentBg) this.currentBg.destroy();
        this.currentBg = this.add.image(width / 2, height / 2, 'salon').setDisplaySize(width, height);

        this.createBackButton(() => this.enterLibraryInterior());
    }

    // ==========================================
    // 3. BRANCHE DROITE : TABAC & ÉGLISE / CHAPELLE
    // ==========================================
    private enterTobacco() {
        this.clearSceneElements();
        this.currentLocation = 'TABAC';
        const { width, height } = this.scale;
        if (this.currentBg) this.currentBg.destroy();
        this.currentBg = this.add.image(width / 2, height / 2, 'tabac1').setDisplaySize(width, height);

        this.addHotspot({
            scene: this, x: width * 0.32, y: height * 0.55, width: 340, height: 450,
            type: 'inspect', actionLabel: "Acheter du tabac",
            onClick: () => { }
        });

        this.addHotspot({
            scene: this, x: width * 0.80, y: height * 0.45, width: 400, height: 450,
            type: 'path', actionLabel: "Continuer vers l'église",
            onClick: () => this.enterChurchExterior()
        });

        this.createBackButton(() => this.enterCarrefour());
    }

    private enterChurchExterior() {
        this.clearSceneElements();
        this.currentLocation = 'EGLISE_EXT';
        const { width, height } = this.scale;
        if (this.currentBg) this.currentBg.destroy();
        this.currentBg = this.add.image(width / 2, height / 2, 'egliseExt').setDisplaySize(width, height);

        this.addHotspot({
            scene: this, x: 963,
            y: 392,
            width: 220,
            height: 300,
            type: 'path', actionLabel: "Entrer dans l'église",
            onClick: () => this.enterChurchInterior()
        });

        this.createBackButton(() => this.enterTobacco());
    }

    private enterChurchInterior() {
        this.clearSceneElements();
        this.currentLocation = 'EGLISE_INT';
        const { width, height } = this.scale;
        if (this.currentBg) this.currentBg.destroy();
        this.currentBg = this.add.image(width / 2, height / 2, 'eglise').setDisplaySize(width, height);

        if (!this.hasVisitedChurch) {
            this.hasVisitedChurch = true;
            useGameStore.getState().setDialog({
                textKey: 'act1_church.first_entry',
                type: 'bottom'
            });
        }

        this.addHotspot({
            scene: this, x: width * 0.88, y: height * 0.5, width: 240, height: 720,
            type: 'path', actionLabel: "Vers la chapelle de la Sainte Vierge",
            onClick: () => this.enterChapel()
        });

        this.addHotspot({
            scene: this, x: width * 0.12, y: height * 0.5, width: 200, height: 720,
            type: 'path', actionLabel: "Vers la chapelle du Saint-Sépulcre",
            onClick: () => this.enterSepulchreSequence()
        });

        this.createBackButton(() => this.enterChurchExterior());
    }

    private enterChapel() {
        this.clearSceneElements();
        this.currentLocation = 'CHAPELLE';
        const { width, height } = this.scale;
        if (this.currentBg) this.currentBg.destroy();
        this.currentBg = this.add.image(width / 2, height / 2, 'chapelleVierge').setDisplaySize(width, height);

        // Hotspot interactif sur la statue de la Vierge (située au centre de la scène)
        this.addHotspot({
            scene: this,
            x: 646,
            y: 426,
            width: 180,
            height: 380,
            type: 'inspect',
            actionLabel: "Examiner la statue de la Vierge",
            onClick: () => {
                // Si la statue a déjà été observée, on ne relance rien ou on met une pensée courte
                if (this.hasSeenStatue) {
                    useGameStore.getState().startDialogue({
                        text: "La statue de pierre me regarde dans un silence de marbre. Inutile de m'attarder davantage ici.",
                        speaker: 'Laurence Lindner'
                    });
                    return;
                }

                this.hasSeenStatue = true;

                // 1. Premier dialogue d'observation de la statue
                useGameStore.getState().setDialog({
                    textKey: 'act1_church.first_statue_gaze',
                    type: 'bottom',
                    onComplete: () => {
                        // 2. Déclenchement de la pensée et des choix de prière
                        useGameStore.getState().setDialog({
                            textKey: 'act1_church.statue_thought',
                            type: 'bottom',
                            choices: [
                                {
                                    id: 'act1_church_pray_yes',
                                    text: i18n.t('act1_church.choice_pray_yes'),
                                    consequences: { mentalDelta: 10 },
                                },
                                {
                                    id: 'act1_church_pray_no',
                                    text: i18n.t('act1_church.choice_pray_no'),
                                    consequences: { mentalDelta: -5 },
                                }
                            ],
                            onComplete: (selectedChoiceId?: string) => {
                                const store = useGameStore.getState();
                                if (selectedChoiceId) {
                                    const consequences = selectedChoiceId === 'act1_church_pray_yes'
                                        ? { mentalDelta: 10 }
                                        : { mentalDelta: -5 };

                                    store.recordChoice(selectedChoiceId, this.currentLocation, consequences);
                                }
                                store.closeDialog();
                            }
                        });
                    }
                });
            }
        });

        this.createBackButton(() => this.enterChurchInterior());
    }
    private enterSepulchreSequence() {
        this.clearSceneElements();

        const store = useGameStore.getState();

        // Si le joueur a déjà fini la discussion et obtenu le chapelet
        if (store.act1Progress.priestEncountered) {
            this.cameras.main.fadeOut(800, 0, 0, 0);
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                this.enterPriestEncounterShort();
            });
            return;
        }

        // Sinon, première visite complète
        this.cameras.main.fadeOut(800, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            store.setDialog({
                textKey: 'act1_church.sepulchre_transition',
                type: 'center',
                onComplete: () => {
                    this.enterPriestEncounter();
                }
            });
        });
    }

    // Version courte pour les visites ultérieures
    private enterPriestEncounterShort() {
        this.currentLocation = 'SEPULCRE';
        const { width, height } = this.scale;

        if (this.currentBg) this.currentBg.destroy();
        this.currentBg = this.add.image(width / 2, height / 2, 'priest').setDisplaySize(width, height);

        this.cameras.main.fadeIn(1000, 0, 0, 0);

        useGameStore.getState().startDialogue({
            text: "Le père Thomas prie en silence près du tombeau. Il incline la tête vers vous avec douceur : « Reposez-vous, mon enfant. Le chemin est encore long. »",
            speaker: 'Père Thomas'
        });

        this.createBackButton(() => this.enterChurchInterior());
    }

    private enterPriestEncounter() {
        this.currentLocation = 'SEPULCRE';
        const { width, height } = this.scale;

        if (this.currentBg) this.currentBg.destroy();
        this.currentBg = this.add.image(width / 2, height / 2, 'priest').setDisplaySize(width, height);

        this.cameras.main.fadeIn(1000, 0, 0, 0);

        // 1. Dialogue d'accroche du prêtre
        useGameStore.getState().setDialog({
            textKey: 'act1_church.priest_dialog',
            type: 'bottom',
            speaker: 'Père Thomas',
            onComplete: () => {
                // 2. Introduction et réplique de Laurence sur son père
                this.startPriestDialogueFlow();
            }
        });

        this.createBackButton(() => this.enterChurchInterior());
    }

    private startPriestDialogueFlow() {
        const store = useGameStore.getState();

        store.setDialog({
            textKey: 'act1_church.long_discussion.introduction',
            type: 'bottom',
            speaker: 'Père Thomas',
            onComplete: () => {
                store.setDialog({
                    textKey: 'act1_church.long_discussion.laurence_contexte',
                    type: 'bottom',
                    speaker: 'Laurence Lindner',
                    onComplete: () => {
                        store.setDialog({
                            textKey: 'act1_church.long_discussion.pere_thomas_ecoute',
                            type: 'bottom',
                            speaker: 'Père Thomas',
                            onComplete: () => {
                                // 3. Lancement des choix de questions philosophiques
                                this.showPhilosophicalMenu(new Set());
                            }
                        });
                    }
                });
            }
        });
    }
    private showPhilosophicalMenu(askedThemes: Set<string>) {
        const store = useGameStore.getState();
        const choices: ChoiceOption[] = [];

        if (!askedThemes.has('theme_1_horloger')) {
            choices.push({
                id: 'theme_1_horloger',
                text: "1. Vivons-nous dans un monde régi par un grand Horloger ou par un chaos aveugle ?",
                consequences: {}
            });
        }
        if (!askedThemes.has('theme_2_creation_souffrance')) {
            choices.push({
                id: 'theme_2_creation_souffrance',
                text: "2. Si Dieu est bon, pourquoi nous avoir créés pour souffrir ainsi ?",
                consequences: {}
            });
        }
        if (!askedThemes.has('theme_3_origine_dieu')) {
            choices.push({
                id: 'theme_3_origine_dieu',
                text: "3. Et si tout doit avoir une cause... qui a créé Dieu ?",
                consequences: {}
            });
        }

        choices.push({
            id: 'conclure_discussion',
            text: "— Ne rien dire de plus et écouter le prêtre.",
            consequences: {}
        });

        store.setDialog({
            textKey: 'act1_church.long_discussion.invite_reflexion',
            type: 'bottom',
            speaker: 'Laurence Lindner',
            choices: choices,
            onComplete: (selectedChoiceId?: string) => {
                if (!selectedChoiceId || selectedChoiceId === 'conclure_discussion') {
                    this.triggerDilemmaSequence();
                } else {
                    askedThemes.add(selectedChoiceId);
                    this.playThemeExchange(selectedChoiceId, askedThemes);
                }
            }
        });
    }
    private playThemeExchange(themeKey: string, askedThemes: Set<string>) {
        const store = useGameStore.getState();

        // Réplique de Laurence (le tableau gère les fenêtres multiples)
        store.setDialog({
            textKey: `act1_church.long_discussion.themes_philosophiques.${themeKey}.laurence`,
            type: 'bottom',
            speaker: 'Laurence Lindner',
            onComplete: () => {
                // Réplique du Père Thomas (le tableau gère les fenêtres multiples)
                store.setDialog({
                    textKey: `act1_church.long_discussion.themes_philosophiques.${themeKey}.pere_thomas`,
                    type: 'bottom',
                    speaker: 'Père Thomas',
                    onComplete: () => {
                        // Retour au menu des questions restantes
                        this.showPhilosophicalMenu(askedThemes);
                    }
                });
            }
        });
    }

    private triggerDilemmaSequence() {
        const store = useGameStore.getState();

        store.setDialog({
            textKey: 'act1_church.long_discussion.conclusion_dilemme',
            type: 'bottom',
            speaker: 'Père Thomas',
            choices: [
                {
                    id: 'act1_church_prier_pere',
                    text: "[ S'agenouiller et prier pour le salut de son père ]",
                    consequences: { mentalDelta: 10 }
                },
                {
                    id: 'act1_church_refuser_prier',
                    text: "[ Votre foi est ébranlée, vous refusez de prier ]",
                    consequences: { consciousnessDelta: 10, mentalDelta: -10 }
                }
            ],
            onComplete: (selectedChoiceId?: string) => {
                const store = useGameStore.getState();

                if (selectedChoiceId) {
                    const chosenOption = selectedChoiceId === 'act1_church_prier_pere'
                        ? { mentalDelta: 10 }
                        : { consciousnessDelta: 10, mentalDelta: -10 };

                    store.recordChoice(selectedChoiceId, this.currentLocation, chosenOption);
                }

                store.setDialog({
                    textKey: 'act1_church.long_discussion.offrande_finale',
                    type: 'bottom',
                    speaker: 'Père Thomas',
                    onComplete: () => {
                        store.addItem({
                            id: 'chapelet',
                            name: 'Chapelet du Père Thomas',
                            icon: 'chapelet_icon',
                            description: 'Un vieux chapelet sombre offert par le Père Thomas comme point d’ancrage.',
                            examineText: 'Les grains usés glissent entre mes doigts. Une tiédeur étrange s’en dégage, ou est-ce simplement le fruit de mon imagination ?'
                        });

                        // MARQUE LA RENCONTRE COMME TERMINÉE
                        store.updateAct1Progress({ priestEncountered: true });
                    }
                });
            }
        });
    }

    private createBackButton(callback: () => void) {
        const { width, height } = this.scale;
        this.backButton = this.add.text(80, 50, "← Retour", {
            fontFamily: 'monospace', fontSize: '16px', color: '#f4ebd0', backgroundColor: '#000000', padding: { x: 10, y: 5 }
        }).setInteractive({ useHandCursor: true });

        this.backButton.on('pointerover', () => {
            const store = useGameStore.getState() as any;
            if (store.currentDialog || store.activeDocument) return;
            this.game.canvas.classList.add('cursor-path');
        });

        this.backButton.on('pointerout', () => {
            this.game.canvas.classList.remove('cursor-path');
        });

        this.backButton.on('pointerdown', () => {
            const store = useGameStore.getState() as any;
            if (store.currentDialog || store.activeDocument) return;

            this.game.canvas.classList.remove('cursor-path');
            callback();
        });
    }
}