import Phaser from 'phaser';
import { getMusicVolume } from '../../audio/audioMix';
import { useGameStore, type ChoiceOption } from '../../store/useGameStore';
import i18n from '../../i18n';

export class Day2DreamScene extends Phaser.Scene {
    private background?: Phaser.GameObjects.Image;

    constructor() {
        super({ key: 'Day2DreamScene' });
    }

    preload() {
        const base = import.meta.env.BASE_URL;
        this.load.image('day2DreamAzathoth', `${base}assets/introGalaxy.png`);
        this.load.image('day2DreamCthulhu', `${base}assets/sea.jpg`);
        this.load.image('day2DreamNyarla', `${base}assets/nyarla2.jpg`);
        this.load.audio('day2DreamMusic', `${base}assets/OSTnyarla.mp3`);
    }

    create() {
        const store = useGameStore.getState();
        store.setScene('Day2DreamScene');
        this.cameras.main.fadeIn(1400, 0, 0, 0);
        this.sound.play('day2DreamMusic', { loop: true, volume: getMusicVolume() });
        const tendency = store.getNarrativeTendency();
        const imageKey = tendency === 'cthulhu' ? 'day2DreamCthulhu' : tendency === 'azathoth' ? 'day2DreamAzathoth' : 'day2DreamNyarla';
        this.background = this.add.image(640, 360, imageKey).setDisplaySize(1280, 720).setAlpha(0.72);
        store.setDialog({
            textKey: `story.dream2.opening.${tendency === 'undetermined' ? 'uncertain' : tendency}`,
            type: 'bottom', distortible: true, hallucinationKey: 'story.dream2.hallucination',
            onComplete: () => this.showNyarlathotep(),
        });
    }

    private showNyarlathotep() {
        this.tweens.add({
            targets: this.background, alpha: 0, duration: 900,
            onComplete: () => {
                this.background?.destroy();
                this.background = this.add.image(640, 360, 'day2DreamNyarla').setDisplaySize(1280, 720).setAlpha(0);
                this.tweens.add({ targets: this.background, alpha: 1, duration: 900 });
                const store = useGameStore.getState();
                const greeting = store.day2Progress.optionalDiscoveries.length >= 8 ? 'story.dream2.greetingCurious' : 'story.dream2.greeting';
                this.playSequence([
                    { speaker: i18n.t('characters.unknownEntity'), textKey: greeting },
                    { speaker: i18n.t('characters.unknownEntity'), textKey: 'story.dream2.knowsFather' },
                    { speaker: i18n.t('characters.laurence'), textKey: 'story.dream2.laurenceWhere' },
                    { speaker: i18n.t('characters.unknownEntity'), textKey: 'story.dream2.askIntroduce' },
                ], () => this.askIntroductionPermission());
            },
        });
    }

    private askIntroductionPermission() {
        const choices: ChoiceOption[] = [
            { id: 'day2_dream_allow_introduction', text: i18n.t('story.dream2.introductionChoices.listen'), consequences: { attitudeTag: 'knowledge' } },
            { id: 'day2_dream_demand_father_first', text: i18n.t('story.dream2.introductionChoices.father'), consequences: { attitudeTag: 'resistance' } },
            { id: 'day2_dream_refuse_introduction', text: i18n.t('story.dream2.introductionChoices.refuse'), consequences: { attitudeTag: 'resistance' } },
        ];
        useGameStore.getState().setDialog({
            textKey: 'story.dream2.introductionPrompt', speaker: i18n.t('characters.laurence'), type: 'bottom', choices,
            distortible: true, hallucinationKey: 'story.dream2.hallucination',
            onComplete: (choiceId) => this.presentManInBlack(choiceId),
        });
    }

    private presentManInBlack(choiceId?: string) {
        const responseKey = choiceId === 'day2_dream_demand_father_first'
            ? 'story.dream2.introductionAnswers.father'
            : choiceId === 'day2_dream_refuse_introduction'
                ? 'story.dream2.introductionAnswers.refuse'
                : 'story.dream2.introductionAnswers.listen';
        const lines = [
            { speaker: i18n.t('characters.unknownEntity'), textKey: responseKey },
            { speaker: i18n.t('characters.unknownEntity'), textKey: 'story.dream2.thousandNames' },
            { speaker: i18n.t('story.dream2.manInBlack'), textKey: 'story.dream2.name' },
            { speaker: i18n.t('story.dream2.manInBlack'), textKey: 'story.dream2.angelClaim' },
            { speaker: i18n.t('story.dream2.manInBlack'), textKey: 'story.dream2.promiseFather' },
            { speaker: i18n.t('story.dream2.manInBlack'), textKey: 'story.dream2.promiseKnowledge' },
        ];
        const store = useGameStore.getState();
        if (store.hasResolvedConnection('day2_rite_and_growth') || store.hasResolvedConnection('day2_thomas_involved')) {
            lines.push({ speaker: i18n.t('story.dream2.manInBlack'), textKey: 'story.dream2.prayerTemptation' });
        }
        this.playSequence(lines, () => this.askDesire());
    }

    private askDesire() {
        useGameStore.getState().setDialog({
            textKey: 'story.dream2.desirePrompt', speaker: i18n.t('story.dream2.manInBlack'), type: 'bottom',
            distortible: true, hallucinationKey: 'story.dream2.hallucination',
            choices: [
                { id: 'day2_dream_seek_everything', text: i18n.t('story.dream2.choices.know'), consequences: { attitudeTags: ['faith', 'knowledge'], routeSignal: 'azathoth' } },
                { id: 'day2_dream_find_father', text: i18n.t('story.dream2.choices.father'), consequences: { attitudeTag: 'resistance' } },
                { id: 'day2_dream_make_it_stop', text: i18n.t('story.dream2.choices.stop'), consequences: { attitudeTags: ['skepticism', 'rest'], routeSignal: 'cthulhu' } },
            ],
            onComplete: (choiceId) => {
                const answer = choiceId === 'day2_dream_seek_everything'
                    ? 'story.dream2.answers.know'
                    : choiceId === 'day2_dream_make_it_stop'
                        ? 'story.dream2.answers.stop'
                        : 'story.dream2.answers.father';
                useGameStore.getState().setDialog({
                    textKey: answer, speaker: i18n.t('story.dream2.manInBlack'), type: 'bottom',
                    distortible: true, hallucinationKey: 'story.dream2.hallucination', onComplete: () => this.finishDay(),
                });
            },
        });
    }

    private playSequence(lines: Array<{ speaker: string; textKey: string }>, onComplete: () => void, index = 0) {
        const line = lines[index];
        if (!line) { onComplete(); return; }
        useGameStore.getState().setDialog({
            textKey: line.textKey, speaker: line.speaker, type: 'bottom',
            distortible: true, hallucinationKey: 'story.dream2.hallucination',
            onComplete: () => this.playSequence(lines, onComplete, index + 1),
        });
    }

    private finishDay() {
        const store = useGameStore.getState();
        store.updateDay2Progress({ day2Completed: true });
        store.saveGame();
        this.sound.stopAll();
        this.cameras.main.fadeOut(1800, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            store.setScene('Day3ForestScene');
            this.scene.start('Day3ForestScene');
        });
    }
}
