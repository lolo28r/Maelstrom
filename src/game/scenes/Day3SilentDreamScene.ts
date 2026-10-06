import Phaser from 'phaser';
import { getMusicVolume } from '../../audio/audioMix';
import i18n from '../../i18n';
import { useGameStore, type ChoiceOption } from '../../store/useGameStore';

export class Day3SilentDreamScene extends Phaser.Scene {
    private nyarlathotepMusic?: Phaser.Sound.BaseSound;

    constructor() {
        super({ key: 'Day3SilentDreamScene' });
    }

    preload() {
        if (!this.cache.audio.exists('dream4NyarlaMusic')) {
            this.load.audio('dream4NyarlaMusic', `${import.meta.env.BASE_URL}assets/OSTnyarla.mp3`);
        }
    }

    create() {
        const store = useGameStore.getState();
        store.setScene('Day3SilentDreamScene');
        this.cameras.main.setBackgroundColor('#000000');
        this.add.rectangle(640, 360, 1280, 720, 0x000000);

        this.nyarlathotepMusic = this.sound.add('dream4NyarlaMusic', {
            loop: true,
            volume: getMusicVolume() * 0.55,
        });
        this.nyarlathotepMusic.play();
        this.time.delayedCall(1150, () => this.nyarlathotepMusic?.stop());

        const title = this.add.text(640, 360, i18n.t('story.dream4.title'), {
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: '36px',
            color: '#cfc5b1',
            letterSpacing: 4,
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: title,
            alpha: 1,
            duration: 800,
            yoyo: true,
            hold: 850,
            onComplete: () => {
                title.destroy();
                this.time.delayedCall(1200, () => this.startWaiting());
            },
        });

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.nyarlathotepMusic?.stop();
            this.nyarlathotepMusic?.destroy();
        });
    }

    private startWaiting() {
        useGameStore.getState().setDialog({
            textKey: 'story.dream4.waiting',
            speaker: i18n.t('characters.laurence'),
            type: 'bottom',
            onComplete: () => this.callNyarlathotep(),
        });
    }

    private callNyarlathotep() {
        const store = useGameStore.getState();
        const callKey = store.hasMadeChoice('day2_dream_seek_everything')
            ? 'knowledge'
            : store.hasMadeChoice('day2_dream_find_father')
                ? 'father'
                : store.hasMadeChoice('day2_dream_make_it_stop')
                    ? 'rest'
                    : 'resistance';

        store.setDialog({
            textKey: `story.dream4.firstCall.${callKey}`,
            speaker: i18n.t('characters.laurence'),
            type: 'bottom',
            onComplete: () => this.time.delayedCall(3000, () => this.offerReaction()),
        });
    }

    private offerReaction() {
        const choices: ChoiceOption[] = [
            {
                id: 'dream4_call_again',
                text: i18n.t('story.dream4.choices.callAgain'),
                consequences: { attitudeTag: 'knowledge', customPayload: 'nyarlathotep_dependency' },
            },
            {
                id: 'dream4_pray',
                text: i18n.t('story.dream4.choices.pray'),
                consequences: { attitudeTag: 'faith', customPayload: 'prayer_in_silence' },
            },
            {
                id: 'dream4_wake',
                text: i18n.t('story.dream4.choices.wake'),
                consequences: { attitudeTags: ['rest', 'resistance'], customPayload: 'refuse_dependency' },
            },
        ];

        useGameStore.getState().setDialog({
            textKey: 'story.dream4.silence',
            speaker: i18n.t('characters.laurence'),
            type: 'bottom',
            choices,
            onComplete: (choiceId) => this.resolveReaction(choiceId),
        });
    }

    private resolveReaction(choiceId?: string) {
        const responseKey = choiceId === 'dream4_pray'
            ? 'pray'
            : choiceId === 'dream4_wake'
                ? 'wake'
                : 'callAgain';

        useGameStore.getState().setDialog({
            textKey: `story.dream4.reactions.${responseKey}`,
            speaker: i18n.t('characters.laurence'),
            type: 'bottom',
            onComplete: () => this.time.delayedCall(1700, () => this.answerFromDarkness()),
        });
    }

    private answerFromDarkness() {
        useGameStore.getState().setDialog({
            textKey: 'story.dream4.answer',
            speaker: i18n.t('story.dream2.manInBlack'),
            type: 'bottom',
            onComplete: () => this.wakeUp(),
        });
    }

    private wakeUp() {
        const store = useGameStore.getState();
        store.saveGame();
        store.setEyelidsClosing(true);
        this.time.delayedCall(1500, () => {
            store.setEyelidsClosing(false);
            const endTitle = this.add.text(640, 360, i18n.t('story.dream4.endCard'), {
                fontFamily: '"Cormorant Garamond", serif',
                fontSize: '36px',
                color: '#cfc5b1',
                letterSpacing: 4,
            }).setOrigin(0.5).setAlpha(0).setDepth(10);
            this.tweens.add({ targets: endTitle, alpha: 1, duration: 1200 });
        });
    }
}
