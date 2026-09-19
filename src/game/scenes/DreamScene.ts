import Phaser from 'phaser';
import { useGameStore } from '../../store/useGameStore';
import { CHOICES } from '../../constants/gameChoices';

export class DreamScene extends Phaser.Scene {
    private bgImage!: Phaser.GameObjects.Image;
    private flashOverlay!: Phaser.GameObjects.Rectangle;
    private audioElement?: HTMLAudioElement;
    private audioCtx?: AudioContext;
    private sourceNode?: MediaElementAudioSourceNode;
    private filterNode?: BiquadFilterNode;

    constructor() {
        super('DreamScene');
    }

    preload() {
        const baseUrl = import.meta.env.BASE_URL;

        this.load.image('nyarlathotep_bg', `${baseUrl}assets/nyarlathotep.jpg`);
        this.load.image('nyarlaTrueForm', `${baseUrl}assets/nyarlaTrueForm.jpg`);
    }

    create() {
        const store = useGameStore.getState();
        store.setScene('DreamScene');
        const baseUrl = import.meta.env.BASE_URL;

        // Lancement et filtrage direct via Web Audio API (Effet Radio + Distorsion douce)
        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
                this.audioCtx = new AudioContextClass();

                this.audioElement = new Audio(`${baseUrl}assets/OSTnyarla.mp3`);
                this.audioElement.loop = true;
                this.audioElement.volume = 0.35;
                this.audioElement.playbackRate = 0.85;

                this.sourceNode = this.audioCtx.createMediaElementSource(this.audioElement);

                // 1. Filtre Radio (Médiums resserrés)
                this.filterNode = this.audioCtx.createBiquadFilter();
                this.filterNode.type = 'bandpass';
                this.filterNode.frequency.value = 1300;
                this.filterNode.Q.value = 1.0;

                // 2. Nœud de Distorsion subtile
                const distortionNode = this.audioCtx.createWaveShaper();
                distortionNode.curve = makeDistortionCurve(6);

                // Chaîne de connexion : Source -> Filtre Radio -> Distorsion -> Haut-parleurs
                this.sourceNode.connect(this.filterNode);
                this.filterNode.connect(distortionNode);
                distortionNode.connect(this.audioCtx.destination);

                this.audioElement.play().catch(err => {
                    console.warn("Lecture audio bloquée par le navigateur :", err);
                });
            }
        } catch (e) {
            console.warn("Impossible d'initialiser l'effet radio/distorsion :", e);
        }

        this.cameras.main.setBackgroundColor('#000000');
        this.cameras.main.fadeIn(3500, 0, 0, 0);

        this.bgImage = this.add.image(640, 360, 'nyarlathotep_bg')
            .setDisplaySize(1280, 720)
            .setAlpha(0);

        this.flashOverlay = this.add.rectangle(640, 360, 1280, 720, 0xffffff)
            .setAlpha(0)
            .setDepth(999);

        this.tweens.add({
            targets: this.bgImage,
            alpha: 1,
            duration: 6000,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                this.time.delayedCall(2000, () => {
                    this.startStep1();
                });
            }
        });
    }

    // --- ÉTAPE 1 : Le tacle sur l'alcool ---
    private startStep1() {
        const store = useGameStore.getState();

        store.setDialog({
            textKey: 'dream.scene_1.step_1',
            choices: [
                {
                    id: 'choice_alcohol_needed',
                    text: "« Oui... c'est l'alcool qu'il me faut pour tenir. »",
                    consequences: { mentalDelta: 5, exhaustionDelta: 5 }
                },
                {
                    id: 'choice_alcohol_defensive',
                    text: "« Mêle-toi de tes affaires. Ça ne te regarde pas. »",
                    consequences: { mentalDelta: 2, consciousnessDelta: -2 }
                }
            ],
            onComplete: (selectedChoiceId?: string) => {
                let reactionKey = '';
                if (selectedChoiceId === 'choice_alcohol_needed') {
                    reactionKey = 'dream.scene_1.step_1_reactions.choice_alcohol_needed';
                } else if (selectedChoiceId === 'choice_alcohol_defensive') {
                    reactionKey = 'dream.scene_1.step_1_reactions.choice_alcohol_defensive';
                }

                if (reactionKey) {
                    store.setDialog({
                        textKey: reactionKey,
                        choices: [],
                        onComplete: () => {
                            this.startStep2();
                        }
                    });
                } else {
                    this.startStep2();
                }
            }
        });
    }

    // --- ÉTAPE 2 : Le père et les cris ---
    private startStep2() {
        const store = useGameStore.getState();

        store.setDialog({
            textKey: 'dream.scene_1.step_2',
            onComplete: () => {
                this.startStep3();
            }
        });
    }

    private startStep3() {
        const store = useGameStore.getState();
        const consciousness = store.consciousness;

        const choices = [
            {
                id: 'choice_old_ones_yes',
                text: "« Oui. »",
                consequences: { consciousnessDelta: 10 }
            },
            {
                id: 'choice_old_ones_no',
                text: "« Non. »",
                consequences: { mentalDelta: 5 }
            }
        ];

        const thresholdConsciousness = 25;
        if (consciousness >= thresholdConsciousness) {
            choices.push({
                id: 'choice_old_ones_what',
                text: "👁️ « Ceux qui n'ont de nom ? »",
                consequences: { consciousnessDelta: 15 }
            });

            store.setDialog({
                textKey: 'intro.tutoriel_choix_conscience',
                type: 'center',
                onComplete: () => {
                    this.showStep3Dialog(choices);
                }
            });
            return;
        }

        this.showStep3Dialog(choices);
    }

    private showStep3Dialog(choices: any[]) {
        const store = useGameStore.getState();
        store.setDialog({
            textKey: 'dream.scene_1.step_3',
            choices: choices,
            onComplete: (selectedChoiceId?: string) => {
                let reactionKey = '';
                if (selectedChoiceId === 'choice_old_ones_what') {
                    reactionKey = 'dream.scene_1.step_3_reactions.choice_old_ones_what';
                } else if (selectedChoiceId === 'choice_old_ones_yes') {
                    reactionKey = 'dream.scene_1.step_3_reactions.choice_old_ones_yes';
                } else if (selectedChoiceId === 'choice_old_ones_no') {
                    reactionKey = 'dream.scene_1.step_3_reactions.choice_old_ones_no';
                }

                if (reactionKey) {
                    store.setDialog({
                        textKey: reactionKey,
                        choices: [],
                        onComplete: () => {
                            if (selectedChoiceId === 'choice_old_ones_what') {
                                store.setDialog({
                                    textKey: 'dream.scene_1.step_3_bonus',
                                    choices: [],
                                    onComplete: () => {
                                        this.startStep4();
                                    }
                                });
                            } else {
                                this.startStep4();
                            }
                        }
                    });
                } else {
                    this.startStep4();
                }
            }
        });
    }

    private startStep4() {
        const store = useGameStore.getState();

        store.setDialog({
            textKey: 'dream.scene_1.step_4',
            choices: [
                {
                    id: 'choice_final_yes',
                    text: "« Oui. »",
                    consequences: { consciousnessDelta: 20, mentalDelta: -10, exhaustionDelta: -15 }
                },
                {
                    id: 'choice_final_no',
                    text: "« Non. »",
                    consequences: { mentalDelta: 5, exhaustionDelta: -10 }
                },
                {
                    id: 'choice_try_wakeup',
                    text: "Essayer de se réveiller.",
                    consequences: { exhaustionDelta: 5, mentalDelta: -5 }
                }
            ],
            onComplete: (selectedChoiceId?: string) => {
                if (!selectedChoiceId) return;

                const currentChoices = [
                    { id: 'choice_final_yes', consequences: { consciousnessDelta: 20, mentalDelta: -10, exhaustionDelta: -15 } },
                    { id: 'choice_final_no', consequences: { mentalDelta: 5, exhaustionDelta: -10 } },
                    { id: 'choice_try_wakeup', consequences: { exhaustionDelta: 5, mentalDelta: -5 } }
                ];

                const chosen = currentChoices.find(c => c.id === selectedChoiceId);
                if (chosen) {
                    store.recordChoice(selectedChoiceId, 'DreamScene', chosen.consequences);
                }

                if (selectedChoiceId === 'choice_try_wakeup') {
                    store.setDialog({
                        textKey: 'dream.scene_1.step_4_fail_wakeup',
                        choices: [],
                        onComplete: () => {
                            this.startStep4();
                        }
                    });
                } else {
                    let reactionKey = '';
                    if (selectedChoiceId === 'choice_final_yes') {
                        reactionKey = 'dream.scene_1.step_4_reactions.choice_final_yes';
                    } else if (selectedChoiceId === 'choice_final_no') {
                        reactionKey = 'dream.scene_1.step_4_reactions.choice_final_no';
                    }

                    if (reactionKey) {
                        store.setDialog({
                            textKey: reactionKey,
                            choices: [],
                            onComplete: () => {
                                const isFanatic = store.consciousness >= 25;
                                if (selectedChoiceId === 'choice_final_yes' && isFanatic) {
                                    this.triggerSubliminalTrueFormFlash();
                                } else {
                                    this.startOutroIrony();
                                }
                            }
                        });
                    } else {
                        this.startOutroIrony();
                    }
                }
            }
        });
    }

    private startOutroIrony() {
        const store = useGameStore.getState();

        store.setDialog({
            textKey: 'dream.scene_1.outro_irony',
            onComplete: () => {
                this.triggerClimaxAndWakeUp();
            }
        });
    }

    private triggerClimaxAndWakeUp() {
        const store = useGameStore.getState();

        store.modifyStat('exhaustion', -20);

        if (this.audioElement) {
            const fadeAudio = setInterval(() => {
                if (this.audioElement && this.audioElement.volume > 0.02) {
                    this.audioElement.volume -= 0.02;
                } else {
                    if (this.audioElement) {
                        this.audioElement.pause();
                        this.audioElement.currentTime = 0;
                    }
                    clearInterval(fadeAudio);
                }
            }, 100);
        }

        if (this.audioCtx && this.audioCtx.state !== 'closed') {
            this.audioCtx.close();
        }

        this.cameras.main.shake(300, 0.025);

        this.tweens.add({
            targets: this.bgImage,
            alpha: 0,
            duration: 2500,
            ease: 'Sine.easeInOut',
            onComplete: () => {
                store.setEyelidsClosing(true);

                this.time.delayedCall(2000, () => {
                    store.setEyelidsClosing(false);
                    store.setScene('DeskMorningScene');
                    this.scene.start('DeskMorningScene');
                });
            }
        });
    }

    private triggerSubliminalTrueFormFlash() {
        const trueFormImage = this.add.image(640, 360, 'nyarlaTrueForm')
            .setDisplaySize(1280, 720)
            .setAlpha(0)
            .setDepth(998);

        this.cameras.main.shake(700, 0.05);

        this.tweens.add({
            targets: trueFormImage,
            alpha: { start: 0, to: 1 },
            duration: 40,
            yoyo: true,
            repeat: 3,
            hold: 80,
            onComplete: () => {
                trueFormImage.destroy();
            }
        });

        this.tweens.add({
            targets: this.flashOverlay,
            alpha: { start: 0, to: 0.9 },
            duration: 50,
            yoyo: true,
            repeat: 3,
            hold: 60,
            onComplete: () => {
                this.startOutroIrony();
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