import Phaser from 'phaser';
import { getMusicVolume } from '../../audio/audioMix';
import i18n from '../../i18n';
import { useGameStore } from '../../store/useGameStore';
import { HotspotZone } from '../helper/HotSpotZone';

type Day3Location =
    | 'office'
    | 'ticketOffice'
    | 'train'
    | 'forestEntrance'
    | 'forestCrossroads'
    | 'devotionalPath'
    | 'loggerCrossroads'
    | 'loggingCamp'
    | 'cabinInterior';

interface Passage {
    x: number;
    y: number;
    width: number;
    height: number;
    labelKey: string;
    destination?: Day3Location;
    messageKey?: string;
}

const TEXTURES: Record<Day3Location, string> = {
    office: 'day3Office',
    ticketOffice: 'day3TicketOffice',
    train: 'day3Train',
    forestEntrance: 'day3ForestEntrance',
    forestCrossroads: 'day3ForestCrossroads',
    devotionalPath: 'day3DevotionalPath',
    loggerCrossroads: 'day3LoggerCrossroads',
    loggingCamp: 'day3LoggingCamp',
    cabinInterior: 'day3CabinInterior',
};

const PASSAGES: Partial<Record<Day3Location, Passage[]>> = {
    ticketOffice: [
        { x: 640, y: 595, width: 230, height: 150, labelKey: 'story.day3.actions.takeTicket', destination: 'train' },
    ],
    train: [
        { x: 1000, y: 330, width: 500, height: 520, labelKey: 'story.day3.actions.continueJourney', destination: 'forestEntrance' },
    ],
    forestEntrance: [
        { x: 700, y: 420, width: 430, height: 450, labelKey: 'story.day3.actions.followTrack', destination: 'forestCrossroads' },
    ],
    forestCrossroads: [
        { x: 190, y: 430, width: 310, height: 440, labelKey: 'story.day3.actions.devotionalPath', destination: 'devotionalPath' },
        { x: 970, y: 430, width: 430, height: 440, labelKey: 'story.day3.actions.oldTrack', destination: 'loggerCrossroads' },
        { x: 640, y: 675, width: 520, height: 90, labelKey: 'story.day3.actions.backToEntrance', destination: 'forestEntrance' },
    ],
    devotionalPath: [
        { x: 640, y: 675, width: 700, height: 90, labelKey: 'story.day3.actions.backToCrossroads', destination: 'forestCrossroads' },
    ],
    loggerCrossroads: [
        { x: 260, y: 470, width: 390, height: 390, labelKey: 'story.day3.actions.loggingCamp', destination: 'loggingCamp' },
        { x: 960, y: 430, width: 430, height: 430, labelKey: 'story.day3.actions.marshRoad', messageKey: 'story.day3.marshUnavailable' },
        { x: 640, y: 675, width: 500, height: 90, labelKey: 'story.day3.actions.backToCrossroads', destination: 'forestCrossroads' },
    ],
    loggingCamp: [
        { x: 350, y: 355, width: 180, height: 320, labelKey: 'story.day3.actions.enterCabin', destination: 'cabinInterior' },
        { x: 640, y: 675, width: 520, height: 90, labelKey: 'story.day3.actions.backToLoggerCrossroads', destination: 'loggerCrossroads' },
    ],
};

export class Day3ForestScene extends Phaser.Scene {
    private background?: Phaser.GameObjects.Image;
    private hotspots: HotspotZone[] = [];
    private backButton?: Phaser.GameObjects.Text;
    private exitButton?: Phaser.GameObjects.Text;
    private officeMusic?: Phaser.Sound.BaseSound;
    private location: Day3Location = 'office';
    private transitioning = false;

    constructor() {
        super({ key: 'Day3ForestScene' });
    }

    preload() {
        const assets = `${import.meta.env.BASE_URL}assets/`;
        this.load.image('day3Office', `${assets}DeskDay.jpg`);
        this.load.image('day3TicketOffice', `${assets}guichet.jpg`);
        this.load.image('day3Train', `${assets}trainTrip.jpg`);
        this.load.image('day3ForestEntrance', `${assets}entreeForet.jpg`);
        this.load.image('day3ForestCrossroads', `${assets}premierCarrefour.jpg`);
        this.load.image('day3DevotionalPath', `${assets}sentierDevot.jpg`);
        this.load.image('day3LoggerCrossroads', `${assets}carrefourBucheron.jpg`);
        this.load.image('day3LoggingCamp', `${assets}campBucheron.jpg`);
        this.load.image('day3CabinInterior', `${assets}cabaneInt.jpg`);
        if (!this.cache.audio.exists('day3OfficeMusic')) {
            this.load.audio('day3OfficeMusic', `${assets}ostDeskDay.mp3`);
        }
    }

    create() {
        const store = useGameStore.getState();
        store.setScene('Day3ForestScene');
        store.setCurrentDate(i18n.t('story.day3.date'));

        this.location = 'office';
        this.background = this.add.image(640, 360, TEXTURES.office).setDisplaySize(1280, 720);
        this.officeMusic = this.sound.add('day3OfficeMusic', { loop: true, volume: getMusicVolume() });
        this.officeMusic.play();
        this.cameras.main.fadeIn(900, 0, 0, 0);

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.clearNavigation();
            this.officeMusic?.stop();
            this.officeMusic?.destroy();
        });

        store.setDialog({
            textKey: 'story.day3.intro',
            speaker: i18n.t('characters.laurence'),
            type: 'bottom',
            onComplete: () => this.showExitButton(),
        });
    }

    private showExitButton() {
        if (this.exitButton) return;
        this.exitButton = this.createTextButton(1150, 650, i18n.t('story.day3.actions.leaveOffice'), () => {
            this.goTo('ticketOffice');
        });
    }

    private renderLocation(location: Day3Location) {
        this.clearNavigation();
        this.location = location;
        this.background?.setTexture(TEXTURES[location]).setDisplaySize(1280, 720);

        if (location === 'forestEntrance') {
            this.officeMusic?.stop();
        }

        if (location === 'cabinInterior') {
            this.backButton = this.createTextButton(105, 670, i18n.t('story.day3.actions.leaveCabin'), () => {
                this.goTo('loggingCamp');
            });
            return;
        }

        for (const passage of PASSAGES[location] ?? []) {
            this.hotspots.push(new HotspotZone({
                scene: this,
                x: passage.x,
                y: passage.y,
                width: passage.width,
                height: passage.height,
                type: 'path',
                actionLabel: i18n.t(passage.labelKey),
                onClick: () => {
                    if (passage.destination) {
                        this.goTo(passage.destination);
                    } else if (passage.messageKey) {
                        useGameStore.getState().setDialog({
                            textKey: passage.messageKey,
                            speaker: i18n.t('characters.laurence'),
                            type: 'bottom',
                        });
                    }
                },
            }));
        }
    }

    private goTo(destination: Day3Location) {
        if (this.transitioning || destination === this.location || this.isInteractionBlocked()) return;
        this.transitioning = true;
        this.cameras.main.fadeOut(220, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.renderLocation(destination);
            this.cameras.main.fadeIn(260, 0, 0, 0);
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE, () => {
                this.transitioning = false;
            });
        });
    }

    private createTextButton(x: number, y: number, label: string, onClick: () => void) {
        const button = this.add.text(x, y, label, {
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: '18px',
            color: '#aaaaaa',
            backgroundColor: '#020408cc',
            padding: { x: 14, y: 8 },
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(1001);

        button.on('pointerover', () => button.setColor('#ffffff'));
        button.on('pointerout', () => button.setColor('#aaaaaa'));
        button.on('pointerdown', () => {
            if (!this.isInteractionBlocked()) onClick();
        });
        return button;
    }

    private isInteractionBlocked() {
        const store = useGameStore.getState();
        return Boolean(store.currentDialog || store.activeDocument || store.selectedItem);
    }

    private clearNavigation() {
        this.hotspots.forEach((hotspot) => hotspot.destroy());
        this.hotspots = [];
        this.backButton?.destroy();
        this.backButton = undefined;
        this.exitButton?.destroy();
        this.exitButton = undefined;
    }
}
