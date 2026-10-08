import Phaser from 'phaser';
import { getMusicVolume } from '../../audio/audioMix';
import i18n from '../../i18n';
import { useGameStore, type ChoiceOption } from '../../store/useGameStore';
import { localizedDialogue } from '../../utils/localizedDialogue';

interface Day4Tableau {
    texture: string;
    file: string;
    dialogueKey: string;
}

const TABLEAUX: Day4Tableau[] = [
    { texture: 'day4Village', file: 'village.jpg', dialogueKey: 'story.day4Thomas.cinematic.village' },
    { texture: 'day4Mary', file: 'Mary.jpg', dialogueKey: 'story.day4Thomas.cinematic.mary' },
    { texture: 'day4Annunciation', file: 'maryNyarlaEncounter.jpg', dialogueKey: 'story.day4Thomas.cinematic.annunciation' },
    { texture: 'day4ChosenMary', file: 'chosenMary.jpg', dialogueKey: 'story.day4Thomas.cinematic.chosenMary' },
    { texture: 'day4Cradle', file: 'Berceu.jpg', dialogueKey: 'story.day4Thomas.cinematic.cradle' },
    { texture: 'day4HouseShadow', file: 'houseShadow.jpg', dialogueKey: 'story.day4Thomas.cinematic.houseShadow' },
    { texture: 'day4Birth', file: 'naissanceJesus.jpg', dialogueKey: 'story.day4Thomas.cinematic.birth' },
    { texture: 'day4Miracle', file: 'JesusMiracle.jpg', dialogueKey: 'story.day4Thomas.cinematic.miracle' },
    { texture: 'day4Crucifixion', file: 'crucifix.jpg', dialogueKey: 'story.day4Thomas.cinematic.crucifixion' },
    { texture: 'day4Scribe', file: 'scribe.jpg', dialogueKey: 'story.day4Thomas.cinematic.scribe' },
    { texture: 'day4ShubMary', file: 'shub.png', dialogueKey: 'story.day4Thomas.cinematic.shubMary' },
];

export class Day4ThomasScene extends Phaser.Scene {
    private background!: Phaser.GameObjects.Image;
    private churchMusic?: Phaser.Sound.BaseSound;
    private churchMusicVolume = 0;
    private changingTableau = false;

    constructor() {
        super({ key: 'Day4ThomasScene' });
    }

    preload() {
        const baseUrl = import.meta.env.BASE_URL;
        this.load.image('day4Priest', `${baseUrl}assets/priest.jpg`);
        TABLEAUX.forEach(({ texture, file }) => this.load.image(texture, `${baseUrl}assets/${file}`));
        if (!this.cache.audio.exists('ostEglise')) {
            this.load.audio('ostEglise', `${baseUrl}assets/ostEglise.mp3`);
        }
    }

    create() {
        const store = useGameStore.getState();
        store.closeDialog();
        store.setScene('Day4ThomasScene');
        store.setCurrentDate(i18n.t('story.day4Thomas.date'));

        this.cameras.main.setBackgroundColor('#000000');
        this.background = this.add.image(640, 360, 'day4Priest')
            .setDisplaySize(1280, 720);

        this.churchMusicVolume = getMusicVolume('ostEglise') * 0.68;
        this.churchMusic = this.sound.add('ostEglise', {
            loop: true,
            volume: this.churchMusicVolume,
        });
        this.churchMusic.play();

        this.cameras.main.fadeIn(1300, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE, () => {
            this.time.delayedCall(350, () => this.playDialogueSequence(
                localizedDialogue('story.day4Thomas.opening'),
                () => this.beginCinematic(),
            ));
        });

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            useGameStore.getState().closeDialog();
            this.churchMusic?.stop();
            this.churchMusic?.destroy();
        });
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
            type: 'bottom',
            onComplete: () => this.playDialogueSequence(lines, onComplete, index + 1),
        });
    }

    private beginCinematic() {
        this.setChurchMusicVolume(getMusicVolume('ostEglise') * 0.38);
        this.showTableau(0);
    }

    private showTableau(index: number) {
        if (this.changingTableau) return;
        const tableau = TABLEAUX[index];
        if (!tableau) {
            this.returnToThomas();
            return;
        }

        this.changingTableau = true;
        this.cameras.main.fadeOut(750, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.background.setTexture(tableau.texture).setDisplaySize(1280, 720);
            this.cameras.main.fadeIn(950, 0, 0, 0);
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE, () => {
                this.changingTableau = false;
                this.playDialogueSequence(
                    localizedDialogue(tableau.dialogueKey),
                    () => this.showTableau(index + 1),
                );
            });
        });
    }

    private returnToThomas() {
        if (this.changingTableau) return;
        this.changingTableau = true;
        this.cameras.main.fadeOut(900, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.background.setTexture('day4Priest').setDisplaySize(1280, 720);
            this.setChurchMusicVolume(getMusicVolume('ostEglise') * 0.68);
            this.cameras.main.fadeIn(1100, 0, 0, 0);
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE, () => {
                this.changingTableau = false;
                this.playDialogueSequence(
                    localizedDialogue('story.day4Thomas.returnToThomas'),
                    () => this.offerFinalChoice(),
                );
            });
        });
    }

    private offerFinalChoice() {
        const choices: ChoiceOption[] = [
            {
                id: 'day4_thomas_stand_aside',
                text: i18n.t('story.day4Thomas.choices.standAside'),
                consequences: {
                    attitudeTag: 'faith',
                    customPayload: 'thomas_non_interference',
                },
            },
            {
                id: 'day4_thomas_refuse',
                text: i18n.t('story.day4Thomas.choices.refuse'),
                consequences: {
                    attitudeTag: 'resistance',
                    customPayload: 'oppose_thomas',
                },
            },
        ];

        useGameStore.getState().setDialog({
            textKey: 'story.day4Thomas.choicePrompt',
            speaker: i18n.t('characters.fatherThomas'),
            type: 'bottom',
            choices,
            onComplete: (choiceId) => {
                const responseKey = choiceId === 'day4_thomas_stand_aside'
                    ? 'story.day4Thomas.responses.standAside'
                    : 'story.day4Thomas.responses.refuse';
                this.playDialogueSequence(localizedDialogue(responseKey), () => this.showEndCard());
            },
        });
    }

    private showEndCard() {
        const store = useGameStore.getState();
        store.saveGame();

        this.tweens.addCounter({
            from: this.churchMusicVolume,
            to: 0,
            duration: 1300,
            onUpdate: (tween) => this.setChurchMusicVolume(tween.getValue() ?? 0),
        });
        const veil = this.add.rectangle(640, 360, 1280, 720, 0x000000, 0)
            .setDepth(20);
        const title = this.add.text(640, 360, i18n.t('story.day4Thomas.endCard'), {
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: '38px',
            color: '#cfc5b1',
            letterSpacing: 4,
            align: 'center',
        }).setOrigin(0.5).setAlpha(0).setDepth(21);

        this.tweens.add({
            targets: veil,
            fillAlpha: 1,
            duration: 1400,
            onComplete: () => this.tweens.add({ targets: title, alpha: 1, duration: 1100 }),
        });
    }

    private setChurchMusicVolume(volume: number) {
        this.churchMusicVolume = volume;
        const sound = this.churchMusic as Phaser.Sound.BaseSound & {
            setVolume?: (nextVolume: number) => unknown;
        };
        sound?.setVolume?.(volume);
    }
}
