import Phaser from 'phaser';
import { useGameStore } from '../../store/useGameStore';
import { HotspotZone } from '../helper/HotSpotZone';
import { getMusicVolume } from '../../audio/audioMix';
import i18n from '../../i18n';

export class Day2OfficeScene extends Phaser.Scene {
    private hotspots: HotspotZone[] = [];
    private officeMusic?: Phaser.Sound.BaseSound;

    constructor() {
        super({ key: 'Day2OfficeScene' });
    }

    preload() {
        this.load.image('day2Desk', `${import.meta.env.BASE_URL}assets/DeskDay.jpg`);
        this.load.audio('day2OfficeMusic', `${import.meta.env.BASE_URL}assets/ostDeskDay.mp3`);
    }

    create() {
        const store = useGameStore.getState();
        store.setScene('Day2OfficeScene');
        store.setCurrentDate(i18n.t('story.office2.date'));
        store.updateDay2Progress({ started: true });
        this.cameras.main.fadeIn(900, 0, 0, 0);
        this.add.image(640, 360, 'day2Desk').setDisplaySize(1280, 720);
        this.officeMusic = this.sound.add('day2OfficeMusic', { loop: true, volume: getMusicVolume() });
        this.officeMusic.play();

        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.hotspots.forEach((hotspot) => hotspot.destroy());
            this.officeMusic?.stop();
            this.officeMusic?.destroy();
        });

        if (!store.day2Progress.officeIntroSeen) {
            store.updateDay2Progress({ officeIntroSeen: true });
            this.playTranslatedSequence('story.office2.intro', () => store.openDocument({
                title: i18n.t('story.office2.telegramTitle'),
                content: i18n.t('story.office2.telegram'),
                onClose: () => {
                    store.addArchivedDocument('day2_asylum_telegram', i18n.t('story.office2.telegramTitle'), i18n.t('story.office2.telegramArchive'), i18n.t('story.office2.date'));
                    this.playTranslatedSequence('story.office2.afterTelegram', () => undefined);
                },
            }));
        }

        this.hotspots.push(new HotspotZone({
            scene: this, x: 625, y: 430, width: 360, height: 190,
            type: 'inspect', actionLabel: i18n.t('story.office2.actions.telegram'),
            onClick: () => {
                const anchored = store.useAnchor('day2_office', 'telegram_date', 5);
                store.startDialogue({
                    text: i18n.t(anchored ? 'story.office2.anchorFirst' : 'story.office2.anchorRepeat'),
                });
            },
        }));

        this.hotspots.push(new HotspotZone({
            scene: this, x: 175, y: 95, width: 260, height: 150,
            type: 'inspect', actionLabel: i18n.t('story.office2.actions.books'),
            onClick: () => {
                store.openDocument({
                    title: i18n.t('story.office2.articleTitle'),
                    content: i18n.t('story.office2.article'),
                    onClose: () => {
                        if (this.markOptional('office_father_offprint')) {
                            store.addArchivedDocument('day2_father_offprint', i18n.t('story.office2.articleArchiveTitle'), i18n.t('story.office2.articleArchive'), i18n.t('journal.officeArchiveTimestamp'));
                        }
                    },
                });
            },
        }));

        this.hotspots.push(new HotspotZone({
            scene: this, x: 1090, y: 160, width: 300, height: 250,
            type: 'inspect', actionLabel: i18n.t('story.office2.actions.window'),
            onClick: () => {
                const firstLook = this.markOptional('office_window_crows');
                store.startDialogue({
                    text: i18n.t(firstLook ? 'story.office2.windowFirst' : 'story.office2.windowSecond'),
                });
            },
        }));

        const exitButton = this.add.text(1150, 650, i18n.t('scene_ui.exit'), {
            fontFamily: 'serif', fontSize: '18px', color: '#aaaaaa', backgroundColor: '#00000099', padding: { x: 14, y: 8 },
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(1001);
        exitButton.on('pointerover', () => exitButton.setColor('#ffffff'));
        exitButton.on('pointerout', () => exitButton.setColor('#aaaaaa'));
        exitButton.on('pointerdown', () => {
            const current = useGameStore.getState();
            if (current.currentDialog || current.activeDocument) return;
            this.cameras.main.fadeOut(700, 0, 0, 0);
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
                current.setScene('AsylumScene');
                this.scene.start('AsylumScene');
            });
        });
    }

    private markOptional(id: string) {
        const store = useGameStore.getState();
        if (store.day2Progress.optionalDiscoveries.includes(id)) return false;
        store.updateDay2Progress({ optionalDiscoveries: [...store.day2Progress.optionalDiscoveries, id] });
        return true;
    }

    private playTranslatedSequence(key: string, onComplete: () => void, index = 0) {
        const lines = i18n.t(key, { returnObjects: true }) as unknown;
        if (!Array.isArray(lines) || typeof lines[index] !== 'string') {
            onComplete();
            return;
        }
        useGameStore.getState().setDialog({
            textKey: lines[index],
            type: 'bottom',
            onComplete: () => this.playTranslatedSequence(key, onComplete, index + 1),
        });
    }
}
