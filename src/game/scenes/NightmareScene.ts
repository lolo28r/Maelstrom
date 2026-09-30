import Phaser from 'phaser';
import { useGameStore, type ChoiceOption } from '../../store/useGameStore';
import i18n from '../../i18n';

export class NightmareScene extends Phaser.Scene {
    private currentBg!: Phaser.GameObjects.Image;
    private flashOverlay!: Phaser.GameObjects.Rectangle;

    // Audio 1 : Le prologue des souvenirs (automatique, calé sur 2:16)
    private prologueMusic?: Phaser.Sound.BaseSound;
    private currentTimer?: Phaser.Time.TimerEvent;

    // Audio 2 : L'OST de Nyarla pour la discussion interactive
    private audioElement?: HTMLAudioElement;
    private audioCtx?: AudioContext;
    private sourceNode?: MediaElementAudioSourceNode;
    private filterNode?: BiquadFilterNode;

    private sequenceStep: number = 0;
    private subStep: number = 0;


    private readonly initialSteps = [
        { image: 'litLaurence', keys: ['nightmare.lit_0', 'nightmare.lit_1'], durationPerKey: 4900 },
        { image: 'ruinsMemories', keys: ['nightmare.ruins_0', 'nightmare.ruins_1', 'nightmare.ruins_2', 'nightmare.ruins_3'], durationPerKey: 4300 },
        { image: 'station', keys: ['nightmare.station_0'], durationPerKey: 4300 },
        { image: 'train', keys: ['nightmare.train_0', 'nightmare.train_1', 'nightmare.train_2', 'nightmare.train_3', 'nightmare.train_4'], durationPerKey: 3800 },
        { image: 'lonelyMom', keys: ['nightmare.lonely_0', 'nightmare.lonely_1', 'nightmare.lonely_2'], durationPerKey: 4300 },
        { image: 'crazy', keys: ['nightmare.crazy_0', 'nightmare.crazy_1', 'nightmare.crazy_2', 'nightmare.crazy_3'], durationPerKey: 4900 },
        { image: 'cursedMary', keys: ['nightmare.cursed_0'], durationPerKey: 5300 },
        { image: 'cult', keys: ['nightmare.cult_0', 'nightmare.cult_1'], durationPerKey: 4900 },
        { image: 'fish', keys: ['nightmare.fish_0'], durationPerKey: 4900 },
        { image: 'sea', keys: ['nightmare.sea_0'], durationPerKey: 4900 },
        { image: 'eye', keys: ['nightmare.eye_0', 'nightmare.eye_1'], durationPerKey: 5200 },
        { image: 'eclipse', keys: ['nightmare.eclipse_0', 'nightmare.eclipse_1'], durationPerKey: 6400 } // Un poil plus de lourdeur sur l'éclipse finale
    ];

    constructor() {
        super({ key: 'NightmareScene' });
    }

    preload() {
        const baseUrl = import.meta.env.BASE_URL;

        // Chemins corrigés avec les extensions exactes (.png / .jpg)
        this.load.image('litLaurence', `${baseUrl}assets/litLaurence.png`);
        this.load.image('ruinsMemories', `${baseUrl}assets/ruinsMemories.jpg`);
        this.load.image('station', `${baseUrl}assets/station.png`);
        this.load.image('train', `${baseUrl}assets/train.jpg`);
        this.load.image('lonelyMom', `${baseUrl}assets/lonelyMom.png`);
        this.load.image('crazy', `${baseUrl}assets/crazy.jpg`);
        this.load.image('cursedMary', `${baseUrl}assets/cursedMary.jpg`);
        this.load.image('cult', `${baseUrl}assets/cult.png`);
        this.load.image('fish', `${baseUrl}assets/fish.png`);
        this.load.image('sea', `${baseUrl}assets/sea.jpg`);
        this.load.image('eye', `${baseUrl}assets/eye.png`);
        this.load.image('eclipse', `${baseUrl}assets/eclipse.jpg`);
        this.load.image('nyarla2', `${baseUrl}assets/nyarla2.jpg`);

        this.load.audio('prologueMusic', `${baseUrl}assets/Prologue.mp3`);
        this.load.audio('ostNyarla', `${baseUrl}assets/OSTnyarla.mp3`);
    }

    create() {
        const store = useGameStore.getState();
        store.setScene('NightmareScene');
        this.cameras.main.setBackgroundColor('#000000');
        this.cameras.main.fadeIn(2000, 0, 0, 0);

        this.sequenceStep = 0;
        this.subStep = 0;

        this.flashOverlay = this.add.rectangle(640, 360, 1280, 720, 0xffffff)
            .setAlpha(0)
            .setDepth(999);

        // Écran noir d'introduction textuelle (validé par le joueur)
        store.setDialog({
            textKey: 'nightmare.intro_return',
            type: 'center',
            onComplete: () => {
                store.closeDialog();

                // Lancement du Prologue dans le noir
                if (!this.prologueMusic) {
                    this.prologueMusic = this.sound.add('prologueMusic', { loop: true, volume: 0.3 });
                    this.prologueMusic.play();
                }

                // Temps de silence de 800ms avant l'apparition de la première image
                this.time.delayedCall(800, () => {
                    this.showFirstImageInstantly();
                });
            }
        });
    }

    private showFirstImageInstantly() {
        const { width, height } = this.scale;
        const currentData = this.initialSteps[this.sequenceStep];

        this.currentBg = this.add.image(width / 2, height / 2, currentData.image).setDisplaySize(width, height);
        this.currentBg.setAlpha(1);

        this.time.delayedCall(1200, () => {
            this.playNextAutomaticDialogue();
        });
    }

    // --- ENCHAÎNEMENT AUTOMATIQUE DES SOUVENIRS ---
    private playNextAutomaticDialogue() {
        if (this.sequenceStep >= this.initialSteps.length) {
            this.transitionToNyaraDiscussion();
            return;
        }

        const currentData = this.initialSteps[this.sequenceStep];

        if (this.subStep < currentData.keys.length) {
            const textKey = currentData.keys[this.subStep];
            const store = useGameStore.getState();

            store.setDialog({
                textKey: textKey,
                type: 'bottom',
                speaker: i18n.t('characters.laurence')
            });

            this.currentTimer = this.time.delayedCall(currentData.durationPerKey, () => {
                this.subStep++;
                this.playNextAutomaticDialogue();
            });
        } else {
            this.sequenceStep++;
            this.subStep = 0;

            if (this.sequenceStep < this.initialSteps.length) {
                this.transitionToNextImage(this.initialSteps[this.sequenceStep].image);
            } else {
                this.transitionToNyaraDiscussion();
            }
        }
    }

    private transitionToNextImage(nextImageKey: string) {
        const { width, height } = this.scale;

        this.tweens.add({
            targets: this.currentBg,
            alpha: 0,
            duration: 1000,
            onComplete: () => {
                if (this.currentBg) this.currentBg.destroy();

                this.currentBg = this.add.image(width / 2, height / 2, nextImageKey).setDisplaySize(width, height);
                this.currentBg.setAlpha(0);

                this.tweens.add({
                    targets: this.currentBg,
                    alpha: 1,
                    duration: 1000,
                    onComplete: () => {
                        this.playNextAutomaticDialogue();
                    }
                });
            }
        });
    }

    // --- BASCULE SUR NYARLA2 ET LA DISCUSSION INTERACTIVE ---
    private transitionToNyaraDiscussion() {
        if (this.currentTimer) {
            this.currentTimer.destroy();
        }

        if (this.prologueMusic) {
            this.prologueMusic.stop();
            this.prologueMusic.destroy();
            this.prologueMusic = undefined;
        }

        // Lancement de l'OST Nyarla avec effets Web Audio
        const baseUrl = import.meta.env.BASE_URL;
        try {
            const browserWindow = window as Window & {
                webkitAudioContext?: typeof AudioContext;
            };
            const AudioContextClass = window.AudioContext || browserWindow.webkitAudioContext;
            if (AudioContextClass) {
                this.audioCtx = new AudioContextClass();

                this.audioElement = new Audio(`${baseUrl}assets/OSTnyarla.mp3`);
                this.audioElement.loop = true;
                this.audioElement.volume = 0.35;
                this.audioElement.playbackRate = 0.85;

                this.sourceNode = this.audioCtx.createMediaElementSource(this.audioElement);

                this.filterNode = this.audioCtx.createBiquadFilter();
                this.filterNode.type = 'bandpass';
                this.filterNode.frequency.value = 1300;
                this.filterNode.Q.value = 1.0;

                const distortionNode = this.audioCtx.createWaveShaper();
                distortionNode.curve = makeDistortionCurve(6);

                this.sourceNode.connect(this.filterNode);
                this.filterNode.connect(distortionNode);
                distortionNode.connect(this.audioCtx.destination);

                this.audioElement.play().catch(err => {
                    console.warn("Lecture audio Nyarla bloquée :", err);
                });
            }
        } catch (e) {
            console.warn("Erreur audio Web Audio Nyarla :", e);
        }

        const { width, height } = this.scale;

        this.tweens.add({
            targets: this.currentBg,
            alpha: 0,
            duration: 1500,
            onComplete: () => {
                if (this.currentBg) this.currentBg.destroy();

                this.currentBg = this.add.image(width / 2, height / 2, 'nyarla2').setDisplaySize(width, height).setAlpha(0);

                this.tweens.add({
                    targets: this.currentBg,
                    alpha: 1,
                    duration: 2000,
                    onComplete: () => {
                        this.startScene2Step1();
                    }
                });
            }
        });
    }

    // --- SCÈNE 2 : INTERACTIONS ---
    private startScene2Step1() {
        const store = useGameStore.getState();
        const choicesMap = i18n.t('nightmare.scene_2.step_1_choices', { returnObjects: true }) as Record<string, string>;

        const choices: ChoiceOption[] = [
            { id: 'choice_visions', text: choicesMap.choice_visions, consequences: { consciousnessDelta: 5 } },
            { id: 'choice_manipulation', text: choicesMap.choice_manipulation, consequences: { mentalDelta: -3 } },
            { id: 'choice_stop', text: choicesMap.choice_stop, consequences: { exhaustionDelta: 5 } }
        ];

        store.setDialog({
            textKey: 'nightmare.scene_2.step_1',
            type: 'bottom',
            speaker: i18n.t('characters.unknown'),
            choices: choices,
            onComplete: (selectedChoiceId?: string) => {
                if (!selectedChoiceId) {
                    this.startScene2Step2();
                    return;
                }
                store.setDialog({
                    textKey: `nightmare.scene_2.step_1_reactions.${selectedChoiceId}`,
                    type: 'bottom',
                    speaker: i18n.t('characters.unknown'),
                    choices: [],
                    onComplete: () => {
                        this.startScene2Step2();
                    }
                });
            }
        });
    }

    private startScene2Step2() {
        const store = useGameStore.getState();
        const choicesMap = i18n.t('nightmare.scene_2.step_2_choices', { returnObjects: true }) as Record<string, string>;

        const choices: ChoiceOption[] = [
            { id: 'choice_father_truth', text: choicesMap.choice_father_truth, consequences: { consciousnessDelta: 5 } },
            { id: 'choice_father_protect', text: choicesMap.choice_father_protect, consequences: { mentalDelta: 2 } },
            { id: 'choice_father_fear', text: choicesMap.choice_father_fear, consequences: { mentalDelta: -5 } }
        ];

        store.setDialog({
            textKey: 'nightmare.scene_2.step_2',
            type: 'bottom',
            speaker: i18n.t('characters.unknown'),
            choices: choices,
            onComplete: (selectedChoiceId?: string) => {
                if (!selectedChoiceId) {
                    this.startScene2Step3();
                    return;
                }
                store.setDialog({
                    textKey: `nightmare.scene_2.step_2_reactions.${selectedChoiceId}`,
                    type: 'bottom',
                    speaker: i18n.t('characters.unknown'),
                    choices: [],
                    onComplete: () => {
                        this.startScene2Step3();
                    }
                });
            }
        });
    }

    private startScene2Step3() {
        const store = useGameStore.getState();
        const choicesMap = i18n.t('nightmare.scene_2.step_3_choices', { returnObjects: true }) as Record<string, string>;

        const choices: ChoiceOption[] = [
            { id: 'choice_eye_meaning', text: choicesMap.choice_eye_meaning, consequences: { consciousnessDelta: 10 } },
            { id: 'choice_faith', text: choicesMap.choice_faith, consequences: { mentalDelta: 5 } },
            { id: 'choice_indifference', text: choicesMap.choice_indifference, consequences: { mentalDelta: -5 } }
        ];

        store.setDialog({
            textKey: 'nightmare.scene_2.step_3',
            type: 'bottom',
            speaker: i18n.t('characters.unknown'),
            choices: choices,
            onComplete: (selectedChoiceId?: string) => {
                if (!selectedChoiceId) {
                    this.startScene2Step4();
                    return;
                }
                store.setDialog({
                    textKey: `nightmare.scene_2.step_3_reactions.${selectedChoiceId}`,
                    type: 'bottom',
                    speaker: i18n.t('characters.unknown'),
                    choices: [],
                    onComplete: () => {
                        this.startScene2Step4();
                    }
                });
            }
        });
    }

    private startScene2Step4() {
        const store = useGameStore.getState();
        const choicesMap = i18n.t('nightmare.scene_2.step_4_choices', { returnObjects: true }) as Record<string, string>;

        const choices: ChoiceOption[] = [
            { id: 'choice_knowledge', text: choicesMap.choice_knowledge, consequences: { consciousnessDelta: 15 } },
            { id: 'choice_rest', text: choicesMap.choice_rest, consequences: { exhaustionDelta: -10 } },
            { id: 'choice_resist', text: choicesMap.choice_resist, consequences: { mentalDelta: 5 } }
        ];

        store.setDialog({
            textKey: 'nightmare.scene_2.step_4',
            type: 'bottom',
            speaker: i18n.t('characters.unknown'),
            choices: choices,
            onComplete: (selectedChoiceId?: string) => {
                if (!selectedChoiceId) {
                    this.startScene2Step5();
                    return;
                }
                store.setDialog({
                    textKey: `nightmare.scene_2.step_4_reactions.${selectedChoiceId}`,
                    type: 'bottom',
                    speaker: i18n.t('characters.unknown'),
                    choices: [],
                    onComplete: () => {
                        this.startScene2Step5();
                    }
                });
            }
        });
    }

    private startScene2Step5() {
        const store = useGameStore.getState();
        const choicesMap = i18n.t('nightmare.scene_2.step_5_choices', { returnObjects: true }) as Record<string, string>;

        const choices: ChoiceOption[] = [
            { id: 'choice_true_face', text: choicesMap.choice_true_face, consequences: { consciousnessDelta: 10 } },
            { id: 'choice_identity', text: choicesMap.choice_identity, consequences: { mentalDelta: -3 } },
            { id: 'choice_wakeup', text: choicesMap.choice_wakeup, consequences: { exhaustionDelta: -10 } }
        ];

        store.setDialog({
            textKey: 'nightmare.scene_2.step_5_choices.choice_true_face',
            type: 'bottom',
            speaker: i18n.t('characters.unknown'),
            choices: choices,
            onComplete: (selectedChoiceId?: string) => {
                if (!selectedChoiceId) {
                    this.startOutro();
                    return;
                }
                store.setDialog({
                    textKey: `nightmare.scene_2.step_5_reactions.${selectedChoiceId}`,
                    type: 'bottom',
                    speaker: i18n.t('characters.unknown'),
                    choices: [],
                    onComplete: () => {
                        this.startOutro();
                    }
                });
            }
        });
    }

    private startOutro() {
        const store = useGameStore.getState();

        store.setDialog({
            textKey: 'nightmare.scene_2.outro',
            type: 'bottom',
            speaker: i18n.t('characters.unknown'),
            onComplete: () => {
                this.triggerClimaxAndWakeUp();
            }
        });
    }

    private triggerClimaxAndWakeUp() {
        const store = useGameStore.getState();

        // Fondu audio beaucoup plus long et progressif
        if (this.audioElement) {
            const initialVolume = this.audioElement.volume;
            const step = 0.01; // Des pas plus petits pour un fondu plus doux
            const fadeAudio = setInterval(() => {
                if (this.audioElement && this.audioElement.volume > step) {
                    this.audioElement.volume -= step;
                } else {
                    if (this.audioElement) {
                        this.audioElement.pause();
                        this.audioElement.currentTime = 0;
                    }
                    clearInterval(fadeAudio);
                }
            }, 80); // Intervalle légèrement étiré (80ms au lieu de 100ms) pour l'étaler dans le temps
        }

        if (this.audioCtx && this.audioCtx.state !== 'closed') {
            this.audioCtx.close();
        }

        this.cameras.main.shake(300, 0.025);

        this.tweens.add({
            targets: this.currentBg,
            alpha: 0,
            duration: 3000, // Fondu visuel un tout petit peu plus long aussi pour accompagner la musique
            ease: 'Sine.easeInOut',
            onComplete: () => {
                store.setEyelidsClosing(true);

                this.time.delayedCall(2000, () => {
                    store.setEyelidsClosing(false);
                    store.setScene('ChapterEndScene');
                    this.scene.start('ChapterEndScene');
                });
            }
        });
    }
}

function makeDistortionCurve(amount: number = 20): Float32Array<ArrayBuffer> {
    const k = typeof amount === 'number' ? amount : 50;
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const deg = Math.PI / 180;
    for (let i = 0; i < n_samples; ++i) {
        const x = (i * 2) / n_samples - 1;
        curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve as Float32Array<ArrayBuffer>;
}