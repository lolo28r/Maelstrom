import Phaser from 'phaser';
import { getMusicVolume, getSfxVolume } from '../../audio/audioMix';
import i18n from '../../i18n';
import { useGameStore } from '../../store/useGameStore';
import { HotspotZone } from '../helper/HotSpotZone';
import { createSceneNavigationButton, isSceneInteractionBlocked } from '../helper/SceneNavigationButton';

type Day3Location =
    | 'office'
    | 'ticketOffice'
    | 'train'
    | 'forestEntrance'
    | 'forestCrossroads'
    | 'devotionalPath'
    | 'loggerCrossroads'
    | 'loggingCamp'
    | 'cabinInterior'
    | 'marshShore'
    | 'marshCrossing'
    | 'strangeSun'
    | 'campEntrance'
    | 'campHub'
    | 'archives'
    | 'sectChapel'
    | 'ritualPit'
    | 'darkMotherRoom';

const OUTDOOR_LOCATIONS = new Set<Day3Location>([
    'forestEntrance', 'forestCrossroads', 'devotionalPath', 'loggerCrossroads', 'loggingCamp',
    'marshShore', 'marshCrossing', 'strangeSun', 'campEntrance', 'campHub', 'ritualPit',
]);
const FOOTSTEP_LOCATIONS = new Set<Day3Location>([
    'forestEntrance', 'forestCrossroads', 'devotionalPath', 'loggerCrossroads', 'loggingCamp',
    'campEntrance', 'campHub', 'ritualPit',
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
    campEntrance: [
        { x: 145, y: 385, width: 290, height: 500, id: 'watchShelter' },
        { x: 1110, y: 500, width: 190, height: 230, id: 'coldBrazier' },
    ],
    campHub: [
        { x: 650, y: 515, width: 260, height: 150, id: 'campFireRing' },
        { x: 500, y: 390, width: 170, height: 180, id: 'supplyCrates' },
    ],
    archives: [
        { x: 650, y: 365, width: 350, height: 330, id: 'testimonyLedger', document: true },
        { x: 1090, y: 385, width: 350, height: 610, id: 'archiveShelves', document: true },
        { x: 230, y: 330, width: 370, height: 520, id: 'hiddenCoat' },
    ],
    sectChapel: [
        { x: 640, y: 255, width: 330, height: 380, id: 'sectVirgin' },
        { x: 260, y: 565, width: 190, height: 120, id: 'sectPrayer', document: true },
        { x: 640, y: 470, width: 380, height: 120, id: 'soilBowls' },
    ],
    ritualPit: [
        { x: 640, y: 440, width: 480, height: 250, id: 'coveredStone' },
        { x: 275, y: 465, width: 190, height: 260, id: 'ritualRopes' },
        { x: 710, y: 250, width: 590, height: 170, id: 'emptyTrench' },
        { x: 815, y: 350, width: 100, height: 250, id: 'shovel' },
    ],
    darkMotherRoom: [
        { x: 940, y: 300, width: 330, height: 470, id: 'darkMotherStatue' },
        { x: 1000, y: 555, width: 500, height: 230, id: 'darkMotherLimbs' },
        { x: 1170, y: 230, width: 250, height: 260, id: 'darkMotherDevotions' },
        { x: 540, y: 545, width: 300, height: 230, id: 'darkMotherAltar' },
        { x: 790, y: 660, width: 520, height: 100, id: 'darkMotherSoil' },
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
    marshShore: 'day3MarshShore',
    marshCrossing: 'day3MarshCrossing',
    strangeSun: 'day3StrangeSun',
    campEntrance: 'day3CampEntrance',
    campHub: 'day3CampHub',
    archives: 'day3Archives',
    sectChapel: 'day3SectChapel',
    ritualPit: 'day3RitualPit',
    darkMotherRoom: 'day3DarkMotherRoom',
};

const DARK_MOTHER_OBSERVATIONS = new Set([
    'darkMotherStatue',
    'darkMotherLimbs',
    'darkMotherDevotions',
    'darkMotherAltar',
    'darkMotherSoil',
]);

const normalizePrayer = (value: string) => value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr')
    .replace(/[’']/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

const editDistance = (left: string, right: string) => {
    const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
    const current = new Array<number>(right.length + 1);
    for (let i = 1; i <= left.length; i += 1) {
        current[0] = i;
        for (let j = 1; j <= right.length; j += 1) {
            current[j] = Math.min(
                current[j - 1] + 1,
                previous[j] + 1,
                previous[j - 1] + (left[i - 1] === right[j - 1] ? 0 : 1),
            );
        }
        for (let j = 0; j <= right.length; j += 1) previous[j] = current[j];
    }
    return previous[right.length];
};

const isAcceptedPrayer = (value: string, expectedPrayer: string, requiredWords: string[]) => {
    const normalized = normalizePrayer(value);
    const expected = normalizePrayer(expectedPrayer);
    if (!normalized) return false;
    const normalizedRequiredWords = requiredWords.map(normalizePrayer);
    const presentWords = normalizedRequiredWords.filter((word) => normalized.split(' ').some(
        (candidate) => editDistance(candidate, word) <= (word.length >= 8 ? 2 : 1),
    ));
    const similarity = 1 - editDistance(normalized, expected) / expected.length;
    return presentWords.length >= Math.max(1, normalizedRequiredWords.length - 1) && similarity >= 0.82;
};

const PASSAGES: Partial<Record<Day3Location, Passage[]>> = {
    forestEntrance: [
        { x: 700, y: 420, width: 430, height: 450, labelKey: 'story.day3.actions.followTrack', destination: 'forestCrossroads' },
    ],
    forestCrossroads: [
        { x: 190, y: 430, width: 310, height: 440, labelKey: 'story.day3.actions.devotionalPath', destination: 'devotionalPath' },
        { x: 970, y: 430, width: 430, height: 440, labelKey: 'story.day3.actions.oldTrack', destination: 'loggerCrossroads' },
    ],
    loggerCrossroads: [
        { x: 260, y: 470, width: 390, height: 390, labelKey: 'story.day3.actions.loggingCamp', destination: 'loggingCamp' },
        { x: 960, y: 430, width: 430, height: 430, labelKey: 'story.day3.actions.marshRoad', destination: 'marshCrossing' },
    ],
    loggingCamp: [
        { x: 350, y: 355, width: 180, height: 320, labelKey: 'story.day3.actions.enterCabin', destination: 'cabinInterior' },
    ],
    campEntrance: [
        { x: 650, y: 310, width: 420, height: 470, labelKey: 'story.day3.actions.enterSectCamp', destination: 'campHub' },
    ],
    campHub: [
        { x: 145, y: 320, width: 290, height: 520, labelKey: 'story.day3.actions.enterArchives', destination: 'archives' },
        { x: 760, y: 245, width: 320, height: 350, labelKey: 'story.day3.actions.enterSectChapel', destination: 'sectChapel' },
        { x: 1120, y: 455, width: 300, height: 470, labelKey: 'story.day3.actions.ritualPath', destination: 'ritualPit' },
    ],
};

const BACK_DESTINATIONS: Partial<Record<Day3Location, Day3Location>> = {
    forestCrossroads: 'forestEntrance',
    devotionalPath: 'forestCrossroads',
    loggerCrossroads: 'forestCrossroads',
    loggingCamp: 'loggerCrossroads',
    cabinInterior: 'loggingCamp',
    campEntrance: 'loggerCrossroads',
    campHub: 'campEntrance',
    archives: 'campHub',
    sectChapel: 'campHub',
    ritualPit: 'campHub',
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
    private hiddenCoatExamined = false;
    private prayerInput?: Phaser.GameObjects.DOMElement;
    private examinedDarkMother = new Set<string>();
    private darkMotherShockApplied = false;
    private darkMotherExitAdded = false;

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
        this.load.image('day3MarshShore', `${assets}barque1.jpg`);
        this.load.image('day3MarshCrossing', `${assets}barqueTrip.jpg`);
        this.load.image('day3StrangeSun', `${assets}sunStrange.jpg`);
        this.load.image('day3CampEntrance', `${assets}entreeCamp.jpg`);
        this.load.image('day3CampHub', `${assets}campHub.jpg`);
        this.load.image('day3Archives', `${assets}archives.jpg`);
        this.load.image('day3SectChapel', `${assets}chapelleSecte.jpg`);
        this.load.image('day3RitualPit', `${assets}fosse.jpg`);
        this.load.image('day3DarkMotherRoom', `${assets}darkMother.jpg`);
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
        this.hiddenCoatExamined = false;
        this.examinedDarkMother.clear();
        this.darkMotherShockApplied = false;
        this.darkMotherExitAdded = false;
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
        this.exitButton = createSceneNavigationButton({
            scene: this,
            kind: 'forward',
            label: i18n.t('story.day3.actions.leaveOffice'),
            onClick: () => this.goTo('ticketOffice'),
            isBlocked: () => this.isInteractionBlocked(),
        });
    }

    private renderLocation(location: Day3Location) {
        this.clearNavigation();
        this.location = location;
        this.background?.setTexture(TEXTURES[location]).setDisplaySize(1280, 720);

        if (OUTDOOR_LOCATIONS.has(location)) {
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
                    if (observation.id === 'hiddenCoat') {
                        this.inspectHiddenCoat();
                        return;
                    }
                    if (observation.id === 'soilBowls') {
                        this.inspectSoilBowls();
                        return;
                    }
                    if (DARK_MOTHER_OBSERVATIONS.has(observation.id)) {
                        this.inspectDarkMotherRoom(observation.id);
                        return;
                    }
                    const key = `story.day3.observations.${observation.id}`;
                    const store = useGameStore.getState();
                    if (observation.document) {
                        const documentId = `day3_${observation.id}`;
                        const firstRead = !store.documents.some((doc) => doc.id === documentId);
                        store.openDocument({
                            title: i18n.t(`${key}.title`), content: i18n.t(`${key}.text`),
                            onClose: () => {
                                store.addArchivedDocument(
                                    documentId, i18n.t(`${key}.title`),
                                    i18n.t(`${key}.text`), i18n.t('story.day3.date'),
                                );
                                if (firstRead && observation.id === 'testimonyLedger') {
                                    store.grantFragment('historical_change_1724');
                                    store.modifyStat('consciousness', 5);
                                }
                                if (firstRead && observation.id === 'sectPrayer') {
                                    store.grantFragment('day3_marian_prayer');
                                }
                            },
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

        if (location === 'sectChapel') {
            this.hotspots.push(new HotspotZone({
                scene: this,
                x: 640,
                y: 625,
                width: 330,
                height: 150,
                type: 'inspect',
                actionLabel: i18n.t('story.day3.actions.kneel'),
                onClick: () => this.beginSecretPrayer(),
            }));
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

        const backDestination = BACK_DESTINATIONS[location];
        if (backDestination) {
            this.backButton = createSceneNavigationButton({
                scene: this,
                kind: 'back',
                label: i18n.t('scene_ui.back'),
                onClick: () => this.goTo(backDestination),
                isBlocked: () => this.isInteractionBlocked(),
            });
        }

        if (location === 'darkMotherRoom') this.showDarkMotherExitWhenReady();
    }

    private goTo(destination: Day3Location) {
        if (this.transitioning || destination === this.location || this.isInteractionBlocked()) return;
        this.transitioning = true;
        if (FOOTSTEP_LOCATIONS.has(destination)) {
            this.footstepSound?.stop();
            this.footstepSound?.destroy();
            this.footstepSound = this.sound.add(Phaser.Utils.Array.GetRandom(FOOTSTEP_KEYS), { volume: getSfxVolume() });
            this.footstepSound.play();
        } else {
            this.footstepSound?.stop();
        }
        const cinematicLocations = new Set<Day3Location>([
            'ticketOffice', 'train', 'marshShore', 'marshCrossing', 'strangeSun', 'campEntrance',
        ]);
        const cinematic = cinematicLocations.has(destination) || (destination === 'forestEntrance' && this.location === 'train');
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
        const next: Day3Location | undefined = location === 'ticketOffice'
            ? 'train'
            : location === 'train'
                ? 'forestEntrance'
                : location === 'marshCrossing'
                    ? 'strangeSun'
                    : location === 'strangeSun'
                        ? 'marshShore'
                        : location === 'marshShore'
                            ? 'campEntrance'
                            : undefined;
        if (next) {
            const textKey = location === 'ticketOffice' || location === 'train'
                ? `story.day3.travel.${location}`
                : `story.day3.marshJourney.${location}`;
            useGameStore.getState().setDialog({
                textKey,
                speaker: i18n.t('characters.laurence'), type: 'bottom',
                onComplete: () => this.goTo(next),
            });
            return;
        }
        if (this.visitedLocations.has(location)) return;
        this.visitedLocations.add(location);
        if (
            location === 'forestEntrance'
            || location === 'loggingCamp'
            || location === 'cabinInterior'
            || location === 'campEntrance'
            || location === 'campHub'
            || location === 'archives'
            || location === 'sectChapel'
            || location === 'ritualPit'
            || location === 'darkMotherRoom'
        ) {
            useGameStore.getState().setDialog({
                textKey: `story.day3.arrivals.${location}`,
                speaker: i18n.t('characters.laurence'), type: 'bottom',
            });
        }
    }

    private beginSecretPrayer() {
        if (this.transitioning || this.isInteractionBlocked()) return;
        useGameStore.getState().setDialog({
            textKey: 'story.day3.secretPrayer.kneel',
            speaker: i18n.t('characters.laurence'),
            type: 'bottom',
            onComplete: () => this.showPrayerInput(),
        });
    }

    private showPrayerInput() {
        if (this.prayerInput) return;

        const panel = document.createElement('form');
        panel.className = 'day3-prayer-input';
        panel.setAttribute('aria-label', i18n.t('story.day3.secretPrayer.ariaLabel'));

        const title = document.createElement('label');
        title.textContent = i18n.t('story.day3.secretPrayer.prompt');
        const input = document.createElement('input');
        input.type = 'text';
        input.autocomplete = 'off';
        input.spellcheck = false;
        input.maxLength = 120;
        input.placeholder = i18n.t('story.day3.secretPrayer.placeholder');
        const feedback = document.createElement('p');
        feedback.setAttribute('aria-live', 'polite');
        const actions = document.createElement('div');
        const submit = document.createElement('button');
        submit.type = 'submit';
        submit.textContent = i18n.t('story.day3.secretPrayer.submit');
        const cancel = document.createElement('button');
        cancel.type = 'button';
        cancel.textContent = i18n.t('story.day3.secretPrayer.cancel');

        title.appendChild(input);
        actions.append(submit, cancel);
        panel.append(title, feedback, actions);
        panel.addEventListener('pointerdown', (event) => event.stopPropagation());
        panel.addEventListener('click', (event) => event.stopPropagation());
        panel.addEventListener('submit', (event) => {
            event.preventDefault();
            const expectedPrayer = i18n.t('story.day3.secretPrayer.answer');
            const coreWords = i18n.t('story.day3.secretPrayer.coreWords', { returnObjects: true }) as unknown as string[];
            if (isAcceptedPrayer(input.value, expectedPrayer, coreWords)) {
                this.closePrayerInput();
                this.openSecretRoom();
                return;
            }
            feedback.textContent = i18n.t('story.day3.secretPrayer.wrong');
            input.select();
        });
        cancel.addEventListener('click', () => this.closePrayerInput());

        this.prayerInput = this.add.dom(640, 355, panel).setDepth(2000);
        this.time.delayedCall(0, () => input.focus());
    }

    private closePrayerInput() {
        this.prayerInput?.destroy();
        this.prayerInput = undefined;
    }

    private openSecretRoom() {
        this.transitioning = true;
        this.cameras.main.fadeOut(900, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            useGameStore.getState().setDialog({
                textKey: 'story.day3.secretPrayer.trapdoor',
                speaker: i18n.t('characters.laurence'),
                type: 'bottom',
                onComplete: () => {
                    this.renderLocation('darkMotherRoom');
                    this.cameras.main.fadeIn(1100, 0, 0, 0);
                    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE, () => {
                        this.transitioning = false;
                        this.describeArrival('darkMotherRoom');
                    });
                },
            });
        });
    }

    private inspectDarkMotherRoom(observationId: string) {
        const store = useGameStore.getState();
        const firstInspection = !this.examinedDarkMother.has(observationId);
        this.examinedDarkMother.add(observationId);

        let textKey = `story.day3.observations.${observationId}.text`;
        if (observationId === 'darkMotherStatue' && store.documents.some((doc) => doc.id === 'day3_madNote')) {
            textKey = 'story.day3.observations.darkMotherStatue.withMadNote';
        }
        if (firstInspection && observationId === 'darkMotherStatue' && !this.darkMotherShockApplied) {
            this.darkMotherShockApplied = true;
            store.modifyStat('lucidity', -15);
        }

        store.setDialog({
            textKey,
            speaker: i18n.t('characters.laurence'),
            type: 'bottom',
            onComplete: () => this.showDarkMotherExitWhenReady(),
        });
    }

    private showDarkMotherExitWhenReady() {
        if (this.location !== 'darkMotherRoom' || this.examinedDarkMother.size < DARK_MOTHER_OBSERVATIONS.size || this.darkMotherExitAdded) return;
        const store = useGameStore.getState();
        if (!store.hasFragment('day3_dark_mother_room')) {
            store.grantFragment('day3_dark_mother_room');
            store.modifyStat('consciousness', 10);
        }
        this.darkMotherExitAdded = true;
        this.hotspots.push(new HotspotZone({
            scene: this,
            x: 120,
            y: 350,
            width: 240,
            height: 620,
            type: 'path',
            actionLabel: i18n.t('story.day3.actions.leaveDarkMotherRoom'),
            onClick: () => this.leaveDarkMotherRoom(),
        }));
    }

    private leaveDarkMotherRoom() {
        if (this.transitioning || this.isInteractionBlocked()) return;
        useGameStore.getState().setDialog({
            textKey: 'story.day3.ending.voices',
            speaker: i18n.t('characters.laurence'),
            type: 'bottom',
            onComplete: () => this.escapeToTrain(),
        });
    }

    private escapeToTrain() {
        this.transitioning = true;
        this.cameras.main.fadeOut(1200, 0, 0, 0);
        this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
            this.clearNavigation();
            this.location = 'train';
            this.forestMusic?.stop();
            this.forestAmbience?.stop();
            this.background?.setTexture(TEXTURES.train).setDisplaySize(1280, 720);
            this.trainSound?.stop();
            this.trainSound?.destroy();
            this.trainSound = this.sound.add('day3TrainSfx', { loop: true, volume: getSfxVolume() * 0.5 });
            this.trainSound.play();
            this.cameras.main.fadeIn(1200, 0, 0, 0);
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_IN_COMPLETE, () => {
                this.transitioning = false;
                useGameStore.getState().setDialog({
                    textKey: 'story.day3.ending.train',
                    speaker: i18n.t('characters.laurence'),
                    type: 'bottom',
                    onComplete: () => this.showEndCard(),
                });
            });
        });
    }

    private showEndCard() {
        const veil = this.add.rectangle(640, 360, 1280, 720, 0x000000, 1).setAlpha(0).setDepth(3000);
        const title = this.add.text(640, 360, i18n.t('story.day3.ending.endCard'), {
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: '42px',
            color: '#d8cfbd',
            letterSpacing: 5,
        }).setOrigin(0.5).setAlpha(0).setDepth(3001);
        this.tweens.add({
            targets: veil,
            alpha: 0.94,
            duration: 1400,
            onComplete: () => this.tweens.add({
                targets: title,
                alpha: 1,
                duration: 900,
                onComplete: () => this.time.delayedCall(2400, () => {
                    this.scene.start('Day3SilentDreamScene');
                }),
            }),
        });
    }

    private inspectHiddenCoat() {
        const store = useGameStore.getState();
        const documentId = 'day3_madNote';
        if (store.documents.some((doc) => doc.id === documentId)) {
            store.setDialog({
                textKey: 'story.day3.observations.hiddenCoat.afterNote',
                speaker: i18n.t('characters.laurence'),
                type: 'bottom',
            });
            return;
        }
        if (!this.hiddenCoatExamined) {
            this.hiddenCoatExamined = true;
            store.setDialog({
                textKey: 'story.day3.observations.hiddenCoat.first',
                speaker: i18n.t('characters.laurence'),
                type: 'bottom',
            });
            return;
        }

        const key = 'story.day3.observations.madNote';
        store.openDocument({
            title: i18n.t(`${key}.title`),
            content: i18n.t(`${key}.text`),
            onClose: () => store.addArchivedDocument(
                documentId,
                i18n.t(`${key}.title`),
                i18n.t(`${key}.text`),
                i18n.t('story.day3.date'),
            ),
        });
    }

    private inspectSoilBowls() {
        const store = useGameStore.getState();
        const hasRosary = store.inventory.some((item) => item.id === 'chapelet');
        const firstReaction = hasRosary && !store.hasFragment('day3_rosary_chapel_reaction');
        store.setDialog({
            textKey: 'story.day3.observations.soilBowls.text',
            speaker: i18n.t('characters.laurence'),
            type: 'bottom',
            onComplete: firstReaction ? () => {
                const current = useGameStore.getState();
                current.grantFragment('day3_rosary_chapel_reaction');
                current.modifyStat('consciousness', 5);
                current.setDialog({
                    textKey: 'story.day3.observations.soilBowls.rosaryReaction',
                    speaker: i18n.t('characters.laurence'),
                    type: 'bottom',
                });
            } : undefined,
        });
    }

    private isInteractionBlocked() {
        return Boolean(this.transitioning || this.prayerInput || isSceneInteractionBlocked());
    }

    private clearNavigation() {
        this.closePrayerInput();
        this.hotspots.forEach((hotspot) => hotspot.destroy());
        this.hotspots = [];
        this.backButton?.destroy();
        this.backButton = undefined;
        this.exitButton?.destroy();
        this.exitButton = undefined;
        this.darkMotherExitAdded = false;
    }
}
