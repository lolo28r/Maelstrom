import Phaser from 'phaser';
import { useGameStore } from '../../store/useGameStore';
import i18n from '../../i18n';
import { configureHtmlAudio } from '../../audio/audioMix';
import { localizedDialogue } from '../../utils/localizedDialogue';

export class DreamScene extends Phaser.Scene {
    private bgImage!: Phaser.GameObjects.Image;
    private audioElement?: HTMLAudioElement;
    private audioCtx?: AudioContext;
    private unsubscribeAudioMix?: () => void;

    constructor() {
        super('DreamScene');
    }

    preload() {
        const baseUrl = import.meta.env.BASE_URL;
        this.load.image('nyarlathotep_bg', `${baseUrl}assets/nyarlathotep.jpg`);
    }

    create() {
        const store = useGameStore.getState();
        store.setScene('DreamScene');
        store.grantFragment('dream1_unknown_entity');
        this.startAudio();

        this.cameras.main.setBackgroundColor('#000000');
        this.cameras.main.fadeIn(3500, 0, 0, 0);
        this.bgImage = this.add.image(640, 360, 'nyarlathotep_bg').setDisplaySize(1280, 720).setAlpha(0);
        this.tweens.add({
            targets: this.bgImage,
            alpha: 1,
            duration: 6000,
            ease: 'Sine.easeInOut',
            onComplete: () => this.time.delayedCall(1500, () => this.startEncounter()),
        });
    }

    private startAudio() {
        const baseUrl = import.meta.env.BASE_URL;
        try {
            const browserWindow = window as Window & { webkitAudioContext?: typeof AudioContext };
            const AudioContextClass = window.AudioContext || browserWindow.webkitAudioContext;
            if (!AudioContextClass) return;
            this.audioCtx = new AudioContextClass();
            this.audioElement = new Audio(`${baseUrl}assets/OSTnyarla.mp3`);
            this.audioElement.loop = true;
            this.unsubscribeAudioMix = configureHtmlAudio(this.audioElement, 'music');
            this.audioElement.playbackRate = 0.85;
            const source = this.audioCtx.createMediaElementSource(this.audioElement);
            const filter = this.audioCtx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 1300;
            filter.Q.value = 1;
            const distortion = this.audioCtx.createWaveShaper();
            distortion.curve = makeDistortionCurve(6);
            source.connect(filter);
            filter.connect(distortion);
            distortion.connect(this.audioCtx.destination);
            this.audioElement.play().catch((error) => console.warn('Dream audio blocked:', error));
        } catch (error) {
            console.warn('Unable to initialize dream audio:', error);
        }
    }

    private startEncounter() {
        const store = useGameStore.getState();
        const alcoholLine = store.hasMadeChoice('office_drink_whisky')
            ? i18n.t('story.dream1.alcoholDrank')
            : i18n.t('story.dream1.alcoholResisted');

        this.playDialogueSequence([
            { speaker: i18n.t('characters.unknownEntity'), text: alcoholLine },
            ...localizedDialogue('story.dream1.opening'),
        ], () => {
            store.setDialog({
                textKey: 'story.dream1.measured',
                speaker: i18n.t('characters.laurence'),
                choices: [
                    { id: 'dream1_nameless_curiosity', text: i18n.t('story.dream1.choices.curiosity'), consequences: { attitudeTag: 'knowledge' } },
                    { id: 'dream1_nameless_refusal', text: i18n.t('story.dream1.choices.refusal'), consequences: { attitudeTag: 'resistance' } },
                    { id: 'dream1_nameless_threat', text: i18n.t('story.dream1.choices.threat'), consequences: { attitudeTags: ['skepticism', 'resistance'] } },
                ],
                onComplete: (choiceId) => this.answerNamelessChoice(choiceId),
            });
        });
    }

    private answerNamelessChoice(choiceId?: string) {
        const response = choiceId === 'dream1_nameless_curiosity'
            ? i18n.t('story.dream1.answers.curiosity')
            : choiceId === 'dream1_nameless_threat'
                ? i18n.t('story.dream1.answers.threat')
                : i18n.t('story.dream1.answers.refusal');

        useGameStore.getState().setDialog({
            textKey: response,
            speaker: i18n.t('characters.unknownEntity'),
            onComplete: () => this.askFirstMeetingQuestion(),
        });
    }

    private askFirstMeetingQuestion() {
        const store = useGameStore.getState();
        this.playDialogueSequence(localizedDialogue('story.dream1.temptation'), () => store.setDialog({
            textKey: 'story.dream1.voiceCloser',
            speaker: i18n.t('characters.laurence'),
            choices: [
                { id: 'dream1_ask_true_face', text: i18n.t('story.dream1.choices.face'), consequences: { attitudeTag: 'knowledge' } },
                { id: 'dream1_ask_identity', text: i18n.t('new_content.dream.askIdentity'), consequences: { attitudeTag: 'skepticism' } },
                { id: 'dream1_wake_up', text: i18n.t('new_content.dream.askWakeUp'), consequences: { attitudeTag: 'rest' } },
            ],
            onComplete: (choiceId) => {
                if (!choiceId) return;
                store.setDialog({
                    textKey: choiceId === 'dream1_ask_true_face'
                        ? 'new_content.dream.reactionTrueFace'
                        : choiceId === 'dream1_ask_identity'
                            ? 'new_content.dream.reactionIdentity'
                            : 'new_content.dream.reactionWakeUp',
                    speaker: i18n.t('characters.unknownEntity'),
                    onComplete: () => this.startOutro(),
                });
            },
        }));
    }

    private playDialogueSequence(
        lines: Array<{ speaker: string; text: string }>,
        onComplete: () => void,
        index = 0,
    ) {
        const line = lines[index];
        if (!line) {
            onComplete();
            return;
        }
        useGameStore.getState().setDialog({
            textKey: line.text,
            speaker: line.speaker,
            onComplete: () => this.playDialogueSequence(lines, onComplete, index + 1),
        });
    }

    private startOutro() {
        const store = useGameStore.getState();
        store.setDialog({
            textKey: 'new_content.dream.outro',
            speaker: i18n.t('characters.unknownEntity'),
            onComplete: () => this.wakeUp(),
        });
    }

    private wakeUp() {
        const store = useGameStore.getState();
        if (this.audioElement) {
            this.audioElement.pause();
            this.audioElement.currentTime = 0;
        }
        if (this.audioCtx && this.audioCtx.state !== 'closed') void this.audioCtx.close();
        this.unsubscribeAudioMix?.();
        this.unsubscribeAudioMix = undefined;
        this.tweens.add({
            targets: this.bgImage,
            alpha: 0,
            duration: 2200,
            onComplete: () => {
                store.setEyelidsClosing(true);
                this.time.delayedCall(1500, () => {
                    store.setEyelidsClosing(false);
                    store.setScene('DeskMorningScene');
                    this.scene.start('DeskMorningScene');
                });
            },
        });
    }
}

function makeDistortionCurve(amount = 20): Float32Array<ArrayBuffer> {
    const samples = 44100;
    const curve = new Float32Array(samples);
    const degrees = Math.PI / 180;
    for (let index = 0; index < samples; index += 1) {
        const x = (index * 2) / samples - 1;
        curve[index] = ((3 + amount) * x * 20 * degrees) / (Math.PI + amount * Math.abs(x));
    }
    return curve as Float32Array<ArrayBuffer>;
}
