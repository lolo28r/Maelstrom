import Phaser from 'phaser';
import { getMusicVolume, getSfxVolume } from '../../audio/audioMix';
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

const FOREST_EXTERIORS = new Set<Day3Location>([
    'forestEntrance', 'forestCrossroads', 'devotionalPath', 'loggerCrossroads', 'loggingCamp',
]);
const FOOTSTEP_KEYS = [1, 2, 3, 4].map((index) => `day3SnowFootstep${index}`);

interface Passage {
    x: number;
    y: number;
    width: number;
    height: number;
    labelKey: string;
    destination?: Day3Location;
    messageKey?: string;
}

interface Observation {
    x: number;
    y: number;
    width: number;
    height: number;
    id: string;
    document?: boolean;
}

const OBSERVATIONS: Partial<Record<Day3Location, Observation[]>> = {
    forestEntrance: [
        { x: 990, y: 330, width: 210, height: 140, id: 'ribbons' },
        { x: 210, y: 490, width: 170, height: 220, id: 'stone' },
    ],
    forestCrossroads: [
        { x: 710, y: 365, width: 110, height: 180, id: 'forestPrayer', document: true },
        { x: 1120, y: 230, width: 160, height: 160, id: 'ribbons' },
    ],
    devotionalPath: [
        { x: 410, y: 340, width: 240, height: 230, id: 'crosses' },
        { x: 660, y: 380, width: 120, height: 120, id: 'offerings' },
        { x: 680, y: 570, width: 100, height: 65, id: 'skull' },
        { x: 290, y: 510, width: 120, height: 90, id: 'candles' },
    ],
    loggerCrossroads: [
        { x: 630, y: 470, width: 100, height: 90, id: 'crate' },
        { x: 640, y: 310, width: 140, height: 130, id: 'signpost' },
    ],
    loggingCamp: [
        { x: 940, y: 450, width: 460, height: 130, id: 'body' },
        { x: 470, y: 560, width: 270, height: 130, id: 'outsideBlood' },
        { x: 950, y: 330, width: 160, height: 160, id: 'saw' },
        { x: 520, y: 365, width: 100, height: 150, id: 'notices', document: true },
    ],
    cabinInterior: [
        { x: 640, y: 455, width: 160, height: 70, id: 'activityBook', document: true },
        { x: 800, y: 480, width: 150, height: 70, id: 'loosePage' },
        { x: 315, y: 490, width: 260, height: 220, id: 'chest' },
        { x: 235, y: 635, width: 250, height: 90, id: 'insideBlood' },
        { x: 340, y: 270, width: 600, height: 190, id: 'beds' },
        { x: 760, y: 365, width: 75, height: 130, id: 'lamp' },
    ],
};

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
    private forestMusic?: Phaser.Sound.BaseSound;
    private forestAmbience?: Phaser.Sound.BaseSound;
    private trainSound?: Phaser.Sound.BaseSound;
    private footstepSound?: Phaser.Sound.BaseSound;
    private location: Day3Location = 'office';
    private transitioning = false;
    private visitedLocations = new Set<Day3Location>();

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
        this.load.audio('day3TrainSfx', `${assets}trainSfx.mp3`);
        this.load.audio('day3ForestMusic', `${assets}forestOst.mp3`);
        this.load.audio('day3ForestAmbience', `${assets}forestsfx.mp3`);
        FOOTSTEP_KEYS.forEach((key, index) => {
            this.load.audio(key, `${assets}snowFootstep${index + 1}.mp3`);
        });
        if (!this.cache.audio.exists('day3OfficeMusic')) {
            this.load.audio('day3OfficeMusic', `${assets}ostDeskDay.mp3`);
        }
    }

    create() {
        const store = useGameStore.getState();
        store.setScene('Day3ForestScene');
        store.setCurrentDate(i18n.t('story.day3.date'));

        this.location = 'office';
        this.transitioning = false;
        this.visitedLocations.clear();
        this.background = this.add.image(640, 360, TEXTURES.office).setDisplaySize(1280, 720);
        this.officeMusic = this.sound.add('day3OfficeMusic', { loop: true, volume: getMusicVolume() });
        this.officeMusic.play();
        this.cameras.main.fadeIn(900, 0, 0, 0);

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.clearNavigation();
            this.officeMusic?.stop();
            this.officeMusic?.destroy();
            this.forestMusic?.stop();
            this.forestMusic?.destroy();
            this.forestMusic = undefined;
            this.forestAmbience?.stop();
            this.forestAmbience?.destroy();
            this.forestAmbience = undefined;
            this.trainSound?.stop();
            this.trainSound?.destroy();
            this.trainSound = undefined;
            this.footstepSound?.stop();
            this.footstepSound?.destroy();
            this.footstepSound = undefined;
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

        if (FOREST_EXTERIORS.has(location)) {
            if (!this.forestAmbience) {
                this.forestAmbience = this.sound.add('day3ForestAmbience', {
                    loop: true, volume: getSfxVolume() * 0.2,
                });
            }
            if (!this.forestAmbience.isPlaying) this.forestAmbience.play();
        } else {
            this.forestAmbience?.stop();
        }

        if (location === 'train') {
            this.trainSound = this.sound.add('day3TrainSfx', { loop: true, volume: getSfxVolume() * 0.5 });
            this.trainSound.play();
        } else {
            this.trainSound?.stop();
            this.trainSound?.destroy();
            this.trainSound = undefined;
        }

        for (const observation of OBSERVATIONS[location] ?? []) {
            this.hotspots.push(new HotspotZone({
                scene: this, ...observation, type: 'inspect',
                actionLabel: i18n.t(`story.day3.observations.${observation.id}.label`),
                onClick: () => {
                    if (this.transitioning || this.isInteractionBlocked()) return;
                    const key = `story.day3.observations.${observation.id}`;
                    const store = useGameStore.getState();
                    if (observation.document) {
                        store.openDocument({
                            title: i18n.t(`${key}.title`), content: i18n.t(`${key}.text`),
                            onClose: () => store.addArchivedDocument(
                                `day3_${observation.id}`, i18n.t(`${key}.title`),
                                i18n.t(`${key}.text`), i18n.t('story.day3.date'),
                            ),
                        });
                    } else {
                        const textKey = observation.id === 'chest' && !store.documents.some((doc) => doc.id === 'day3_activityBook')
                            ? `${key}.beforeBook` : `${key}.text`;
                        store.setDialog({ textKey, speaker: i18n.t('characters.laurence'), type: 'bottom' });
                    }
                },
            }));
        }

        if (location === 'forestEntrance') {
            this.officeMusic?.stop();
            if (!this.forestMusic) {
                this.forestMusic = this.sound.add('day3ForestMusic', { loop: true, volume: getMusicVolume() });
                this.forestMusic.play();
            }
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
                    if (this.transitioning || this.isInteractionBlocked()) return;
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
        if (FOREST_EXTERIORS.has(destination)) {
            this.footstepSound?.stop();
            this.footstepSound?.destroy();
            this.footstepSound = this.sound.add(Phaser.Utils.Array.GetRandom(FOOTSTEP_KEYS), { volume: getSfxVolume() });
            this.footstepSound.play();
        } else {
            this.footstepSound?.stop();
        }
        const cinematic = destination === 'ticketOffice' || destination === 'train' || (destination === 'forestEntrance' && this.location === 'train');
        this.cameras.main.fadeOut(cinematic ? 800 : 220, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.renderLocation(destination);
            this.cameras.main.fadeIn(cinematic ? 900 : 260, 0, 0, 0);
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE, () => {
                this.transitioning = false;
                this.describeArrival(destination);
            });
        });
    }

    private describeArrival(location: Day3Location) {
        const next = location === 'ticketOffice' ? 'train' : location === 'train' ? 'forestEntrance' : undefined;
        if (next) {
            useGameStore.getState().setDialog({
                textKey: `story.day3.travel.${location}`,
                speaker: i18n.t('characters.laurence'), type: 'bottom',
                onComplete: () => this.goTo(next),
            });
            return;
        }
        if (this.visitedLocations.has(location)) return;
        this.visitedLocations.add(location);
        if (location === 'forestEntrance' || location === 'loggingCamp' || location === 'cabinInterior') {
            useGameStore.getState().setDialog({
                textKey: `story.day3.arrivals.${location}`,
                speaker: i18n.t('characters.laurence'), type: 'bottom',
            });
        }
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
            if (!this.transitioning && !this.isInteractionBlocked()) onClick();
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
