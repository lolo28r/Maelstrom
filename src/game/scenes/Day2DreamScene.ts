import Phaser from 'phaser';
import { getMusicVolume } from '../../audio/audioMix';
import { useGameStore } from '../../store/useGameStore';
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

        const opening = tendency === 'azathoth'
            ? i18n.t('story.dream2.opening.azathoth')
            : tendency === 'cthulhu'
                ? i18n.t('story.dream2.opening.cthulhu')
                : i18n.t('story.dream2.opening.uncertain');
        store.setDialog({ textKey: opening, type: 'bottom', onComplete: () => this.showNyarlathotep() });
    }

    private showNyarlathotep() {
        const store = useGameStore.getState();
        const curiosity = store.day2Progress.optionalDiscoveries.length;
        const greeting = curiosity >= 8
            ? i18n.t('story.dream2.greetingCurious')
            : i18n.t('story.dream2.greeting');
        this.tweens.add({
            targets: this.background, alpha: 0, duration: 900,
            onComplete: () => {
                this.background?.destroy();
                this.background = this.add.image(640, 360, 'day2DreamNyarla').setDisplaySize(1280, 720).setAlpha(0);
                this.tweens.add({ targets: this.background, alpha: 1, duration: 900 });
                store.setDialog({
                    textKey: greeting,
                    speaker: i18n.t('characters.unknownEntity'), type: 'bottom',
                    onComplete: () => store.setDialog({
                        textKey: 'story.dream2.judgment', speaker: i18n.t('characters.unknownEntity'), type: 'bottom',
                        choices: [
                            { id: 'day2_dream_seek_everything', text: i18n.t('story.dream2.choices.know'), consequences: { attitudeTags: ['faith', 'knowledge'] } },
                            { id: 'day2_dream_make_it_stop', text: i18n.t('story.dream2.choices.stop'), consequences: { attitudeTags: ['skepticism', 'rest'] } },
                            { id: 'day2_dream_keep_open', text: i18n.t('story.dream2.choices.wait'), consequences: { attitudeTag: 'resistance' } },
                        ],
                        onComplete: (choiceId) => {
                        store.setDialog({
                            textKey: choiceId === 'day2_dream_seek_everything'
                                ? 'story.dream2.answers.know'
                                : choiceId === 'day2_dream_make_it_stop'
                                    ? 'story.dream2.answers.stop'
                                    : 'story.dream2.answers.wait',
                            speaker: i18n.t('characters.unknownEntity'), type: 'bottom', onComplete: () => this.finishDay(),
                        });
                    }}),
                });
            },
        });
    }

    private finishDay() {
        const store = useGameStore.getState();
        store.updateDay2Progress({ day2Completed: true });
        store.saveGame();
        this.sound.stopAll();
        this.cameras.main.fadeOut(1800, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            store.setScene('ChapterEndScene');
            this.scene.start('ChapterEndScene');
        });
    }
}
