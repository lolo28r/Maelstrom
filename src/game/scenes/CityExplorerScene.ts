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
    private storeMusic?: Phaser.Sound.BaseSound;

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
        this.load.image('salon', `${baseUrl}assets/salon.jpg`);
        this.load.image('tabac1', `${baseUrl}assets/tabac1.jpg`);
        this.load.image('interieurStore', `${baseUrl}assets/interieurStore.jpg`);
        this.load.image('egliseExt', `${baseUrl}assets/egliseExt.jpg`);
        this.load.image('eglise', `${baseUrl}assets/eglise.jpg`);
        this.load.image('chapelleVierge', `${baseUrl}assets/chapelleVierge.jpg`);
        this.load.image('priest', `${baseUrl}assets/priest.jpg`);

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



        this.tweens.add({
            targets: this.thoughtText,
            alpha: { from: 0, to: 1 },
            duration: 1500, hold: 4000, yoyo: true,
            onComplete: () => { if (this.thoughtText) this.thoughtText.destroy(); }
        });

        // Vérification si les 3 actions de la ville sont faites
        const progress = useGameStore.getState().act1Progress;
        const isCityComplete = progress?.priestEncountered && progress?.listenedToDispute && progress?.metMrBell;

        // Hotspot : Route de l'Asile
        this.addHotspot({
            scene: this, x: width * 0.5, y: height * 0.55, width: 160, height: 180,
            type: 'path', actionLabel: "Route de l'Asile",
            onClick: () => { }
        });

        // Hotspot : Rue à droite (Tabac / Église)
        this.addHotspot({
            scene: this, x: width * 0.82, y: height * 0.5, width: 220, height: 380,
            type: 'path', actionLabel: "S'engager dans la rue à droite",
            onClick: () => this.enterTobacco()
        });

        // Hotspot : Rue à gauche (Journal / Bibliothèque)
        this.addHotspot({
            scene: this, x: width * 0.12, y: height * 0.5, width: 220, height: 380,
            type: 'path', actionLabel: "S'engager dans la rue à gauche",
            onClick: () => this.enterJournalStreet()
        });

        // SI LES 3 TÂCHES SONT FAITES : Ajout de la condition de retour
        if (isCityComplete) {
            const labelGoHome = i18n.t('act1_city.choice_go_home');

            // 1. Hotspot en bas au milieu "Rentrer chez soi"
            this.addHotspot({
                scene: this, x: width * 0.5, y: height * 0.88, width: 240, height: 80,
                type: 'path', actionLabel: labelGoHome,
                onClick: () => {
                    const store = useGameStore.getState();
                    store.closeDialog();
                    store.setScene('ChapterEndScene');
                    this.scene.start('ChapterEndScene');
                }
            });

            // 2. Déclenchement automatique du dialogue intérieur de fatigue (une seule fois)
            if (!progress.cityFatigueTriggered) {
                useGameStore.getState().updateAct1Progress({ cityFatigueTriggered: true });

                const store = useGameStore.getState() as any;
                if (!store.currentDialog) {
                    // On utilise startDialogue ou setDialog selon ce que votre store accepte pour du texte brut
                    // Si store.startDialogue existe dans votre store (utilisé plus bas pour le poêle/étagères) :
                    const thoughtMessage = i18n.t('act1_city.tired_return_thought');

                    // Si i18n renvoie la clé elle-même, c'est que la clé n'est pas trouvée par i18n. 
                    // On met un texte de secours en dur pour être sur à 100% que ça s'affiche :
                    const finalThoughtText = (thoughtMessage !== 'act1_city.tired_return_thought')
                        ? thoughtMessage
                        : "J'ai assez fait aujourd'hui... Je suis fatigué, il est temps de rentrer.";

                    store.setDialog({
                        // Si le store gère mal textKey, on triche en passant par un texte résolu ou une méthode alternative
                        // Testons d'injecter directement la structure que le store attend
                        textKey: 'act1_city.tired_return_thought',
                        type: 'bottom',
                        speaker: 'Laurence Lindner',
                        choices: [
                            {
                                id: 'go_home',
                                text: i18n.t('act1_city.choice_go_home') !== 'act1_city.choice_go_home' ? i18n.t('act1_city.choice_go_home') : "[ Rentrer chez soi ]",
                                consequences: {}
                            },
                            {
                                id: 'stay_here',
                                text: i18n.t('act1_city.choice_stay_here') !== 'act1_city.choice_stay_here' ? i18n.t('act1_city.choice_stay_here') : "[ Rester encore un peu ]",
                                consequences: {}
                            }
                        ],
                        onComplete: (selectedChoiceId?: string) => {
                            if (selectedChoiceId === 'go_home') {
                                store.setScene('ChapterEndScene');
                                this.scene.start('ChapterEndScene');
                            }
                            store.closeDialog();
                        }
                    });
                }
            }
        }
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
                                                                                        store.addJournalNote(
                                                                                            i18n.t('act1_street.journal_note_title'),
                                                                                            i18n.t('act1_street.journal_note_content'),
                                                                                            i18n.t('act1_church.journal_timestamp')
                                                                                        );
                                                                                        // Validation de la tâche de la dispute
                                                                                        store.updateAct1Progress({ listenedToDispute: true });
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
            scene: this, x: 785, y: 368, width: 180, height: 320,
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

        // Hotspot pour parler au bibliothécaire (Accueil complet)
        this.addHotspot({
            scene: this,
            x: width * 0.5,
            y: height * 0.5,
            width: 200,
            height: 350,
            type: 'inspect',
            actionLabel: "Parler au bibliothécaire",
            onClick: () => {
                const store = useGameStore.getState();

                store.setDialog({
                    textKey: 'act1_library.laurence_excuse',
                    type: 'bottom',
                    speaker: 'Laurence Lindner',
                    onComplete: () => {
                        store.setDialog({
                            textKey: 'act1_library.librarian_greeting',
                            type: 'bottom',
                            speaker: 'Bibliothécaire',
                            onComplete: () => {
                                store.setDialog({
                                    textKey: 'act1_library.laurence_father_search',
                                    type: 'bottom',
                                    speaker: 'Laurence Lindner',
                                    onComplete: () => {
                                        store.setDialog({
                                            textKey: 'act1_library.librarian_no_idea',
                                            type: 'bottom',
                                            speaker: 'Bibliothécaire',
                                            onComplete: () => {
                                                store.setDialog({
                                                    textKey: 'act1_library.laurence_historian_work',
                                                    type: 'bottom',
                                                    speaker: 'Laurence Lindner',
                                                    onComplete: () => {
                                                        store.setDialog({
                                                            textKey: 'act1_library.librarian_historians',
                                                            type: 'bottom',
                                                            speaker: 'Bibliothécaire',
                                                            onComplete: () => {
                                                                store.setDialog({
                                                                    textKey: 'act1_library.librarian_no_remember',
                                                                    type: 'bottom',
                                                                    speaker: 'Bibliothécaire',
                                                                    onComplete: () => {
                                                                        store.setDialog({
                                                                            textKey: 'act1_library.librarian_suggest_bell',
                                                                            type: 'bottom',
                                                                            speaker: 'Bibliothécaire',
                                                                            onComplete: () => {
                                                                                store.setDialog({
                                                                                    textKey: 'act1_library.laurence_where_bell',
                                                                                    type: 'bottom',
                                                                                    speaker: 'Laurence Lindner',
                                                                                    onComplete: () => {
                                                                                        store.setDialog({
                                                                                            textKey: 'act1_library.librarian_bell_location',
                                                                                            type: 'bottom',
                                                                                            speaker: 'Bibliothécaire',
                                                                                            onComplete: () => {
                                                                                                this.enterLibrarySalon();
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
            }
        });

        this.createBackButton(() => this.enterLibraryDoor());
    }

    private enterLibrarySalon() {
        this.clearSceneElements();
        this.currentLocation = 'SALON';
        const { width, height } = this.scale;
        if (this.currentBg) this.currentBg.destroy();
        this.currentBg = this.add.image(width / 2, height / 2, 'salon').setDisplaySize(width, height);

        // 1. HOTSPOT 1 : Parler à Monsieur Bell
        this.addHotspot({
            scene: this,
            x: 365,
            y: 352,
            width: 500,
            height: 400,
            type: 'inspect',
            actionLabel: "Parler à Monsieur Bell",
            onClick: () => {
                const store = useGameStore.getState();

                // Introduction obligatoire : "Vous connaissiez mon père ?"
                store.setDialog({
                    textKey: 'act1_library.laurence_excuse',
                    type: 'bottom',
                    speaker: 'Laurence Lindner',
                    onComplete: () => {
                        store.setDialog({
                            textKey: 'act1_library.bell_hmm',
                            type: 'bottom',
                            speaker: 'Monsieur Bell',
                            onComplete: () => {
                                store.setDialog({
                                    textKey: 'act1_library.laurence_find_someone',
                                    type: 'bottom',
                                    speaker: 'Laurence Lindner',
                                    onComplete: () => {
                                        store.setDialog({
                                            textKey: 'act1_library.bell_father',
                                            type: 'bottom',
                                            speaker: 'Monsieur Bell',
                                            onComplete: () => {
                                                store.setDialog({
                                                    textKey: 'act1_library.laurence_father_name',
                                                    type: 'bottom',
                                                    speaker: 'Laurence Lindner',
                                                    onComplete: () => {
                                                        store.setDialog({
                                                            textKey: 'act1_library.bell_recognize',
                                                            type: 'bottom',
                                                            speaker: 'Monsieur Bell',
                                                            onComplete: () => {
                                                                store.setDialog({
                                                                    textKey: 'act1_library.laurence_yes',
                                                                    type: 'bottom',
                                                                    speaker: 'Laurence Lindner',
                                                                    onComplete: () => {
                                                                        store.setDialog({
                                                                            textKey: 'act1_library.bell_sit',
                                                                            type: 'bottom',
                                                                            speaker: 'Monsieur Bell',
                                                                            onComplete: () => {
                                                                                store.addJournalNote(
                                                                                    i18n.t('act1_library.journal_note_title'),
                                                                                    i18n.t('act1_library.journal_note_content'),
                                                                                    i18n.t('act1_library.journal_timestamp')
                                                                                );
                                                                                // Une fois assis, le menu s'ouvre. Le manuscrit est false au début.
                                                                                this.showBellQuestionsMenu(new Set(), false);
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

        // 2. HOTSPOT 2 : Les étagères de livres
        this.addHotspot({
            scene: this,
            x: 953,
            y: 126,
            width: 600,
            height: 200,
            type: 'inspect',
            actionLabel: "Examiner les étagères",
            onClick: () => {
                useGameStore.getState().setDialog({
                    textKey: 'act1_library.shelves_thought',
                    type: 'bottom',
                    speaker: 'Laurence Lindner'
                });
            }
        });

        this.createBackButton(() => this.enterLibraryInterior());
    }

    private showBellQuestionsMenu(askedTopics: Set<string>, manuscriptUnlocked: boolean) {
        const store = useGameStore.getState();
        const choices: ChoiceOption[] = [];

        // 1. Toujours disponible au début : "Vous connaissiez mon père ?"
        if (!askedTopics.has('relation')) {
            choices.push({
                id: 'relation',
                text: i18n.t('act1_library.laurence_ask_relation'),
                consequences: {}
            });
        }

        // 2. Débloqué uniquement APRES avoir posé la question sur la relation
        if (askedTopics.has('relation') && !askedTopics.has('homme')) {
            choices.push({
                id: 'homme',
                text: i18n.t('act1_library.laurence_ask_kind'),
                consequences: {}
            });
        }

        // 3. Débloqué uniquement APRES avoir parlé du genre d'homme qu'il était
        if (askedTopics.has('homme') && !askedTopics.has('changement')) {
            choices.push({
                id: 'changement',
                text: i18n.t('act1_library.laurence_ask_change'),
                consequences: {}
            });
        }

        // 4. Débloqué uniquement APRES avoir parlé du changement
        if (askedTopics.has('changement') && !askedTopics.has('comportement')) {
            choices.push({
                id: 'comportement',
                text: i18n.t('act1_library.laurence_ask_behavior'),
                consequences: {}
            });
        }

        // 5. Débloqué uniquement APRES avoir abordé le comportement
        if (askedTopics.has('comportement') && !askedTopics.has('question')) {
            choices.push({
                id: 'question',
                text: i18n.t('act1_library.laurence_ask_strange'),
                consequences: {}
            });
        }

        // 6. Le manuscrit : uniquement débloqué à la toute fin de la conversation sur l'homme/les recherches
        if (manuscriptUnlocked && !askedTopics.has('manuscrit')) {
            choices.push({
                id: 'manuscrit',
                text: i18n.t('act1_library.laurence_ask_research'),
                consequences: {}
            });
        }

        // Option pour quitter le salon à tout moment
        choices.push({
            id: 'leave',
            text: i18n.t('act1_library.laurence_leave'),
            consequences: {}
        });

        store.setDialog({
            textKey: 'act1_library.bell_hmm',
            type: 'bottom',
            speaker: 'Laurence Lindner',
            choices: choices,
            onComplete: (selectedId?: string) => {
                if (!selectedId || selectedId === 'leave') {
                    // Validation de la tâche "Monsieur Bell" une fois qu'on quitte la discussion
                    store.updateAct1Progress({ metMrBell: true });

                    store.setDialog({
                        textKey: 'act1_library.bell_end',
                        type: 'bottom',
                        speaker: 'Monsieur Bell'
                    });
                    return;
                }

                askedTopics.add(selectedId);
                this.playBellTopicFlow(selectedId, askedTopics, manuscriptUnlocked);
            }
        });
    }

    private playBellTopicFlow(topicId: string, askedTopics: Set<string>, manuscriptUnlocked: boolean) {
        const store = useGameStore.getState();

        if (topicId === 'relation') {
            store.setDialog({
                textKey: 'act1_library.bell_you_knew_father',
                type: 'bottom',
                speaker: 'Monsieur Bell',
                onComplete: () => {
                    store.setDialog({
                        textKey: 'act1_library.laurence_he_came_often',
                        type: 'bottom',
                        speaker: 'Laurence Lindner',
                        onComplete: () => {
                            store.setDialog({
                                textKey: 'act1_library.bell_he_came_often',
                                type: 'bottom',
                                speaker: 'Monsieur Bell',
                                onComplete: () => this.showBellQuestionsMenu(askedTopics, manuscriptUnlocked)
                            });
                        }
                    });
                }
            });
        } else if (topicId === 'homme') {
            store.setDialog({
                textKey: 'act1_library.bell_passionate',
                type: 'bottom',
                speaker: 'Monsieur Bell',
                onComplete: () => {
                    store.setDialog({
                        textKey: 'act1_library.laurence_stubborn',
                        type: 'bottom',
                        speaker: 'Laurence Lindner',
                        onComplete: () => {
                            store.setDialog({
                                textKey: 'act1_library.bell_stubborn',
                                type: 'bottom',
                                speaker: 'Monsieur Bell',
                                onComplete: () => {
                                    store.setDialog({
                                        textKey: 'act1_library.laurence_what_questions',
                                        type: 'bottom',
                                        speaker: 'Laurence Lindner',
                                        onComplete: () => {
                                            store.setDialog({
                                                textKey: 'act1_library.bell_questions',
                                                type: 'bottom',
                                                speaker: 'Monsieur Bell',
                                                onComplete: () => {
                                                    store.setDialog({
                                                        textKey: 'act1_library.laurence_research',
                                                        type: 'bottom',
                                                        speaker: 'Laurence Lindner',
                                                        onComplete: () => {
                                                            store.setDialog({
                                                                textKey: 'act1_library.bell_research',
                                                                type: 'bottom',
                                                                speaker: 'Monsieur Bell',
                                                                onComplete: () => {
                                                                    store.setDialog({
                                                                        textKey: 'act1_library.laurence_recurring',
                                                                        type: 'bottom',
                                                                        speaker: 'Laurence Lindner',
                                                                        onComplete: () => {
                                                                            store.setDialog({
                                                                                textKey: 'act1_library.bell_recurring',
                                                                                type: 'bottom',
                                                                                speaker: 'Monsieur Bell',
                                                                                onComplete: () => {
                                                                                    store.setDialog({
                                                                                        textKey: 'act1_library.laurence_symbols',
                                                                                        type: 'bottom',
                                                                                        speaker: 'Laurence Lindner',
                                                                                        onComplete: () => {
                                                                                            store.setDialog({
                                                                                                textKey: 'act1_library.bell_symbols',
                                                                                                type: 'bottom',
                                                                                                speaker: 'Monsieur Bell',
                                                                                                onComplete: () => {
                                                                                                    store.setDialog({
                                                                                                        textKey: 'act1_library.bell_symbols_more',
                                                                                                        type: 'bottom',
                                                                                                        speaker: 'Monsieur Bell',
                                                                                                        onComplete: () => {
                                                                                                            this.showBellQuestionsMenu(askedTopics, true);
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
                        }
                    });
                }
            });
        } else if (topicId === 'changement') {
            store.setDialog({
                textKey: 'act1_library.bell_change',
                type: 'bottom',
                speaker: 'Monsieur Bell',
                onComplete: () => {
                    store.setDialog({
                        textKey: 'act1_library.laurence_when_change',
                        type: 'bottom',
                        speaker: 'Laurence Lindner',
                        onComplete: () => {
                            store.setDialog({
                                textKey: 'act1_library.bell_around_1921',
                                type: 'bottom',
                                speaker: 'Monsieur Bell',
                                onComplete: () => {
                                    store.setDialog({
                                        textKey: 'act1_library.laurence_different',
                                        type: 'bottom',
                                        speaker: 'Laurence Lindner',
                                        onComplete: () => {
                                            store.setDialog({
                                                textKey: 'act1_library.bell_different',
                                                type: 'bottom',
                                                speaker: 'Monsieur Bell',
                                                onComplete: () => {
                                                    store.setDialog({
                                                        textKey: 'act1_library.laurence_explain_different',
                                                        type: 'bottom',
                                                        speaker: 'Laurence Lindner',
                                                        onComplete: () => {
                                                            store.setDialog({
                                                                textKey: 'act1_library.bell_explain_different',
                                                                type: 'bottom',
                                                                speaker: 'Monsieur Bell',
                                                                onComplete: () => {
                                                                    store.setDialog({
                                                                        textKey: 'act1_library.laurence_forgot',
                                                                        type: 'bottom',
                                                                        speaker: 'Laurence Lindner',
                                                                        onComplete: () => {
                                                                            store.setDialog({
                                                                                textKey: 'act1_library.bell_not_forgot',
                                                                                type: 'bottom',
                                                                                speaker: 'Monsieur Bell',
                                                                                onComplete: () => {
                                                                                    store.setDialog({
                                                                                        textKey: 'act1_library.bell_verify',
                                                                                        type: 'bottom',
                                                                                        speaker: 'Monsieur Bell',
                                                                                        onComplete: () => this.showBellQuestionsMenu(askedTopics, manuscriptUnlocked)
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
        } else if (topicId === 'comportement') {
            store.setDialog({
                textKey: 'act1_library.bell_behavior',
                type: 'bottom',
                speaker: 'Monsieur Bell',
                onComplete: () => {
                    store.setDialog({
                        textKey: 'act1_library.laurence_father_always_distant',
                        type: 'bottom',
                        speaker: 'Laurence Lindner',
                        onComplete: () => {
                            store.setDialog({
                                textKey: 'act1_library.bell_before_after',
                                type: 'bottom',
                                speaker: 'Monsieur Bell',
                                onComplete: () => {
                                    store.setDialog({
                                        textKey: 'act1_library.bell_after',
                                        type: 'bottom',
                                        speaker: 'Monsieur Bell',
                                        onComplete: () => {
                                            store.setDialog({
                                                textKey: 'act1_library.laurence_what_changed',
                                                type: 'bottom',
                                                speaker: 'Laurence Lindner',
                                                onComplete: () => {
                                                    store.setDialog({
                                                        textKey: 'act1_library.bell_gaze',
                                                        type: 'bottom',
                                                        speaker: 'Monsieur Bell',
                                                        onComplete: () => {
                                                            store.setDialog({
                                                                textKey: 'act1_library.laurence_gaze',
                                                                type: 'bottom',
                                                                speaker: 'Laurence Lindner',
                                                                onComplete: () => {
                                                                    store.setDialog({
                                                                        textKey: 'act1_library.bell_gaze_description',
                                                                        type: 'bottom',
                                                                        speaker: 'Monsieur Bell',
                                                                        onComplete: () => {
                                                                            store.setDialog({
                                                                                textKey: 'act1_library.bell_speech',
                                                                                type: 'bottom',
                                                                                speaker: 'Monsieur Bell',
                                                                                onComplete: () => {
                                                                                    store.setDialog({
                                                                                        textKey: 'act1_library.laurence_speech',
                                                                                        type: 'bottom',
                                                                                        speaker: 'Laurence Lindner',
                                                                                        onComplete: () => {
                                                                                            store.setDialog({
                                                                                                textKey: 'act1_library.bell_speech_description',
                                                                                                type: 'bottom',
                                                                                                speaker: 'Monsieur Bell',
                                                                                                onComplete: () => this.showBellQuestionsMenu(askedTopics, manuscriptUnlocked)
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
                }
            });
        } else if (topicId === 'question') {
            store.setDialog({
                textKey: 'act1_library.bell_strange_question',
                type: 'bottom',
                speaker: 'Monsieur Bell',
                onComplete: () => {
                    store.setDialog({
                        textKey: 'act1_library.laurence_what_said',
                        type: 'bottom',
                        speaker: 'Laurence Lindner',
                        onComplete: () => {
                            store.setDialog({
                                textKey: 'act1_library.bell_what_said',
                                type: 'bottom',
                                speaker: 'Monsieur Bell',
                                onComplete: () => {
                                    store.setDialog({
                                        textKey: 'act1_library.laurence_answer',
                                        type: 'bottom',
                                        speaker: 'Laurence Lindner',
                                        onComplete: () => {
                                            store.setDialog({
                                                textKey: 'act1_library.bell_answer',
                                                type: 'bottom',
                                                speaker: 'Monsieur Bell',
                                                onComplete: () => {
                                                    store.setDialog({
                                                        textKey: 'act1_library.bell_after_question',
                                                        type: 'bottom',
                                                        speaker: 'Monsieur Bell',
                                                        onComplete: () => this.showBellQuestionsMenu(askedTopics, manuscriptUnlocked)
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
        } else if (topicId === 'manuscrit') {
            store.setDialog({
                textKey: 'act1_library.bell_manuscript_intro',
                type: 'bottom',
                speaker: 'Monsieur Bell',
                onComplete: () => {
                    store.setDialog({
                        textKey: 'act1_library.laurence_what_research',
                        type: 'bottom',
                        speaker: 'Laurence Lindner',
                        onComplete: () => {
                            store.setDialog({
                                textKey: 'act1_library.bell_ancient_texts',
                                type: 'bottom',
                                speaker: 'Monsieur Bell',
                                onComplete: () => {
                                    store.setDialog({
                                        textKey: 'act1_library.bell_pattern',
                                        type: 'bottom',
                                        speaker: 'Monsieur Bell',
                                        onComplete: () => {
                                            store.setDialog({
                                                textKey: 'act1_library.laurence_correspondences',
                                                type: 'bottom',
                                                speaker: 'Laurence Lindner',
                                                onComplete: () => {
                                                    store.setDialog({
                                                        textKey: 'act1_library.bell_pattern_explain',
                                                        type: 'bottom',
                                                        speaker: 'Monsieur Bell',
                                                        onComplete: () => {
                                                            store.setDialog({
                                                                textKey: 'act1_library.laurence_manuscript_found',
                                                                type: 'bottom',
                                                                speaker: 'Laurence Lindner',
                                                                onComplete: () => {
                                                                    store.setDialog({
                                                                        textKey: 'act1_library.bell_manuscript',
                                                                        type: 'bottom',
                                                                        speaker: 'Monsieur Bell',
                                                                        onComplete: () => {
                                                                            store.setDialog({
                                                                                textKey: 'act1_library.laurence_what_manuscript',
                                                                                type: 'bottom',
                                                                                speaker: 'Laurence Lindner',
                                                                                onComplete: () => {
                                                                                    store.setDialog({
                                                                                        textKey: 'act1_library.bell_manuscript_description',
                                                                                        type: 'bottom',
                                                                                        speaker: 'Monsieur Bell',
                                                                                        onComplete: () => {
                                                                                            store.setDialog({
                                                                                                textKey: 'act1_library.laurence_symbol',
                                                                                                type: 'bottom',
                                                                                                speaker: 'Laurence Lindner',
                                                                                                onComplete: () => {
                                                                                                    store.setDialog({
                                                                                                        textKey: 'act1_library.bell_symbol',
                                                                                                        type: 'bottom',
                                                                                                        speaker: 'Monsieur Bell',
                                                                                                        onComplete: () => {
                                                                                                            store.setDialog({
                                                                                                                textKey: 'act1_library.laurence_where_manuscript',
                                                                                                                type: 'bottom',
                                                                                                                speaker: 'Laurence Lindner',
                                                                                                                onComplete: () => {
                                                                                                                    store.setDialog({
                                                                                                                        textKey: 'act1_library.bell_where_manuscript',
                                                                                                                        type: 'bottom',
                                                                                                                        speaker: 'Monsieur Bell',
                                                                                                                        onComplete: () => this.showBellQuestionsMenu(askedTopics, manuscriptUnlocked)
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
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    }

    // ==========================================
    // 3. BRANCHE DROITE : TABAC & ÉGLISE / CHAPELLE
    // ==========================================
    private enterTobacco() {
        this.stopChurchMusic();
        this.stopStoreMusic();
        this.clearSceneElements();
        this.currentLocation = 'TABAC';
        const { width, height } = this.scale;

        if (this.currentBg) this.currentBg.destroy();
        this.currentBg = this.add.image(width / 2, height / 2, 'tabac1').setDisplaySize(width, height);

        this.addHotspot({
            scene: this, x: 325, y: 430, width: 340, height: 450,
            type: 'path', actionLabel: "Entrer dans le magasin",
            onClick: () => this.enterGeneralStore()
        });

        this.addHotspot({
            scene: this, x: width * 0.80, y: height * 0.45, width: 200, height: 350,
            type: 'path', actionLabel: "Continuer vers l'église",
            onClick: () => this.enterChurchExterior()
        });

        this.createBackButton(() => this.enterCarrefour());
    }

    private enterGeneralStore() {
        this.stopChurchMusic();
        this.clearSceneElements();
        this.currentLocation = 'TABAC_INT';
        const { width, height } = this.scale;

        if (this.currentBg) this.currentBg.destroy();
        this.currentBg = this.add.image(width / 2, height / 2, 'interieurStore').setDisplaySize(width, height);

        if (!this.storeMusic) {
            this.storeMusic = this.sound.add('ostStore', { loop: true, volume: 0.15 });
            this.storeMusic.play();
        }

        this.addHotspot({
            scene: this,
            x: 701,
            y: 306,
            width: 670,
            height: 450,
            type: 'inspect',
            actionLabel: "Parler à la commerçante",
            onClick: () => {
                const store = useGameStore.getState();

                store.setDialog({
                    textKey: 'act1_store.shopkeeper_dialog',
                    type: 'bottom',
                    speaker: 'Commerçante',
                    choices: [
                        {
                            id: 'ask_father',
                            text: i18n.t('act1_store.dialog_ask_father'),
                            consequences: {}
                        },
                        {
                            id: 'buy_supplies',
                            text: i18n.t('act1_store.dialog_shop_intent'),
                            consequences: {}
                        }
                    ],
                    onComplete: (selectedChoiceId?: string) => {
                        if (selectedChoiceId === 'ask_father') {
                            store.setDialog({
                                textKey: 'act1_store.shopkeeper_unknown_father',
                                type: 'bottom',
                                speaker: 'Commerçante',
                                onComplete: () => {
                                    this.triggerShopTransaction();
                                }
                            });
                        } else {
                            this.triggerShopTransaction();
                        }
                    }
                });
            }
        });

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

        this.createBackButton(() => {
            this.stopStoreMusic();
            this.enterTobacco();
        });
    }

    private triggerShopTransaction() {
        const store = useGameStore.getState() as any;
        const baseUrl = import.meta.env.BASE_URL;

        if (store.act1Progress?.storeRationedToday) {
            store.setDialog({
                textKey: 'act1_store.shopkeeper_already_bought',
                type: 'bottom',
                speaker: 'Commerçante'
            });
            return;
        }

        store.setDialog({
            textKey: 'act1_store.shopkeeper_sell_success',
            type: 'bottom',
            speaker: 'Commerçante',
            onComplete: () => {
                store.addItem({
                    id: 'flasque_alcool',
                    name: 'Flasque d’alcool fort',
                    icon: `${baseUrl}assets/whiskyAsset.png`,
                    description: 'Une petite flasque de spiritueux bon marché pour réchauffer le sang.',
                    examineText: 'L’odeur âpre de l’alcool s’échappe à peine le bouchon entrouvert.',
                    quantity: 1,
                    stackable: true,
                    consumable: true
                });

                store.addItem({
                    id: 'tabac_sec',
                    name: 'Paquet de tabac séché',
                    icon: `${baseUrl}assets/tabac.png`,
                    description: 'Un paquet de tabac grossier, idéal pour tromper l’angoisse.',
                    examineText: 'Les feuilles sont sèches et âcres.',
                    quantity: 1,
                    stackable: true,
                    consumable: true
                });

                store.updateAct1Progress({ storeRationedToday: true });
            }
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

        this.addHotspot({
            scene: this,
            x: 214,
            y: height * 0.5,
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
                        store.addJournalNote(
                            i18n.t('act1_church.journal_note_title'),
                            i18n.t('act1_church.journal_note_content'),
                            i18n.t('act1_church.journal_timestamp')
                        );

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