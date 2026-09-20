import Phaser from 'phaser';
import { useGameStore } from '../../store/useGameStore';
import i18n from '../../i18n';

export class MainMenuScene extends Phaser.Scene {
    private devCodeSequence: string = '';

    constructor() {
        super('MainMenu');
    }

    preload() {
        // Utilisation de BASE_URL pour adapter le chemin en local et en production (GitHub Pages)
        const baseUrl = import.meta.env.BASE_URL;

        if (!this.cache.audio.exists('menu_music')) {
            this.load.audio('menu_music', `${baseUrl}assets/menu_theme.mp3`);
        }
        // Préchargement de l'image de fond du menu
        this.load.image('menu_bg', `${baseUrl}assets/maelstrom.jpg`);
    }

    create() {
        useGameStore.getState().setScene('MainMenu');
        this.cameras.main.setBackgroundColor('#05070a');

        // --- ÉCOUTEUR CLAVIER POUR LE CODE DEV "1937" ---
        this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
            if (/^[0-9]$/.test(event.key)) {
                this.devCodeSequence += event.key;

                if (this.devCodeSequence.length > 4) {
                    this.devCodeSequence = this.devCodeSequence.slice(-4);
                }

                if (this.devCodeSequence === '1937') {
                    this.devCodeSequence = '';
                    this.openDevChapterMenu();
                }
            }
        });

        // On attend explicitement que les polices soient chargées par le DOM avant de dessiner
        document.fonts.ready.then(() => {
            if (!this.sys.isActive()) return;
            this.initMenuUI();
        });
    }

    initMenuUI() {
        this.cameras.main.fadeIn(1000, 0, 0, 0);

        // --- BACKGROUND IMAGE (maelstrom.jpg) ---
        if (this.textures.exists('menu_bg')) {
            const bg = this.add.image(640, 360, 'menu_bg').setDisplaySize(1280, 720);
            bg.setAlpha(0.45); // Image assombrie pour étouffer l'éclat d'origine
        }

        // --- FILTRE SOMBRE INTENSIF (Voile d'occultation) ---
        const darkOverlay = this.add.graphics();
        darkOverlay.fillStyle(0x020408, 0.65); // Voile sombre renforcé pour une ambiance plus lourde
        darkOverlay.fillRect(0, 0, 1280, 720);

        // Audio handling
        const playMenuMusic = () => {
            try {
                const soundManager = this.sound as Phaser.Sound.WebAudioSoundManager;
                if (soundManager.context && soundManager.context.state === 'suspended') {
                    soundManager.context.resume();
                }

                if (!this.sound.get('menu_music')) {
                    const music = this.sound.add('menu_music', { volume: 0.35, loop: true });
                    music.play();
                }
            } catch (e) {
                console.warn('Audio play restricted:', e);
            }
        };

        playMenuMusic();
        this.input.once('pointerdown', () => playMenuMusic());

        // Language selector
        const langs = ['FR', 'EN', 'AR'];
        langs.forEach((langCode, index) => {
            const btnLang = this.add
                .text(1150 + index * 45, 40, langCode, {
                    fontFamily: '"Cormorant Garamond", serif',
                    fontSize: '20px',
                    color: i18n.language.toUpperCase() === langCode ? '#e2e8f0' : '#475569',
                })
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true });

            btnLang.on('pointerdown', () => {
                i18n.changeLanguage(langCode.toLowerCase());
                this.scene.restart();
            });
        });

        // Title (Police Tangerine en Vrai Élément DOM HTML pour un rendu parfait)
        const titleElement = document.createElement('h1');
        titleElement.innerText = "Maelström";
        titleElement.style.fontFamily = '"Tangerine", cursive';
        titleElement.style.fontSize = '120px';
        titleElement.style.color = '#f8fafc';
        titleElement.style.fontWeight = '700';
        titleElement.style.textAlign = 'center';
        titleElement.style.margin = '0';
        titleElement.style.padding = '0';
        titleElement.style.lineHeight = '1';
        titleElement.style.whiteSpace = 'nowrap';
        titleElement.style.pointerEvents = 'none';

        this.add.dom(640, 200, titleElement).setOrigin(0.5);

        // Sous-titre (Police Cormorant Garamond)
        this.add
            .text(640, 285, "— L ' É V E I L —", {
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: '22px',
                fontStyle: 'italic',
                color: '#94a3b8',
            })
            .setOrigin(0.5);

        // Menu options
        const store = useGameStore.getState();
        const hasSave = store.hasSave();

        const menuOptions = [
            {
                text: i18n.t('menu.newGame'),
                action: () => this.startLoadingAndNewGame(),
            },
            {
                text: i18n.t('menu.continue'),
                action: () => this.continueSavedGame(),
                disabled: !hasSave,
            },
            {
                text: i18n.t('menu.settings'),
                action: () => {
                    store.setDialog({
                        textKey: 'Configuration : Rendu 16:9.\nSystème de sauvegarde automatique activé.',
                        speaker: 'RÉGLAGES',
                        type: 'bottom',
                    });
                },
            },
        ];

        let startY = 380;
        menuOptions.forEach((option, index) => {
            const color = option.disabled ? '#334155' : '#cbd5e1';
            const btn = this.add
                .text(640, startY + index * 65, option.text, {
                    fontFamily: '"Cormorant Garamond", serif',
                    fontSize: '26px',
                    color: color,
                })
                .setOrigin(0.5);

            if (!option.disabled) {
                btn.setInteractive({ useHandCursor: true });
                btn.on('pointerover', () => {
                    btn.setColor('#ffffff');
                    btn.setScale(1.05);
                });
                btn.on('pointerout', () => {
                    btn.setColor('#cbd5e1');
                    btn.setScale(1.0);
                });
                btn.on('pointerdown', () => option.action());
            }
        });
    }

    // --- INTERFACE DU MODE DEV (SÉLECTION DES CHAPITRES) ---
    private openDevChapterMenu() {
        const store = useGameStore.getState();
        this.sound.stopAll();

        store.setDialog({
            speaker: '[ MODE DÉVELOPPEUR - ACCÈS RESTREINT ]',
            textKey: 'Code 1937 validé.\nChoisissez le point de saut temporel :',
            type: 'bottom',
            choices: [
                {
                    id: 'dev_intro',
                    text: '1. Introduction / Prologue (IntroSequence)',
                    consequences: {},
                },
                {
                    id: 'dev_office',
                    text: '2. Bureau du Professeur & Lettre (ProfessorOffice)',
                    consequences: {},
                },
                {
                    id: 'dev_dream',
                    text: '3. Cauchemar / Rencontre (DreamScene)',
                    consequences: {},
                },
                {
                    id: 'dev_morning',
                    text: '4. Réveil & Disparition / Journal (DeskMorningScene)',
                    consequences: {},
                },
                {
                    id: 'dev_city',
                    text: '5. Exploration d\'Arkham / Ville (CityExplorerScene)',
                    consequences: {},
                },
                {
                    id: 'dev_end',
                    text: '6. Fin du Chapitre 1 (ChapterEndScene)',
                    consequences: {},
                },
                {
                    id: 'dev_close',
                    text: 'Fermer le mode dev',
                    consequences: {},
                }
            ],
            onComplete: (selectedChoiceId?: string) => {
                if (!selectedChoiceId || selectedChoiceId === 'dev_close') {
                    store.closeDialog();
                    return;
                }

                let targetScene = 'MainMenu';
                if (selectedChoiceId === 'dev_intro') targetScene = 'IntroSequence';
                if (selectedChoiceId === 'dev_office') targetScene = 'ProfessorOffice';
                if (selectedChoiceId === 'dev_dream') targetScene = 'DreamScene';
                if (selectedChoiceId === 'dev_morning') targetScene = 'DeskMorningScene';
                if (selectedChoiceId === 'dev_city') targetScene = 'CityExplorerScene';
                if (selectedChoiceId === 'dev_end') targetScene = 'ChapterEndScene';

                store.closeDialog();
                this.cameras.main.fadeOut(500, 0, 0, 0);
                this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                    this.scene.start(targetScene);
                });
            }
        });
    }

    startLoadingAndNewGame() {
        useGameStore.getState().resetGame();
        this.tweens.killAll();

        const loadingBg = this.add.graphics();
        loadingBg.fillStyle(0x020408, 0.9);
        loadingBg.fillRect(0, 0, 1280, 720);

        const loadingText = this.add.text(640, 330, "Chargement...", {
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: '24px',
            fontStyle: 'italic',
            color: '#94a3b8'
        }).setOrigin(0.5);

        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x1e293b, 0.8);
        progressBox.fillRect(440, 370, 400, 20);

        const progressBar = this.add.graphics();

        const baseUrl = import.meta.env.BASE_URL;
        const loader = new Phaser.Loader.LoaderPlugin(this);
        loader.image('introEarth', `${baseUrl}assets/introEarth.png`);
        loader.image('introGalaxy', `${baseUrl}assets/introGalaxy.png`);
        loader.image('introVoid', `${baseUrl}assets/introVoid.png`);
        if (!this.cache.audio.exists('intro_theme')) {
            loader.audio('intro_theme', `${baseUrl}assets/intro.mp3`);
        }

        loader.on('progress', (value: number) => {
            progressBar.clear();
            progressBar.fillStyle(0x00f0ff, 1);
            progressBar.fillRect(442, 372, 396 * value, 16);
        });

        loader.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            loadingBg.destroy();

            this.sound.stopAll();
            this.cameras.main.fadeOut(800, 0, 0, 0);
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                this.scene.start('IntroSequence');
            });
        });

        loader.start();
    }

    continueSavedGame() {
        const store = useGameStore.getState();
        if (store.loadGame()) {
            const targetScene = store.currentScene || 'ProfessorOffice';
            this.sound.stopAll();
            this.cameras.main.fadeOut(800, 0, 0, 0);
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                this.scene.start(targetScene);
            });
        } else {
            store.setDialog({
                textKey: 'Aucune sauvegarde locale trouvée.',
                speaker: 'SYSTÈME',
                type: 'bottom',
            });
        }
    }
}