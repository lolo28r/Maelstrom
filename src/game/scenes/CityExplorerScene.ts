import Phaser from 'phaser';
import { useGameStore, ChoiceOption } from '../../store/useGameStore';
import { HotspotZone } from '../helper/HotSpotZone';
import i18n from '../../i18n';

type CityLocation = 'CARREFOUR' | 'JOURNAL_STREET' | 'PORTE_LIB' | 'ENTREE_LIB' | 'SALON' | 'TABAC' | 'TABAC_INT' | 'EGLISE_EXT' | 'EGLISE_INT' | 'CHAPELLE' | 'SEPULCRE';

export class CityExplorerScene extends Phaser.Scene {
    private currentBg!: Phaser.GameObjects.Image;
    private thoughtText?: Phaser.GameObjects.Text;
    private activeHotspots: HotspotZone[] = [];
    private backButton?: Phaser.GameObjects.Text;
    private churchMusic?: Phaser.Sound.BaseSound;
    private storeMusic?: Phaser.Sound.BaseSound; // 👈 Référence pour la musique du magasin

    private hasVisitedChurch: boolean = false;
    private hasSeenStatue: boolean = false;

    private currentLocation: CityLocation = 'CARREFOUR';

    constructor() {
        super({ key: 'CityExplorerScene' });
    }

    preload() {
        const baseUrl = import.meta.env.BASE_URL;

        this.load.image('carrefour', `${baseUrl}assets/carrefour.jpg`);
        this.load.image('journal', `${baseUrl}assets/journal.jpg`);
        this.load.image('porteLib', `${baseUrl}assets/porteLib.jpg`);
        this.load.image('entreeLib', `${baseUrl}assets/entreeLib.jpg`);
        this.load.image('salon', `${baseUrl}assets/salon.png`);
        this.load.image('tabac1', `${baseUrl}assets/tabac1.jpg`); // Extérieur / Façade du tabac
        this.load.image('interieurStore', `${baseUrl}assets/interieurStore.jpg`); // Intérieur du magasin
        this.load.image('egliseExt', `${baseUrl}assets/egliseExt.jpg`);
        this.load.image('eglise', `${baseUrl}assets/eglise.jpg`);
        this.load.image('chapelleVierge', `${baseUrl}assets/chapelleVierge.jpg`);
        this.load.image('priest', `${baseUrl}assets/priest.jpg`);

        // Chargement des musiques
        this.load.audio('ostEglise', `${baseUrl}assets/ostEglise.mp3`);
        this.load.audio('ostStore', `${baseUrl}assets/ostStore.mp3`);
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

    private stopChurchMusic() {
        if (this.churchMusic) {
            this.churchMusic.stop();
            this.churchMusic.destroy();
            this.churchMusic = undefined;
        }
    }

    private stopStoreMusic() {
        if (this.storeMusic) {
            this.storeMusic.stop();
            this.storeMusic.destroy();
            this.storeMusic = undefined;
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
        this.stopChurchMusic();
        this.stopStoreMusic();
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

        // Rue de droite menant au tabac / magasin
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
        this.stopChurchMusic();
        this.stopStoreMusic();
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
            scene: this,
            x: 462,
            y: 459,
            width: 40,
            height: 250,
            type: 'inspect',
            actionLabel: "Écouter aux portes",
            onClick: () => {
                const store = useGameStore.getState();

                store.setDialog({
                    textKey: 'act1_street.dispute_intro',
                    type: 'bottom',
                    speaker: 'Laurence Lindner',
                    onComplete: () => {
                        store.setDialog({
                            textKey: 'act1_street.dispute_f1',
                            type: 'bottom',
                            speaker: 'Femme inconnue',
                            onComplete: () => {
                                store.setDialog({
                                    textKey: 'act1_street.dispute_h1',
                                    type: 'bottom',
                                    speaker: 'Homme inconnu',
                                    onComplete: () => {
                                        store.setDialog({
                                            textKey: 'act1_street.dispute_f2',
                                            type: 'bottom',
                                            speaker: 'Femme inconnue',
                                            onComplete: () => {
                                                store.setDialog({
                                                    textKey: 'act1_street.dispute_h2',
                                                    type: 'bottom',
                                                    speaker: 'Homme inconnu',
                                                    onComplete: () => {
                                                        store.setDialog({
                                                            textKey: 'act1_street.dispute_f3',
                                                            type: 'bottom',
                                                            speaker: 'Femme inconnue',
                                                            onComplete: () => {
                                                                store.setDialog({
                                                                    textKey: 'act1_street.dispute_h3',
                                                                    type: 'bottom',
                                                                    speaker: 'Homme inconnu',
                                                                    onComplete: () => {
                                                                        store.setDialog({
                                                                            textKey: 'act1_street.dispute_f4',
                                                                            type: 'bottom',
                                                                            speaker: 'Femme inconnue',
                                                                            onComplete: () => {
                                                                                store.setDialog({
                                                                                    textKey: 'act1_street.dispute_h4',
                                                                                    type: 'bottom',
                                                                                    speaker: 'Homme inconnu',
                                                                                    onComplete: () => {
                                                                                        store.recordChoice('LISTEN_TO_DISPUTE', this.currentLocation, { consciousnessDelta: 3, mentalDelta: -2 });
                                                                                    }
                                                                                });
                                                                            }
                                                                        });
                                                                    }
                                                                });
                                                            }
                                                        });
                                                    }
                                                });
                                            }
                                        });
                                    }
                                });
                            }
                        });
                    }
                });
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

    // Extérieur / Façade du Tabac
    private enterTobacco() {
        this.stopChurchMusic();
        this.stopStoreMusic();
        this.clearSceneElements();
        this.currentLocation = 'TABAC';
        const { width, height } = this.scale;

        if (this.currentBg) this.currentBg.destroy();
        this.currentBg = this.add.image(width / 2, height / 2, 'tabac1').setDisplaySize(width, height);

        // Hotspot pour entrer dans le magasin (interieurStore)
        this.addHotspot({
            scene: this, x: 325, y: 430, width: 340, height: 450,
            type: 'path', actionLabel: "Entrer dans le magasin",
            onClick: () => this.enterGeneralStore()
        });

        // Hotspot pour continuer vers l'église depuis la rue du tabac
        this.addHotspot({
            scene: this, x: width * 0.80, y: height * 0.45, width: 200, height: 350,
            type: 'path', actionLabel: "Continuer vers l'église",
            onClick: () => this.enterChurchExterior()
        });

        this.createBackButton(() => this.enterCarrefour());
    }

    // Intérieur du General Store (avec la commerçante, le poêle et les étagères)
    private enterGeneralStore() {
        this.stopChurchMusic();
        this.clearSceneElements();
        this.currentLocation = 'TABAC_INT';
        const { width, height } = this.scale;

        if (this.currentBg) this.currentBg.destroy();
        this.currentBg = this.add.image(width / 2, height / 2, 'interieurStore').setDisplaySize(width, height);

        // Lancement de la musique du magasin
        if (!this.storeMusic) {
            this.storeMusic = this.sound.add('ostStore', { loop: true, volume: 0.15 });
            this.storeMusic.play();
        }

        // 1. HITBOX 1 : La Commerçante
        this.addHotspot({
            scene: this,
            x: 701,
            y: 306,
            width: 670,
            height: 450,
            type: 'inspect',
            actionLabel: "Parler à la commerçante",
            onClick: () => {
                useGameStore.getState().startDialogue({
                    text: i18n.t('act1_store.shopkeeper_dialog'),
                    speaker: 'Commerçante'
                });
            }
        });

        // 2. HITBOX 2 : Le Poêle en fonte
        this.addHotspot({
            scene: this,
            x: 1186,
            y: 485,
            width: 80,
            height: 280,
            type: 'inspect',
            actionLabel: "Examiner le poêle en fonte",
            onClick: () => {
                useGameStore.getState().startDialogue({
                    text: i18n.t('act1_store.stove_dialog'),
                    speaker: 'Laurence Lindner'
                });
            }
        });

        // 3. HITBOX 3 : Les étagères / épices
        this.addHotspot({
            scene: this,
            x: 351,
            y: 670,
            width: 700,
            height: 110,
            type: 'inspect',
            actionLabel: "Inspecter les étagères",
            onClick: () => {
                useGameStore.getState().startDialogue({
                    text: i18n.t('act1_store.shelves_dialog'),
                    speaker: 'Laurence Lindner'
                });
            }
        });

        // Bouton de retour vers l'extérieur du tabac (stoppe la musique du magasin)
        this.createBackButton(() => {
            this.stopStoreMusic();
            this.enterTobacco();
        });
    }

    private enterChurchExterior() {
        this.stopChurchMusic();
        this.stopStoreMusic();
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

        if (!this.churchMusic) {
            this.churchMusic = this.sound.add('ostEglise', { loop: true, volume: 0.4 });
            this.churchMusic.play();
        }

        if (!this.hasVisitedChurch) {
            this.hasVisitedChurch = true;
            useGameStore.getState().setDialog({
                textKey: 'act1_church.first_entry',
                type: 'bottom'
            });
        }

        // 1. La grande croix (Inspect)
        this.addHotspot({
            scene: this,
            x: width * 0.5,
            y: height * 0.45,
            width: 140,
            height: 220,
            type: 'inspect',
            actionLabel: "Examiner la grande croix",
            onClick: () => {
                const store = useGameStore.getState();

                store.setDialog({
                    textKey: 'act1_church.cross_lore_part1',
                    type: 'bottom',
                    speaker: 'Laurence Lindner',
                    onComplete: () => {
                        store.setDialog({
                            textKey: 'act1_church.cross_lore_part2',
                            type: 'bottom',
                            speaker: 'Laurence Lindner',
                            onComplete: () => {
                                store.setDialog({
                                    textKey: 'act1_church.cross_lore_part3',
                                    type: 'bottom',
                                    speaker: 'Laurence Lindner',
                                    onComplete: () => {
                                        store.recordChoice('EXAMINE_ALTAR_CROSS', this.currentLocation, { mentalDelta: -2 });
                                    }
                                });
                            }
                        });
                    }
                });
            }
        });

        // 2. Chapelle de la Sainte Vierge (à droite) - Avec actionLabel rétabli
        this.addHotspot({
            scene: this,
            x: 1064,
            y: 481,
            width: 240,
            height: 300,
            type: 'path',
            actionLabel: "Vers la chapelle de la Sainte Vierge",
            onClick: () => this.enterChapel()
        });

        // 3. Chapelle du Saint-Sépulcre (à gauche) - Avec actionLabel rétabli
        this.addHotspot({
            scene: this,
            x: 214,
            y: 504,
            width: 200,
            height: 300,
            type: 'path',
            actionLabel: "Vers la chapelle du Saint-Sépulcre",
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

        this.addHotspot({
            scene: this,
            x: 646,
            y: 426,
            width: 180,
            height: 380,
            type: 'inspect',
            actionLabel: "Examiner la statue de la Vierge",
            onClick: () => {
                if (this.hasSeenStatue) {
                    useGameStore.getState().startDialogue({
                        text: "La statue de pierre me regarde dans un silence de marbre. Inutile de m'attarder davantage ici.",
                        speaker: 'Laurence Lindner'
                    });
                    return;
                }

                this.hasSeenStatue = true;

                useGameStore.getState().setDialog({
                    textKey: 'act1_church.first_statue_gaze',
                    type: 'bottom',
                    onComplete: () => {
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

        if (store.act1Progress.priestEncountered) {
            this.cameras.main.fadeOut(800, 0, 0, 0);
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                this.enterPriestEncounterShort();
            });
            return;
        }

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

        useGameStore.getState().setDialog({
            textKey: 'act1_church.priest_dialog',
            type: 'bottom',
            speaker: 'Père Thomas',
            onComplete: () => {
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
                                this.showPhilosophicalMenu(new Set());
                            }
                        });
                    }
                });
            }
        });
    }

    private showPhilosophicalMenu(askedThemes: Set<string>) {
        const choices: ChoiceOption[] = [];

        if (!askedThemes.has('theme_1_horloger')) {
            choices.push({
                id: 'theme_1_horloger',
                text: "1. Est-ce que c'est vraiment le hasard ou Dieu nous a créés, avec tout ce que ça implique ?",
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

        useGameStore.getState().setDialog({
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

        store.setDialog({
            textKey: `act1_church.long_discussion.themes_philosophiques.${themeKey}.laurence`,
            type: 'bottom',
            speaker: 'Laurence Lindner',
            onComplete: () => {
                store.setDialog({
                    textKey: `act1_church.long_discussion.themes_philosophiques.${themeKey}.pere_thomas`,
                    type: 'bottom',
                    speaker: 'Père Thomas',
                    onComplete: () => {
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

                        store.updateAct1Progress({ priestEncountered: true });
                    }
                });
            }
        });
    }

    private createBackButton(callback: () => void) {
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