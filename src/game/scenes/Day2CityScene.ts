import Phaser from 'phaser';
import { CityOutdoorAudio } from '../../audio/cityOutdoorAudio';
import { getMusicVolume } from '../../audio/audioMix';
import { useGameStore, type ChoiceOption } from '../../store/useGameStore';
import { HotspotZone } from '../helper/HotSpotZone';
import i18n from '../../i18n';
import { localizedDialogue } from '../../utils/localizedDialogue';

type Day2Location = 'CARREFOUR' | 'TABAC' | 'TABAC_INT' | 'CHURCH_EXT' | 'CHURCH_INT' | 'CHAPEL' | 'THOMAS' | 'ORGANIC_STREET' | 'CEMETERY' | 'LOCK' | 'CRYPT';

export class Day2CityScene extends Phaser.Scene {
    private background?: Phaser.GameObjects.Image;
    private hotspots: HotspotZone[] = [];
    private uiObjects: Phaser.GameObjects.GameObject[] = [];
    private backButton?: Phaser.GameObjects.Text;
    private usbSprite?: Phaser.GameObjects.Image;
    private location: Day2Location = 'CARREFOUR';
    private unsubscribeBoard?: () => void;
    private streetMusic?: Phaser.Sound.BaseSound;
    private storeMusic?: Phaser.Sound.BaseSound;
    private churchMusic?: Phaser.Sound.BaseSound;
    private graveyardMusic?: Phaser.Sound.BaseSound;

    private outdoorAudio?: CityOutdoorAudio;

    constructor() {
        super({ key: 'Day2CityScene' });
    }

    preload() {
        CityOutdoorAudio.preload(this);
        const base = import.meta.env.BASE_URL;
        this.load.image('day2Carrefour', `${base}assets/carrefour.jpg`);
        this.load.image('day2Tabac', `${base}assets/tabac1.jpg`);
        this.load.image('day2StoreInterior', `${base}assets/interieurStore.jpg`);
        this.load.image('day2ChurchExt', `${base}assets/egliseExt.jpg`);
        this.load.image('day2Church', `${base}assets/eglise.jpg`);
        this.load.image('day2Chapel', `${base}assets/chapelleVierge.jpg`);
        this.load.image('day2Thomas', `${base}assets/priest.jpg`);
        this.load.image('day2CursedMary', `${base}assets/cursedMary.jpg`);
        this.load.image('day2OrganicStreet', `${base}assets/rueEtrange.jpg`);
        this.load.image('day2Cemetery', `${base}assets/entréeCimetiere.jpg`);
        this.load.image('day2Lock', `${base}assets/grilleCadenas.jpg`);
        this.load.image('day2Crypt', `${base}assets/crypt.jpg`);
        this.load.image('day2FutureObject', `${base}assets/clé.png`);
        this.load.image('day2YithLibrary', `${base}assets/bibliYith.jpg`);
        this.load.audio('day2StreetMusic', `${base}assets/streetOst.mp3`);
        this.load.audio('day2StoreMusic', `${base}assets/ostStore.mp3`);
        this.load.audio('day2ChurchMusic', `${base}assets/ostEglise.mp3`);
        this.load.audio('day2GraveyardMusic', `${base}assets/graveYardOst.mp3`);
    }

    create() {
        this.outdoorAudio = new CityOutdoorAudio(this);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.outdoorAudio?.destroy();
            this.outdoorAudio = undefined;
        });
        const store = useGameStore.getState();
        store.setScene('Day2CityScene');
        store.setCurrentDate(i18n.t('story.office2.date'));
        this.cameras.main.fadeIn(700, 0, 0, 0);
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.clearInteractive();
            this.unsubscribeBoard?.();
            for (const music of [this.streetMusic, this.storeMusic, this.churchMusic, this.graveyardMusic]) {
                music?.stop();
                music?.destroy();
            }
            this.streetMusic = undefined;
            this.storeMusic = undefined;
            this.churchMusic = undefined;
            this.graveyardMusic = undefined;
        });
        this.enterCarrefour();
    }

    private showBackground(key: string) {
        this.outdoorAudio?.enter(this.location, ['CARREFOUR', 'TABAC', 'CHURCH_EXT', 'ORGANIC_STREET', 'CEMETERY', 'LOCK'].includes(this.location));
        this.clearInteractive();
        this.background?.destroy();
        this.background = this.add.image(640, 360, key).setDisplaySize(1280, 720);
    }

    private clearInteractive() {
        this.hotspots.forEach((hotspot) => hotspot.destroy());
        this.hotspots = [];
        this.uiObjects.forEach((object) => object.destroy());
        this.uiObjects = [];
        this.usbSprite?.destroy();
        this.usbSprite = undefined;
        this.backButton?.destroy();
        this.backButton = undefined;
    }

    private addHotspot(config: ConstructorParameters<typeof HotspotZone>[0]) {
        const hotspot = new HotspotZone(config);
        this.hotspots.push(hotspot);
        return hotspot;
    }

    private addBack(callback: () => void, label = i18n.t('scene_ui.back')) {
        this.backButton = this.add.text(80, 50, label, {
            fontFamily: 'monospace', fontSize: '16px', color: '#f4ebd0', backgroundColor: '#000000cc', padding: { x: 10, y: 6 },
        }).setInteractive({ useHandCursor: true }).setDepth(1001);
        this.backButton.on('pointerdown', () => {
            const store = useGameStore.getState();
            if (!store.currentDialog && !store.activeDocument) callback();
        });
    }

    private playOutdoorMusic() {
        this.graveyardMusic?.stop();
        this.graveyardMusic?.destroy();
        this.graveyardMusic = undefined;
        this.storeMusic?.stop();
        this.storeMusic?.destroy();
        this.storeMusic = undefined;
        this.churchMusic?.stop();
        this.churchMusic?.destroy();
        this.churchMusic = undefined;

        if (!this.streetMusic) {
            this.streetMusic = this.sound.add('day2StreetMusic', { loop: true, volume: getMusicVolume() });
            this.streetMusic.play();
        } else if (this.streetMusic.isPaused) {
            (this.streetMusic as Phaser.Sound.BaseSound & { setVolume?: (volume: number) => unknown }).setVolume?.(getMusicVolume());
            this.streetMusic.resume();
        } else if (!this.streetMusic.isPlaying) {
            this.streetMusic.play();
        }
    }

    private playInteriorMusic(zone: 'store' | 'church') {
        if (this.streetMusic?.isPlaying) this.streetMusic.pause();
        const active = zone === 'store' ? this.storeMusic : this.churchMusic;
        const other = zone === 'store' ? this.churchMusic : this.storeMusic;
        other?.stop();
        other?.destroy();
        if (zone === 'store') this.churchMusic = undefined;
        else this.storeMusic = undefined;

        if (!active) {
            const music = this.sound.add(zone === 'store' ? 'day2StoreMusic' : 'day2ChurchMusic', {
                loop: true,
                volume: getMusicVolume(),
            });
            music.play();
            if (zone === 'store') this.storeMusic = music;
            else this.churchMusic = music;
        } else if (active.isPaused) {
            (active as Phaser.Sound.BaseSound & { setVolume?: (volume: number) => unknown }).setVolume?.(getMusicVolume());
            active.resume();
        }
    }

    private pauseAllMusic() {
        if (this.streetMusic?.isPlaying) this.streetMusic.pause();
        if (this.storeMusic?.isPlaying) this.storeMusic.pause();
        if (this.churchMusic?.isPlaying) this.churchMusic.pause();
    }

    private playGraveyardMusic() {
        this.pauseAllMusic();
        if (!this.graveyardMusic) {
            this.graveyardMusic = this.sound.add('day2GraveyardMusic', { loop: true, volume: getMusicVolume() });
            this.graveyardMusic.play();
        } else if (this.graveyardMusic.isPaused) {
            (this.graveyardMusic as Phaser.Sound.BaseSound & { setVolume?: (volume: number) => unknown }).setVolume?.(getMusicVolume());
            this.graveyardMusic.resume();
        }
    }

    private enterCarrefour() {
        this.location = 'CARREFOUR';
        this.playOutdoorMusic();
        this.showBackground('day2Carrefour');
        const store = useGameStore.getState();

        this.addHotspot({ scene: this, x: 640, y: 385, width: 180, height: 250, type: 'path', actionLabel: i18n.t('story.city2.actions.asylum'), onClick: () => {
            store.setScene('AsylumScene');
            this.scene.start('AsylumScene');
        } });
        this.addHotspot({ scene: this, x: 1040, y: 370, width: 260, height: 420, type: 'path', actionLabel: i18n.t('story.city2.actions.district'), onClick: () => this.enterTobacco() });
        this.addHotspot({ scene: this, x: 150, y: 390, width: 240, height: 410, type: 'path', actionLabel: i18n.t('story.city2.actions.library'), onClick: () => {
            store.startDialogue({ text: i18n.t('story.city2.libraryDelay') });
        } });

        this.addHotspot({ scene: this, x: 640, y: 675, width: 300, height: 80, type: 'inspect', actionLabel: i18n.t('story.city2.actions.notes'), onClick: () => this.openDay2Board() });
    }

    private enterTobacco() {
        this.location = 'TABAC';
        this.playOutdoorMusic();
        this.showBackground('day2Tabac');
        this.addHotspot({ scene: this, x: 320, y: 430, width: 340, height: 450, type: 'path', actionLabel: i18n.t('story.city2.actions.store'), onClick: () => this.enterGeneralStore() });
        this.addHotspot({ scene: this, x: 1040, y: 340, width: 230, height: 360, type: 'path', actionLabel: i18n.t('story.city2.actions.churchWay'), onClick: () => this.enterChurchExterior() });
        this.addBack(() => this.enterCarrefour());
    }

    private enterGeneralStore() {
        this.location = 'TABAC_INT';
        this.playInteriorMusic('store');
        this.showBackground('day2StoreInterior');
        this.addHotspot({ scene: this, x: 701, y: 306, width: 670, height: 450, type: 'inspect', actionLabel: i18n.t('story.city2.actions.shopkeeper'), onClick: () => this.talkToShopkeeper() });
        this.addHotspot({ scene: this, x: 1186, y: 485, width: 80, height: 280, type: 'inspect', actionLabel: i18n.t('story.city2.actions.stove'), onClick: () => {
            this.markOptional('store_damp_stove');
            useGameStore.getState().startDialogue({ text: i18n.t('story.city2.stove') });
        } });
        this.addHotspot({ scene: this, x: 351, y: 670, width: 700, height: 110, type: 'inspect', actionLabel: i18n.t('story.city2.actions.shelves'), onClick: () => {
            this.markOptional('store_split_jars');
            useGameStore.getState().startDialogue({ text: i18n.t('story.city2.shelves') });
        } });
        this.addBack(() => this.enterTobacco(), i18n.t('scene_ui.exit'));
    }

    private talkToShopkeeper() {
        const store = useGameStore.getState();
        if (!store.day2Progress.shopkeeperRumorHeard) {
            store.updateDay2Progress({ shopkeeperRumorHeard: true });
            this.playDialogueSequence(localizedDialogue('story.city2.shopkeeperOpening'), () => this.showShopkeeperMenu());
            return;
        }
        this.showShopkeeperMenu();
    }

    private showShopkeeperMenu() {
        const store = useGameStore.getState();
        const asked = store.day2Progress.optionalDiscoveries;
        const choices: ChoiceOption[] = [
            ...(!asked.includes('shopkeeper_time') ? [{ id: 'day2_shop_time', text: i18n.t('story.city2.shopChoices.time'), consequences: {} }] : []),
            ...(!asked.includes('shopkeeper_noise') ? [{ id: 'day2_shop_noise', text: i18n.t('story.city2.shopChoices.noise'), consequences: {} }] : []),
            ...(!asked.includes('shopkeeper_people') ? [{ id: 'day2_shop_people', text: i18n.t('story.city2.shopChoices.people'), consequences: {} }] : []),
            { id: 'day2_shop_leave', text: i18n.t('story.city2.shopChoices.leave'), consequences: {} },
        ];
        store.setDialog({
            textKey: asked.includes('shopkeeper_time') && asked.includes('shopkeeper_noise') && asked.includes('shopkeeper_people')
                ? 'story.city2.shopkeeperDone'
                : 'story.city2.shopkeeperPrompt',
            speaker: i18n.t('characters.shopkeeper'), type: 'bottom',
            choices: choices,
            onComplete: (choiceId) => {
                if (!choiceId || choiceId === 'day2_shop_leave') return;
                const discoveryId = choiceId === 'day2_shop_time'
                    ? 'shopkeeper_time'
                    : choiceId === 'day2_shop_noise'
                        ? 'shopkeeper_noise'
                        : 'shopkeeper_people';
                this.markOptional(discoveryId);
                const replyKey = choiceId === 'day2_shop_time'
                    ? 'story.city2.shopAnswers.time'
                    : choiceId === 'day2_shop_noise'
                        ? 'story.city2.shopAnswers.noise'
                        : 'story.city2.shopAnswers.people';
                store.setDialog({ textKey: replyKey, speaker: i18n.t('characters.shopkeeper'), type: 'bottom', onComplete: () => {
                    const latest = useGameStore.getState();
                    const completed = ['shopkeeper_time', 'shopkeeper_noise', 'shopkeeper_people']
                        .filter((id) => latest.day2Progress.optionalDiscoveries.includes(id)).length >= 2;
                    if (completed && this.markOptional('shopkeeper_interview_complete')) {
                        latest.grantFragment('shopkeeper_night_bell');
                        latest.addJournalNote(
                            i18n.t('story.city2.journal.noiseTitle'),
                            i18n.t('story.city2.journal.noiseContent'),
                            i18n.t('story.city2.journal.storeTimestamp'),
                        );
                    }
                    this.showShopkeeperMenu();
                } });
            },
        });
    }

    private enterChurchExterior() {
        this.location = 'CHURCH_EXT';
        this.playOutdoorMusic();
        this.showBackground('day2ChurchExt');
        this.addHotspot({ scene: this, x: 960, y: 390, width: 230, height: 320, type: 'path', actionLabel: i18n.t('story.city2.actions.church'), onClick: () => this.enterChurch() });
        this.addHotspot({ scene: this, x: 370, y: 430, width: 470, height: 410, type: 'path', actionLabel: i18n.t('story.city2.actions.alongChurch'), onClick: () => this.enterOrganicStreet() });
        this.addBack(() => this.enterTobacco());
    }

    private enterChurch() {
        this.location = 'CHURCH_INT';
        this.playInteriorMusic('church');
        this.showBackground('day2Church');
        this.addHotspot({ scene: this, x: 1060, y: 470, width: 250, height: 330, type: 'path', actionLabel: i18n.t('story.city2.actions.chapel'), onClick: () => this.enterChapel() });
        this.addHotspot({ scene: this, x: 210, y: 460, width: 230, height: 340, type: 'path', actionLabel: i18n.t('story.city2.actions.thomas'), onClick: () => this.enterThomas() });
        this.addBack(() => {
            this.enterChurchExterior();
        });
    }

    private enterChapel() {
        this.location = 'CHAPEL';
        this.showBackground('day2Chapel');
        this.addHotspot({ scene: this, x: 645, y: 420, width: 230, height: 400, type: 'inspect', actionLabel: i18n.t('story.city2.actions.virgin'), onClick: () => this.inspectVirgin() });
        if (useGameStore.getState().inventory.some((item) => item.id === 'chapelet')) {
            this.addHotspot({ scene: this, x: 645, y: 655, width: 330, height: 90, type: 'inspect', actionLabel: i18n.t('story.city2.actions.rosaryVirgin'), onClick: () => this.inspectRosaryInChapel() });
        }
        this.addHotspot({ scene: this, x: 245, y: 590, width: 260, height: 180, type: 'inspect', actionLabel: i18n.t('story.city2.actions.sit'), onClick: () => this.restInChapel() });
        this.addBack(() => this.enterChurch());
    }

    private inspectRosaryInChapel() {
        const store = useGameStore.getState();
        const firstLook = this.markOptional('rosary_chapel_silent');
        const reactedInStreet = store.day2Progress.optionalDiscoveries.includes('rosary_street_reaction_seen');
        if (reactedInStreet) this.recognizeRosaryContrast();
        store.startDialogue({
            text: i18n.t(reactedInStreet
                ? 'story.city2.rosaryChapelContrast'
                : firstLook ? 'story.city2.rosaryChapelFirst' : 'story.city2.rosaryChapelRepeat'),
        });
    }

    private restInChapel() {
        const store = useGameStore.getState();
        if (store.day2Progress.optionalDiscoveries.includes('chapel_pause')) {
            store.startDialogue({ text: i18n.t('story.city2.benchRepeat') });
            return;
        }
        store.setDialog({
            textKey: 'story.city2.bench',
            type: 'bottom',
            choices: [
                { id: 'day2_chapel_pray', text: i18n.t('story.city2.benchChoices.pray'), consequences: { attitudeTag: 'faith' } },
                { id: 'day2_chapel_breathe', text: i18n.t('story.city2.benchChoices.breathe'), consequences: { attitudeTag: 'resistance' } },
            ],
            onComplete: (choiceId) => {
                this.markOptional('chapel_pause');
                store.useAnchor('day2_chapel', 'quiet_pause', 5);
                store.setDialog({
                    textKey: choiceId === 'day2_chapel_pray' ? 'story.city2.benchPrayer' : 'story.city2.benchBreath',
                    type: 'bottom',
                });
            },
        });
    }

    private inspectVirgin() {
        const store = useGameStore.getState();
        if (store.day2Progress.virginMemoryTriggered) {
            store.startDialogue({ text: i18n.t('story.city2.virginRepeat') });
            return;
        }
        store.updateDay2Progress({ virginMemoryTriggered: true });
        store.grantFragment('virgin_dream_memory');
        store.modifyStat('lucidity', -5);
        const flash = this.add.image(640, 360, 'day2CursedMary').setDisplaySize(1280, 720).setDepth(1200).setAlpha(0);
        this.tweens.add({
            targets: flash, alpha: { from: 0, to: 1 }, duration: 100, yoyo: true, repeat: 2, hold: 100,
            onComplete: () => {
                flash.destroy();
                this.playDialogueSequence(localizedDialogue('story.city2.virginVision'), () => this.handleVirginCrisis());
            },
        });
    }

    private handleVirginCrisis() {
        const store = useGameStore.getState();
        if (store.lucidity > 0 || store.hasHandledCrisis('day2_virgin')) return;
        store.setDialog({
            textKey: 'story.city2.crisis.virginPrompt', type: 'bottom', distortible: true,
            hallucinationKey: 'story.city2.crisis.virginHallucination',
            choices: [
                { id: 'day2_virgin_crisis_leave', text: i18n.t('story.city2.crisis.leaveChapel'), consequences: { attitudeTag: 'rest' } },
                { id: 'day2_virgin_crisis_yield', text: i18n.t('story.city2.crisis.yieldVirgin'), consequences: { attitudeTag: 'faith' } },
            ],
            onComplete: (choiceId) => {
                store.markCrisisHandled('day2_virgin');
                if (choiceId === 'day2_virgin_crisis_leave') {
                    this.enterChurch();
                    return;
                }
                store.addInvestigationConclusion({
                    id: 'suggestion_corrupted_mother', connectionId: 'corrupted_mother', status: 'suggestion',
                    titleKey: 'story.city2.crisis.virginSuggestionTitle',
                    contentKey: 'story.city2.crisis.virginSuggestionContent', acquiredAt: i18n.t('story.office2.date'),
                });
            },
        });
    }

    private enterThomas() {
        this.location = 'THOMAS';
        this.showBackground('day2Thomas');
        const store = useGameStore.getState();
        this.addBack(() => this.enterChurch());
        if (!store.day2Progress.thomasConversationCompleted) {
            store.updateDay2Progress({ thomasConversationCompleted: true });
            this.playDialogueSequence(localizedDialogue('story.city2.thomasGreeting'), () => this.showThomasMenu());
            return;
        }
        this.showThomasMenu();
    }

    private showThomasMenu() {
        const store = useGameStore.getState();
        const asked = store.day2Progress.thomasTopicsAsked;
        const choices: ChoiceOption[] = [];

        if (!asked.includes('faith')) {
            const strongDoubt = ['theme_2_creation_souffrance', 'theme_3_origine_dieu', 'act1_church_critical']
                .some((id) => store.hasMadeChoice(id));
            const faithful = ['act1_church_pray_yes', 'act1_church_accept_faith']
                .some((id) => store.hasMadeChoice(id));
            choices.push({
                id: 'day2_thomas_faith',
                text: strongDoubt
                    ? i18n.t('story.city2.thomasChoices.doubt')
                    : faithful
                        ? i18n.t('story.city2.thomasChoices.faith')
                        : i18n.t('story.city2.thomasChoices.cause'),
                consequences: strongDoubt ? { attitudeTag: 'skepticism' } : faithful ? { attitudeTag: 'faith' } : { attitudeTag: 'knowledge' },
            });
        }
        if (store.day2Progress.virginMemoryTriggered && !asked.includes('virgin')) {
            choices.push({ id: 'day2_thomas_virgin', text: i18n.t('story.city2.thomasChoices.virgin'), consequences: {} });
        }
        if (store.hasFragment('organic_growth') && !asked.includes('plant')) {
            choices.push({ id: 'day2_thomas_plant', text: i18n.t('story.city2.thomasChoices.plant'), consequences: {} });
        }
        const shopkeeperDetailsKnown = ['shopkeeper_time', 'shopkeeper_noise', 'shopkeeper_people']
            .filter((id) => store.day2Progress.optionalDiscoveries.includes(id)).length >= 2;
        const canAskAboutNight = store.day2Progress.shopkeeperRumorHeard
            && !store.day2Progress.cultMeetingKnown
            && (!store.day2Progress.thomasNightDeflectionHeard || shopkeeperDetailsKnown);
        if (canAskAboutNight) {
            choices.push({
                id: store.day2Progress.thomasNightDeflectionHeard ? 'day2_thomas_night_insist' : 'day2_thomas_night',
                text: i18n.t(store.day2Progress.thomasNightDeflectionHeard
                    ? 'story.city2.thomasChoices.nightProof'
                    : 'story.city2.thomasChoices.night'),
                consequences: {},
            });
        }
        if (store.hasFragment('rosary_street_reaction') && !asked.includes('rosary')) {
            choices.push({ id: 'day2_thomas_rosary', text: i18n.t('story.city2.thomasChoices.rosary'), consequences: {} });
        }
        choices.push({ id: 'day2_thomas_leave', text: i18n.t('story.city2.thomasChoices.leave'), consequences: {} });

        store.setDialog({
            textKey: choices.length === 1 ? 'story.city2.thomasDone' : 'story.city2.thomasPrompt',
            speaker: i18n.t('characters.fatherThomas'),
            choices,
            onComplete: (choiceId) => this.handleThomasTopic(choiceId),
        });
    }

    private handleThomasTopic(choiceId?: string) {
        if (!choiceId || choiceId === 'day2_thomas_leave') return;
        if (choiceId === 'day2_thomas_faith') this.discussFaithWithThomas();
        if (choiceId === 'day2_thomas_virgin') this.discussVirginWithThomas();
        if (choiceId === 'day2_thomas_plant') this.discussPlantWithThomas();
        if (choiceId === 'day2_thomas_night') this.askThomasAboutNight();
        if (choiceId === 'day2_thomas_night_insist') this.pressThomasAboutNight();
        if (choiceId === 'day2_thomas_rosary') this.discussRosaryWithThomas();
    }

    private discussFaithWithThomas() {
        const store = useGameStore.getState();
        this.markThomasTopic('faith');
        const strongDoubt = ['theme_2_creation_souffrance', 'theme_3_origine_dieu', 'act1_church_critical']
            .some((id) => store.hasMadeChoice(id));
        const faithful = ['act1_church_pray_yes', 'act1_church_accept_faith']
            .some((id) => store.hasMadeChoice(id));
        const laurenceLine = strongDoubt
            ? i18n.t('story.city2.faith.doubt')
            : faithful
                ? i18n.t('story.city2.faith.believer')
                : i18n.t('story.city2.faith.neutral');
        this.playDialogueSequence([
            { speaker: i18n.t('characters.laurence'), text: laurenceLine },
            { speaker: i18n.t('characters.fatherThomas'), text: i18n.t('story.city2.faith.thomas1') },
            { speaker: i18n.t('characters.laurence'), text: i18n.t('story.city2.faith.laurence') },
            { speaker: i18n.t('characters.fatherThomas'), text: i18n.t('story.city2.faith.thomas2') },
        ], () => {
            store.useAnchor('day2_church', 'human_conversation', 10);
            this.showThomasMenu();
        });
    }

    private discussVirginWithThomas() {
        this.markThomasTopic('virgin');
        this.playDialogueSequence(localizedDialogue('story.city2.virginTalk'), () => {
            useGameStore.getState().useAnchor('day2_church', 'human_conversation', 10);
            this.showThomasMenu();
        });
    }

    private discussPlantWithThomas() {
        this.markThomasTopic('plant');
        this.playDialogueSequence(localizedDialogue('story.city2.plantTalk'), () => this.showThomasMenu());
    }

    private askThomasAboutNight() {
        useGameStore.getState().updateDay2Progress({ thomasNightDeflectionHeard: true });
        this.playDialogueSequence(localizedDialogue('story.city2.nightTalk'), () => this.showThomasMenu());
    }

    private pressThomasAboutNight() {
        const store = useGameStore.getState();
        this.playDialogueSequence(localizedDialogue('story.city2.nightPress'), () => {
            store.grantFragment('cult_meeting');
            store.grantFragment('thomas_slip');
            store.updateDay2Progress({ cultMeetingKnown: true });
            store.addJournalNote(
                i18n.t('story.city2.journal.meetingTitle'),
                i18n.t('story.city2.journal.meetingContent'),
                i18n.t('story.city2.journal.churchTimestamp'),
            );
            this.showThomasMenu();
        });
    }

    private discussRosaryWithThomas() {
        this.markThomasTopic('rosary');
        this.playDialogueSequence(localizedDialogue('story.city2.rosaryTalk'), () => this.showThomasMenu());
    }

    private markThomasTopic(topic: string) {
        const store = useGameStore.getState();
        if (store.day2Progress.thomasTopicsAsked.includes(topic)) return;
        store.updateDay2Progress({ thomasTopicsAsked: [...store.day2Progress.thomasTopicsAsked, topic] });
    }

    private enterOrganicStreet() {
        this.location = 'ORGANIC_STREET';
        this.playOutdoorMusic();
        this.showBackground('day2OrganicStreet');
        const store = useGameStore.getState();
        if (store.inventory.some((item) => item.id === 'chapelet') && !store.day2Progress.organicAnomalies.includes('rosary')) {
            store.updateDay2Progress({ organicAnomalies: [...store.day2Progress.organicAnomalies, 'rosary'] });
            store.grantFragment('rosary_street_reaction');
            this.markOptional('rosary_street_reaction_seen');
            const chapelWasSilent = store.day2Progress.optionalDiscoveries.includes('rosary_chapel_silent');
            if (chapelWasSilent) this.recognizeRosaryContrast();
            store.setDialog({
                textKey: chapelWasSilent ? 'story.city2.rosaryStreetContrast' : 'story.city2.rosaryStreet',
                type: 'bottom',
            });
        }
        this.addHotspot({ scene: this, x: 190, y: 440, width: 320, height: 520, type: 'inspect', actionLabel: i18n.t('story.city2.actions.plant'), onClick: () => this.inspectAnomaly('growth') });
        this.addHotspot({ scene: this, x: 925, y: 595, width: 480, height: 180, type: 'inspect', actionLabel: i18n.t('story.city2.actions.hoofprints'), onClick: () => this.inspectAnomaly('hoofprints') });
        this.addHotspot({ scene: this, x: 655, y: 400, width: 230, height: 280, type: 'path', actionLabel: i18n.t('story.city2.actions.cemetery'), onClick: () => {
            if (!store.day2Progress.cemeteryLeadKnown) {
                store.startDialogue({ text: i18n.t('story.city2.noCemeteryReason') });
                return;
            }
            this.enterCemetery();
        } });
        this.addBack(() => this.enterChurchExterior());
    }

    private inspectAnomaly(id: string) {
        const store = useGameStore.getState();
        const isNew = !store.day2Progress.organicAnomalies.includes(id);
        if (isNew) {
            store.updateDay2Progress({ organicAnomalies: [...store.day2Progress.organicAnomalies, id], organicShockApplied: true });
            if (!store.day2Progress.organicShockApplied) store.modifyStat('lucidity', -5);
            store.grantFragment(id === 'growth' ? 'organic_growth' : 'organic_hoofprints');
        }
        if (id === 'growth') {
            const lines = isNew
                ? this.localizedMonologue('story.city2.plantFirst')
                : [{ speaker: i18n.t('characters.laurence'), text: i18n.t('story.city2.plantRepeat') }];
            if (store.day2Progress.cultMeetingKnown) {
                lines.push({ speaker: i18n.t('characters.laurence'), text: i18n.t('story.city2.plantChurch') });
            }
            this.playDialogueSequence(lines, () => undefined);
            return;
        }

        const hoofprintLines = isNew
            ? this.localizedMonologue('story.city2.hoofFirst')
            : [{ speaker: i18n.t('characters.laurence'), text: i18n.t('story.city2.hoofRepeat') }];
        this.playDialogueSequence(hoofprintLines, () => undefined);
    }

    private enterCemetery() {
        this.location = 'CEMETERY';
        this.playGraveyardMusic();
        this.showBackground('day2Cemetery');
        const store = useGameStore.getState();
        if (!store.day2Progress.cemeteryVisited) {
            store.updateDay2Progress({ cemeteryVisited: true });
            const hasRosary = store.inventory.some((item) => item.id === 'chapelet');
            store.setDialog({
                textKey: hasRosary ? 'story.city2.cemeteryFirstRosary' : 'story.city2.cemeteryFirst',
                type: 'bottom',
            });
        }
        this.addHotspot({ scene: this, x: 290, y: 320, width: 250, height: 350, type: 'inspect', actionLabel: i18n.t('story.city2.actions.angel'), onClick: () => {
            this.markOptional('cemetery_eroded_angel');
            store.startDialogue({ text: i18n.t('story.city2.angel') });
        } });
        this.addHotspot({ scene: this, x: 1070, y: 520, width: 340, height: 270, type: 'inspect', actionLabel: i18n.t('story.city2.actions.graves'), onClick: () => {
            this.markOptional('cemetery_family_graves');
            store.startDialogue({ text: i18n.t('story.city2.graves') });
        } });
        this.addHotspot({ scene: this, x: 650, y: 600, width: 250, height: 155, type: 'inspect', actionLabel: i18n.t('story.city2.actions.path'), onClick: () => {
            const firstLook = this.markOptional('cemetery_used_path');
            store.startDialogue({ text: i18n.t(firstLook ? 'story.city2.pathFirst' : 'story.city2.pathRepeat') });
        } });
        this.addHotspot({ scene: this, x: 650, y: 315, width: 300, height: 360, type: 'path', actionLabel: i18n.t('story.city2.actions.mausoleum'), onClick: () => this.enterLock() });
        this.addBack(() => this.enterOrganicStreet());
    }

    private enterLock() {
        this.location = 'LOCK';
        this.playGraveyardMusic();
        this.showBackground('day2Lock');
        const store = useGameStore.getState();
        if (store.day2Progress.mausoleumUnlocked) {
            this.addHotspot({ scene: this, x: 640, y: 370, width: 500, height: 550, type: 'path', actionLabel: i18n.t('story.city2.actions.crypt'), onClick: () => this.enterCrypt() });
        } else {
            this.createCombinationPad();
        }
        this.addBack(() => this.enterCemetery());
    }

    private createCombinationPad() {
        let code = '';
        let failedOnce = false;
        const panel = this.add.rectangle(640, 612, 900, 170, 0x020408, 0.92).setStrokeStyle(1, 0x8a7b5a).setDepth(900);
        const lockCover = this.add.rectangle(640, 405, 190, 125, 0x100d08, 0.96).setStrokeStyle(2, 0x8a6f3f).setDepth(900);
        const display = this.add.text(640, 405, '____', { fontFamily: 'monospace', fontSize: '34px', color: '#f4ebd0', backgroundColor: '#151517', padding: { x: 18, y: 8 } }).setOrigin(0.5).setDepth(901);
        this.uiObjects.push(panel, lockCover, display);
        const refresh = () => display.setText(code.padEnd(4, '_'));
        const makeButton = (label: string, x: number, action: () => void) => {
            const button = this.add.text(x, 650, label, { fontFamily: 'monospace', fontSize: '20px', color: '#f4ebd0', backgroundColor: '#29251f', padding: { x: 12, y: 8 } }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(901);
            button.on('pointerdown', action);
            this.uiObjects.push(button);
        };
        for (let digit = 0; digit <= 9; digit += 1) {
            makeButton(String(digit), 315 + digit * 65, () => { if (code.length < 4) { code += digit; refresh(); } });
        }
        makeButton(i18n.t('story.city2.lock.clear'), 1040, () => { code = ''; refresh(); });
        const insight = this.add.text(640, 574, i18n.t('story.city2.lock.insight'), {
            fontFamily: 'monospace', fontSize: '15px', color: '#c8e5e8', backgroundColor: '#18292ddd', padding: { x: 12, y: 6 },
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(902).setVisible(false);
        insight.on('pointerdown', () => {
            const store = useGameStore.getState();
            if (!store.useInsight('day2_mausoleum_lock')) return;
            insight.setVisible(false);
            store.startDialogue({ text: i18n.t('story.city2.lockInsight') });
        });
        const validate = this.add.text(640, 700, i18n.t('story.city2.lock.validate'), { fontFamily: 'monospace', fontSize: '18px', color: '#d4af37', backgroundColor: '#17130c', padding: { x: 16, y: 6 } }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(902);
        validate.on('pointerdown', () => {
            const store = useGameStore.getState();
            if (code === '1921') {
                store.updateDay2Progress({ mausoleumUnlocked: true });
                store.grantFragment('yith_cache_found');
                this.playTranslatedSequence('story.city2.lockOpen', () => this.enterCrypt());
                return;
            }
            const admissionGuess = code === '1924' || code === '3012';
            store.startDialogue({ text: i18n.t(admissionGuess ? 'story.city2.lockAdmission' : 'story.city2.lockWrong') });
            failedOnce = true;
            if (failedOnce && store.consciousness >= 10 && !store.hasUsedInsight('day2_mausoleum_lock')) insight.setVisible(true);
            code = '';
            refresh();
        });
        this.uiObjects.push(validate, insight);
    }

    private enterCrypt() {
        this.location = 'CRYPT';
        this.playGraveyardMusic();
        this.showBackground('day2Crypt');
        const store = useGameStore.getState();
        store.updateDay2Progress({ yithCacheOpened: true });
        if (!store.day2Progress.futureObjectRecovered) {
            this.usbSprite = this.add.image(640, 270, 'day2FutureObject').setScale(0.22).setDepth(20).setInteractive({ useHandCursor: true });
            this.usbSprite.on('pointerover', () => this.game.canvas.classList.add('cursor-inspect'));
            this.usbSprite.on('pointerout', () => this.game.canvas.classList.remove('cursor-inspect'));
            this.usbSprite.on('pointerdown', () => this.collectFutureObject());
        } else {
            this.addHotspot({ scene: this, x: 640, y: 275, width: 420, height: 180, type: 'inspect', actionLabel: i18n.t('story.city2.actions.altar'), onClick: () => {
                this.markOptional('crypt_table');
                this.checkCryptSurvey();
                store.startDialogue({ text: i18n.t('story.city2.altar') });
            } });
        }
        this.addHotspot({ scene: this, x: 175, y: 355, width: 300, height: 430, type: 'inspect', actionLabel: i18n.t('story.city2.actions.niches'), onClick: () => {
            this.markOptional('crypt_shelves');
            this.checkCryptSurvey();
            if (store.consciousness >= 35 && store.useInsight('day2_crypt_archive')) {
                this.playTranslatedSequence('story.city2.cryptInsight', () => undefined);
                return;
            }
            store.startDialogue({ text: i18n.t('story.city2.niches') });
        } });
        this.addHotspot({ scene: this, x: 650, y: 625, width: 550, height: 150, type: 'inspect', actionLabel: i18n.t('story.city2.actions.dust'), onClick: () => {
            this.markOptional('crypt_dust');
            this.checkCryptSurvey();
            store.startDialogue({ text: i18n.t('story.city2.dust') });
        } });
        this.addBack(() => this.enterLock());
    }

    private collectFutureObject() {
        const store = useGameStore.getState();
        this.game.canvas.classList.remove('cursor-inspect');
        this.usbSprite?.disableInteractive();
        const vision = this.add.image(640, 360, 'day2YithLibrary').setDisplaySize(1280, 720).setDepth(1300).setAlpha(0);
        this.cameras.main.shake(450, 0.025);
        this.tweens.add({
            targets: vision, alpha: { from: 0, to: 1 }, duration: 140, yoyo: true, repeat: 2, hold: 140,
            onComplete: () => {
                vision.destroy();
                this.usbSprite?.destroy();
                this.usbSprite = undefined;
                store.modifyStat('lucidity', -10);
                store.modifyStat('consciousness', 5);
                store.grantFragment('future_object');
                store.grantFragment('yith_library_vision');
                store.updateDay2Progress({ futureObjectRecovered: true, yithVisionSeen: true });
                store.addItem({
                    id: 'future_black_object', name: i18n.t('story.city2.object.name'), icon: `${import.meta.env.BASE_URL}assets/clé.png`,
                    description: i18n.t('story.city2.object.description'),
                    examineText: i18n.t('story.city2.object.examine'),
                });
                store.addJournalNote(
                    i18n.t('story.city2.journal.visionTitle'),
                    i18n.t('story.city2.journal.visionContent'),
                    i18n.t('story.city2.journal.cryptTimestamp'),
                );
                const visionLine = useGameStore.getState().lucidity > 10
                    ? i18n.t('story.city2.visionClear')
                    : i18n.t('story.city2.visionLow');
                const reaction = this.localizedMonologue('story.city2.objectReaction');
                reaction.splice(1, 0, { speaker: i18n.t('characters.laurence'), text: visionLine });
                this.playDialogueSequence(reaction, () => this.handleObjectCrisis());
                store.saveGame();
            },
        });
    }

    private handleObjectCrisis() {
        const store = useGameStore.getState();
        if (store.lucidity > 0 || store.hasHandledCrisis('day2_future_object')) {
            this.enterCrypt();
            return;
        }
        store.setDialog({
            textKey: 'story.city2.crisis.objectPrompt', type: 'bottom', distortible: true,
            hallucinationKey: 'story.city2.crisis.objectHallucination',
            choices: [
                { id: 'day2_object_crisis_leave', text: i18n.t('story.city2.crisis.leaveCrypt'), consequences: { attitudeTag: 'rest' } },
                { id: 'day2_object_crisis_yield', text: i18n.t('story.city2.crisis.yieldObject'), consequences: { attitudeTag: 'knowledge' } },
            ],
            onComplete: (choiceId) => {
                store.markCrisisHandled('day2_future_object');
                if (choiceId === 'day2_object_crisis_leave') {
                    this.enterCemetery();
                    return;
                }
                store.addInvestigationConclusion({
                    id: 'suggestion_father_chose_exchange', connectionId: 'father_chose_exchange', status: 'suggestion',
                    titleKey: 'story.city2.crisis.objectSuggestionTitle',
                    contentKey: 'story.city2.crisis.objectSuggestionContent', acquiredAt: i18n.t('story.office2.date'),
                });
                this.enterCrypt();
            },
        });
    }

    private openDay2Board() {
        const store = useGameStore.getState();
        const revision = store.connectionBoardRevision;
        this.unsubscribeBoard?.();
        this.unsubscribeBoard = useGameStore.subscribe((state) => {
            if (state.connectionBoardRevision !== revision) {
                this.unsubscribeBoard?.();
                this.unsubscribeBoard = undefined;
                state.updateDay2Progress({ finalConnectionsCompleted: true });
                state.saveGame();
                state.setScene('Day2DreamScene');
                this.scene.start('Day2DreamScene');
            }
        });
        store.openConnectionBoard('day2');
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

    private localizedMonologue(key: string) {
        const lines = i18n.t(key, { returnObjects: true }) as unknown;
        if (!Array.isArray(lines)) return [];
        return lines
            .filter((line): line is string => typeof line === 'string')
            .map((text) => ({ speaker: i18n.t('characters.laurence'), text }));
    }

    private playTranslatedSequence(key: string, onComplete: () => void) {
        this.playDialogueSequence(this.localizedMonologue(key), onComplete);
    }

    private markOptional(id: string) {
        const store = useGameStore.getState();
        if (store.day2Progress.optionalDiscoveries.includes(id)) return false;
        store.updateDay2Progress({ optionalDiscoveries: [...store.day2Progress.optionalDiscoveries, id] });
        return true;
    }

    private recognizeRosaryContrast() {
        const store = useGameStore.getState();
        if (!this.markOptional('rosary_contrast_understood')) return;
        store.modifyStat('consciousness', 2);
        store.addJournalNote(
            i18n.t('story.city2.journal.rosaryTitle'),
            i18n.t('story.city2.journal.rosaryContent'),
            i18n.t('story.city2.journal.churchTimestamp'),
        );
    }

    private checkCryptSurvey() {
        const store = useGameStore.getState();
        const discoveries = store.day2Progress.optionalDiscoveries;
        if (!['crypt_table', 'crypt_shelves', 'crypt_dust'].every((id) => discoveries.includes(id))) return;
        if (!this.markOptional('crypt_survey_complete')) return;
        store.modifyStat('consciousness', 3);
        store.addJournalNote(
            i18n.t('story.city2.journal.cryptTitle'),
            i18n.t('story.city2.journal.cryptContent'),
            i18n.t('story.city2.journal.cryptTimestamp'),
        );
    }
}
