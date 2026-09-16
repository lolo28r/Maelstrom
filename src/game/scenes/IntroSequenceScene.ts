import Phaser from 'phaser';
import { useGameStore } from '../../store/useGameStore';
import i18n from '../../i18n';

export class IntroSequenceScene extends Phaser.Scene {
    private userChoices: number[] = [];
    private currentMusic: Phaser.Sound.BaseSound | null = null;
    private isSkipping: boolean = false;

    constructor() {
        super('IntroSequence');
    }

    preload() {
        if (!this.cache.audio.exists('intro_theme')) {
            this.load.audio('intro_theme', '/assets/intro.mp3');
        }
        // Nouveaux assets d'introduction avec les noms exacts demandés
        this.load.image('party', '/assets/party.jpg');
        this.load.image('city', '/assets/city.jpg');
        this.load.image('satellite', '/assets/satellite.jpg');

        // Assets cosmiques suivants
        this.load.image('introEarth', '/assets/introEarth.jpg');
        this.load.image('introGalaxy', '/assets/introGalaxy.png');
        this.load.image('introVoid', '/assets/introVoid.png');
    }

    create() {
        useGameStore.getState().setScene('IntroSequence');
        this.cameras.main.setBackgroundColor('#000000');
        this.cameras.main.fadeIn(1500, 0, 0, 0);
        this.userChoices = [];
        this.isSkipping = false;

        // --- BOUTON PLEIN ÉCRAN (SVG) ---
        const fsSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
      </svg>
    `;
        const fsBlob = new Blob([fsSvg], { type: 'image/svg+xml;charset=utf-8' });
        const fsUrl = URL.createObjectURL(fsBlob);

        this.load.image('fs_icon_intro', fsUrl);
        this.load.once('complete', () => {
            if (this.sys.isActive()) {
                const fsBtn = this.add.image(1240, 40, 'fs_icon_intro')
                    .setInteractive({ useHandCursor: true })
                    .setScale(1.1);

                fsBtn.on('pointerover', () => fsBtn.setTint(0xe2e8f0));
                fsBtn.on('pointerout', () => fsBtn.clearTint());
                fsBtn.on('pointerdown', () => {
                    if (this.scale.isFullscreen) {
                        this.scale.stopFullscreen();
                    } else {
                        this.scale.startFullscreen();
                    }
                });
            }
        });

        // --- BOUTON SKIP (SVG) ---
        const skipSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#475569" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="5 4 15 12 5 20 5 4"></polygon>
        <line x1="19" y1="4" x2="19" y2="20"></line>
      </svg>
    `;
        const skipBlob = new Blob([skipSvg], { type: 'image/svg+xml;charset=utf-8' });
        const skipUrl = URL.createObjectURL(skipBlob);

        this.load.image('skip_icon_intro', skipUrl);
        this.load.once('complete', () => {
            if (this.sys.isActive()) {
                const skipBtn = this.add.image(1190, 40, 'skip_icon_intro')
                    .setInteractive({ useHandCursor: true })
                    .setScale(1.1);

                skipBtn.on('pointerover', () => skipBtn.setTint(0xe2e8f0));
                skipBtn.on('pointerout', () => skipBtn.clearTint());
                skipBtn.on('pointerdown', () => this.skipIntro());
            }
        });

        this.load.start();

        try {
            if (this.cache.audio.exists('intro_theme')) {
                this.currentMusic = this.sound.add('intro_theme', { volume: 0, loop: false });
                this.currentMusic.play({ seek: 40 });
                this.tweens.add({ targets: this.currentMusic, volume: 0.5, duration: 3000 });
            }
        } catch (e) {
            console.warn('Audio play restricted or unavailable:', e);
        }

        // Affichage de l'avertissement audio au tout début, avant les questions
        this.showAudioWarning(() => {
            if (!this.isSkipping) {
                this.askQuestion1();
            }
        });
    }

    showAudioWarning(onComplete: () => void) {
        if (this.isSkipping) return;

        const warningText = this.add.text(640, 360, "Ce jeu se vit de préférence avec le son activé\net un casque audio pour une immersion optimale.", {
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: '28px',
            fontStyle: 'italic',
            color: '#cbd5e1',
            align: 'center',
            wordWrap: { width: 900 },
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: warningText,
            alpha: 1,
            duration: 1500,
            hold: 4000,
            yoyo: true,
            onComplete: () => {
                warningText.destroy();
                onComplete();
            },
        });
    }

    skipIntro() {
        if (this.isSkipping) return;
        this.isSkipping = true;

        this.tweens.killAll();

        if (this.currentMusic) {
            this.tweens.add({
                targets: this.currentMusic,
                volume: 0,
                duration: 800,
                onComplete: () => {
                    if (this.currentMusic) this.currentMusic.stop();
                }
            });
        }

        this.cameras.main.fadeOut(800, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.startAct1();
        });
    }

    // --- QUESTION 1 : Sombres secrets (OUI = conscient) ---
    askQuestion1() {
        if (this.isSkipping) return;
        this.showBinaryChoice(
            i18n.t('intro.q1'),
            () => { this.userChoices.push(1); this.askQuestion2(); }, // OUI (Éveillé)
            () => { this.userChoices.push(0); this.askQuestion2(); }  // NON
        );
    }

    // --- QUESTION 2 : Sécurité sur notre boule géante (NON = lucide/angoissé) ---
    askQuestion2() {
        if (this.isSkipping) return;
        this.showBinaryChoice(
            i18n.t('intro.q2'),
            () => { this.userChoices.push(0); this.askQuestion3(); }, // OUI
            () => { this.userChoices.push(1); this.askQuestion3(); }  // NON (Éveillé)
        );
    }

    // --- QUESTION 3 : Murmures dans la nuit (OUI = conscient) ---
    askQuestion3() {
        if (this.isSkipping) return;
        this.showBinaryChoice(
            i18n.t('intro.q3'),
            () => { this.userChoices.push(1); this.askQuestion4(); }, // OUI (Éveillé)
            () => { this.userChoices.push(0); this.askQuestion4(); }  // NON
        );
    }

    // --- QUESTION 4 : Dieu bienveillant (NON = lucide/angoissé) ---
    askQuestion4() {
        if (this.isSkipping) return;
        this.showBinaryChoice(
            i18n.t('intro.q4'),
            () => { this.userChoices.push(0); this.askQuestion5(); }, // OUI
            () => { this.userChoices.push(1); this.askQuestion5(); }  // NON (Éveillé)
        );
    }

    // --- QUESTION 5 : Commencement du Cosmos (NON = lucide/angoissé) ---
    askQuestion5() {
        if (this.isSkipping) return;
        this.showBinaryChoice(
            i18n.t('intro.q5'),
            () => { this.userChoices.push(0); this.evaluateProfileAndProceed(); }, // OUI
            () => { this.userChoices.push(1); this.evaluateProfileAndProceed(); }  // NON (Éveillé)
        );
    }

    showBinaryChoice(questionText: string, onYes: () => void, onNo: () => void) {
        if (this.isSkipping) return;
        const isRTL = i18n.language === 'ar';

        const qObj = this.add.text(640, 280, questionText, {
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: '28px',
            fontStyle: 'italic',
            color: '#e2e8f0',
            align: isRTL ? 'right' : 'center',
            wordWrap: { width: 950 },
        }).setOrigin(0.5).setAlpha(0);

        const btnYes = this.add.text(520, 440, i18n.t('intro.yes'), {
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: '24px',
            color: '#94a3b8',
        }).setOrigin(0.5).setAlpha(0).setInteractive({ useHandCursor: true });

        const btnNo = this.add.text(760, 440, i18n.t('intro.no'), {
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: '24px',
            color: '#94a3b8',
        }).setOrigin(0.5).setAlpha(0).setInteractive({ useHandCursor: true });

        this.tweens.add({
            targets: [qObj, btnYes, btnNo],
            alpha: 1,
            duration: 1500,
        });

        const cleanupAndProceed = (callback: () => void) => {
            if (this.isSkipping) return;
            this.tweens.add({
                targets: [qObj, btnYes, btnNo],
                alpha: 0,
                duration: 600,
                onComplete: () => {
                    qObj.destroy();
                    btnYes.destroy();
                    btnNo.destroy();
                    callback();
                },
            });
        };

        btnYes.on('pointerover', () => btnYes.setColor('#00f0ff'));
        btnYes.on('pointerout', () => btnYes.setColor('#94a3b8'));
        btnYes.on('pointerdown', () => cleanupAndProceed(onYes));

        btnNo.on('pointerover', () => btnNo.setColor('#a855f7'));
        btnNo.on('pointerout', () => btnNo.setColor('#94a3b8'));
        btnNo.on('pointerdown', () => cleanupAndProceed(onNo));
    }

    evaluateProfileAndProceed() {
        if (this.isSkipping) return;
        const score = this.userChoices.reduce((a, b) => a + b, 0);

        useGameStore.getState().modifyStat('consciousness', score * 5);

        let verdictKey = 'intro.verdicts.aveugle';
        if (score === 5) verdictKey = 'intro.verdicts.fanatique';
        else if (score === 4) verdictKey = 'intro.verdicts.poreux';
        else if (score === 3) verdictKey = 'intro.verdicts.lucide';
        else if (score === 2) verdictKey = 'intro.verdicts.curieux';
        else verdictKey = 'intro.verdicts.dogmatique';

        const finalVerdictText = i18n.t(verdictKey);

        const verdictObj = this.add.text(640, 360, finalVerdictText, {
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: '36px',
            fontStyle: 'italic',
            color: '#00f0ff',
            align: 'center',
            wordWrap: { width: 1000 }
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: verdictObj,
            alpha: 1,
            duration: 1200,
            hold: 3000,
            yoyo: true,
            onComplete: () => {
                verdictObj.destroy();
                this.startCosmicSequence();
            },
        });
    }

    startCosmicSequence() {
        if (this.isSkipping) return;

        // Séquence visuelle complète : party.jpg -> city.jpg -> satellite.jpg -> introEarth -> introGalaxy -> introVoid
        const partyBg = this.add.image(640, 360, 'party').setAlpha(0);
        partyBg.setDisplaySize(1280, 720);

        const cityBg = this.add.image(640, 360, 'city').setAlpha(0);
        cityBg.setDisplaySize(1280, 720);

        const satelliteBg = this.add.image(640, 360, 'satellite').setAlpha(0);
        satelliteBg.setDisplaySize(1280, 720);

        const earthBg = this.add.image(640, 360, 'introEarth').setAlpha(0);
        earthBg.setDisplaySize(1280, 720);

        const galaxyBg = this.add.image(640, 360, 'introGalaxy').setAlpha(0);
        galaxyBg.setDisplaySize(1280, 720);

        const voidBg = this.add.image(640, 360, 'introVoid').setAlpha(0);
        voidBg.setDisplaySize(1280, 720);

        // Enchaînement fluide de toutes les images
        this.tweens.add({
            targets: partyBg,
            alpha: 1,
            duration: 1500,
            hold: 3500,
            yoyo: true,
            onComplete: () => {
                if (this.isSkipping) return;
                this.time.delayedCall(400, () => {
                    this.tweens.add({
                        targets: cityBg,
                        alpha: 1,
                        duration: 1500,
                        hold: 3500,
                        yoyo: true,
                        onComplete: () => {
                            if (this.isSkipping) return;
                            this.time.delayedCall(400, () => {
                                this.tweens.add({
                                    targets: satelliteBg,
                                    alpha: 1,
                                    duration: 1500,
                                    hold: 3500,
                                    yoyo: true,
                                    onComplete: () => {
                                        if (this.isSkipping) return;
                                        this.time.delayedCall(400, () => {
                                            this.tweens.add({
                                                targets: earthBg,
                                                alpha: 1,
                                                duration: 1500,
                                                hold: 3500,
                                                yoyo: true,
                                                onComplete: () => {
                                                    if (this.isSkipping) return;
                                                    this.time.delayedCall(400, () => {
                                                        this.tweens.add({
                                                            targets: galaxyBg,
                                                            alpha: 1,
                                                            duration: 1500,
                                                            hold: 3500,
                                                            yoyo: true,
                                                            onComplete: () => {
                                                                if (this.isSkipping) return;
                                                                this.time.delayedCall(400, () => {
                                                                    this.tweens.add({
                                                                        targets: voidBg,
                                                                        alpha: 1,
                                                                        duration: 1500,
                                                                        hold: 3500,
                                                                        yoyo: true,
                                                                        onComplete: () => {
                                                                            partyBg.destroy();
                                                                            cityBg.destroy();
                                                                            satelliteBg.destroy();
                                                                            earthBg.destroy();
                                                                            galaxyBg.destroy();
                                                                            voidBg.destroy();

                                                                            this.time.delayedCall(600, () => {
                                                                                this.showCreditsAndTitle();
                                                                            });
                                                                        },
                                                                    });
                                                                });
                                                            },
                                                        });
                                                    });
                                                },
                                            });
                                        });
                                    },
                                });
                            });
                        },
                    });
                });
            },
        });
    }

    showCreditsAndTitle() {
        if (this.isSkipping) return;

        const credit1 = this.add.text(640, 330, i18n.t('intro.credits.author'), {
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: '26px',
            color: '#cbd5e1',
        }).setOrigin(0.5).setAlpha(0);

        const credit2 = this.add.text(640, 390, i18n.t('intro.credits.ai'), {
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: '20px',
            color: '#64748b',
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: [credit1, credit2],
            alpha: 1,
            duration: 1200,
            hold: 2500,
            yoyo: true,
            onComplete: () => {
                if (this.isSkipping) return;

                // --- HOMMAGE EN DEUX LIGNES DISTINCTES ---
                const homageText1 = this.add.text(640, 335, i18n.t('intro.credits.homage_line_1'), {
                    fontFamily: '"Cormorant Garamond", serif',
                    fontSize: '24px',
                    fontStyle: 'italic',
                    color: '#94a3b8',
                    align: 'center',
                    wordWrap: { width: 900 }
                }).setOrigin(0.5).setAlpha(0);

                const homageText2 = this.add.text(640, 385, i18n.t('intro.credits.homage_line_2'), {
                    fontFamily: '"Cormorant Garamond", serif',
                    fontSize: '24px',
                    fontStyle: 'italic',
                    color: '#94a3b8',
                    align: 'center',
                    wordWrap: { width: 900 }
                }).setOrigin(0.5).setAlpha(0);

                // Affichage de la première ligne d'hommage
                this.tweens.add({
                    targets: homageText1,
                    alpha: 1,
                    duration: 1500,
                    hold: 7000,
                    yoyo: true,
                    onComplete: () => {
                        homageText1.destroy();
                    }
                });

                // Affichage de la seconde ligne d'hommage puis enchaînement du titre principal
                this.tweens.add({
                    targets: homageText2,
                    alpha: 1,
                    duration: 1500,
                    delay: 400,
                    hold: 7000,
                    yoyo: true,
                    onComplete: () => {
                        if (this.isSkipping) return;
                        homageText2.destroy();

                        const bigTitle = this.add.text(640, 360, 'Maelström', {
                            fontFamily: '"Tangerine", cursive',
                            fontSize: '120px',
                            color: '#ffffff',
                            fontStyle: 'bold'
                        }).setOrigin(0.5).setAlpha(0);

                        const totalTitleDuration = 2200 + 6000 + 2200;

                        if (this.currentMusic) {
                            this.tweens.add({
                                targets: this.currentMusic,
                                volume: 0,
                                duration: totalTitleDuration + 1000,
                                onComplete: () => {
                                    if (this.currentMusic) this.currentMusic.stop();
                                }
                            });
                        }

                        this.tweens.add({
                            targets: bigTitle,
                            alpha: 1,
                            duration: 2200,
                            hold: 6000,
                            yoyo: true,
                            onComplete: () => {
                                if (this.isSkipping) return;

                                this.cameras.main.fadeOut(2000, 0, 0, 0);
                                this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                                    this.startAct1();
                                });
                            },
                        });
                    }
                });
            },
        });
    }

    startAct1() {
        this.scene.start('ProfessorOffice');
    }
}