import Phaser from 'phaser';
import { useGameStore } from '../../store/useGameStore';
import i18n from '../../i18n';

export class DreamScene extends Phaser.Scene {
    private bgImage!: Phaser.GameObjects.Image;
    private audioElement?: HTMLAudioElement;
    private audioCtx?: AudioContext;

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
            this.audioElement.volume = 0.35;
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
        const openingKey = store.hasMadeChoice('office_drink_whisky')
            ? 'new_content.dream.openingDrink'
            : store.hasMadeChoice('office_smoke_to_assess')
                ? 'new_content.dream.openingSmoke'
                : 'new_content.dream.openingVerify';
        store.setDialog({
            textKey: openingKey,
            speaker: i18n.t('characters.unknownEntity'),
            choices: [
                { id: 'dream1_seek_truth', text: i18n.t('new_content.dream.seekTruth'), consequences: { attitudeTag: 'knowledge' } },
                { id: 'dream1_resist_intrusion', text: i18n.t('new_content.dream.resist'), consequences: { attitudeTags: ['resistance', 'skepticism'] } },
                { id: 'dream1_seek_rest', text: i18n.t('new_content.dream.seekRest'), consequences: { attitudeTag: 'rest' } },
            ],
            onComplete: (choiceId) => {
                if (!choiceId) return;
                store.setDialog({
                    textKey: choiceId === 'dream1_seek_truth'
                        ? 'new_content.dream.reactionTruth'
                        : choiceId === 'dream1_seek_rest'
                            ? 'new_content.dream.reactionRest'
                            : 'new_content.dream.reactionResist',
                    speaker: i18n.t('characters.unknownEntity'),
                    onComplete: () => this.askFirstMeetingQuestion(),
                });
            },
        });
    }

    private askFirstMeetingQuestion() {
        const store = useGameStore.getState();
        store.setDialog({
            textKey: 'new_content.dream.firstMeetingPrompt',
            speaker: i18n.t('characters.unknownEntity'),
            choices: [
                { id: 'dream1_ask_true_face', text: i18n.t('new_content.dream.askTrueFace'), consequences: { attitudeTag: 'knowledge' } },
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
