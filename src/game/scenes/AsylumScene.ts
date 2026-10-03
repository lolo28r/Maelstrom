import Phaser from 'phaser';
import { useGameStore } from '../../store/useGameStore';
import { HotspotZone } from '../helper/HotSpotZone';
import { getMusicVolume } from '../../audio/audioMix';
import i18n from '../../i18n';
import { localizedDialogue } from '../../utils/localizedDialogue';

type AsylumLocation = 'EXTERIOR' | 'RECEPTION' | 'ROOM' | 'SUITCASE';

export class AsylumScene extends Phaser.Scene {
    private background?: Phaser.GameObjects.Image;
    private hotspots: HotspotZone[] = [];
    private backButton?: Phaser.GameObjects.Text;
    private location: AsylumLocation = 'EXTERIOR';
    private asylumMusic?: Phaser.Sound.BaseSound;

    constructor() {
        super({ key: 'AsylumScene' });
    }

    preload() {
        const base = import.meta.env.BASE_URL;
        this.load.image('day2AsylumExterior', `${base}assets/asileExt.jpg`);
        this.load.image('day2AsylumReception', `${base}assets/asileInt.jpg`);
        this.load.image('day2AsylumRoom', `${base}assets/chambreVide.jpg`);
        this.load.image('day2Suitcase', `${base}assets/valise.jpg`);
        this.load.audio('day2AsylumMusic', `${base}assets/asylumOst.mp3`);
    }

    create() {
        useGameStore.getState().setScene('AsylumScene');
        this.cameras.main.fadeIn(700, 0, 0, 0);
        this.asylumMusic = this.sound.add('day2AsylumMusic', { loop: true, volume: getMusicVolume() });
        this.asylumMusic.play();
        this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
            this.clearInteractive();
            this.asylumMusic?.stop();
            this.asylumMusic?.destroy();
        });
        this.enterExterior();
    }

    private showBackground(key: string) {
        this.clearInteractive();
        this.background?.destroy();
        this.background = this.add.image(640, 360, key).setDisplaySize(1280, 720);
    }

    private clearInteractive() {
        this.hotspots.forEach((hotspot) => hotspot.destroy());
        this.hotspots = [];
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

    private enterExterior() {
        this.location = 'EXTERIOR';
        this.showBackground('day2AsylumExterior');
        this.addHotspot({
            scene: this, x: 640, y: 390, width: 300, height: 370,
            type: 'path', actionLabel: i18n.t('story.asylum.actions.enter'),
            onClick: () => this.enterReception(),
        });
        this.addHotspot({
            scene: this, x: 640, y: 675, width: 430, height: 80,
            type: 'path', actionLabel: i18n.t('story.asylum.actions.leaveTown'),
            onClick: () => {
                const store = useGameStore.getState();
                if (!store.day2Progress.fatherEffectsCollected) {
                    store.startDialogue({ text: i18n.t('story.asylum.mustFinish') });
                    return;
                }
                store.saveGame();
                store.setScene('Day2CityScene');
                this.scene.start('Day2CityScene');
            },
        });
    }

    private enterReception() {
        this.location = 'RECEPTION';
        this.showBackground('day2AsylumReception');
        const store = useGameStore.getState();

        if (!store.day2Progress.asylumVisited) store.updateDay2Progress({ asylumVisited: true });

        this.addHotspot({
            scene: this, x: 480, y: 365, width: 330, height: 310,
            type: 'inspect', actionLabel: i18n.t('story.asylum.actions.talk'),
            onClick: () => this.talkToEmployee(),
        });
        this.addHotspot({
            scene: this, x: 650, y: 565, width: 410, height: 260,
            type: 'inspect', actionLabel: i18n.t('story.asylum.actions.suitcase'),
            onClick: () => {
                if (!store.day2Progress.disappearanceConfirmed) {
                    store.startDialogue({ text: i18n.t('story.asylum.roomFirst') });
                    return;
                }
                this.enterSuitcase();
            },
        });
        this.addHotspot({
            scene: this, x: 900, y: 385, width: 250, height: 420,
            type: 'path', actionLabel: i18n.t('story.asylum.actions.room'),
            onClick: () => this.enterRoom(),
        });
        this.addBack(() => this.enterExterior(), i18n.t('scene_ui.exit'));
    }

    private enterRoom() {
        this.location = 'ROOM';
        this.showBackground('day2AsylumRoom');
        this.addRoomClue('door', 115, 400, 190, 430, i18n.t('story.asylum.actions.door'), i18n.t('story.asylum.clues.door'));
        this.addRoomClue('bed', 410, 475, 390, 260, i18n.t('story.asylum.actions.bed'), i18n.t('story.asylum.clues.bed'));
        this.addRoomClue('window', 1010, 285, 320, 430, i18n.t('story.asylum.actions.window'), i18n.t('story.asylum.clues.window'));
        this.addHotspot({
            scene: this, x: 655, y: 430, width: 135, height: 235,
            type: 'inspect', actionLabel: i18n.t('story.asylum.actions.chair'),
            onClick: () => {
                const store = useGameStore.getState();
                const firstLook = this.markOptional('asylum_chair_dates');
                if (firstLook) {
                    store.modifyStat('consciousness', 2);
                    store.addJournalNote(
                        i18n.t('story.asylum.journal.chairTitle'),
                        i18n.t('story.asylum.journal.chairContent'),
                        i18n.t('story.asylum.journal.asylumTimestamp'),
                    );
                }
                store.startDialogue({
                    text: i18n.t(firstLook ? 'story.asylum.chairFirst' : 'story.asylum.chairRepeat'),
                });
            },
        });
        this.addBack(() => this.enterReception());
    }

    private talkToEmployee() {
        const store = useGameStore.getState();
        if (!store.day2Progress.asylumReceptionBriefed) {
            store.updateDay2Progress({ asylumReceptionBriefed: true });
            store.modifyStat('lucidity', -10);
            store.grantFragment('asylum_admission_1924');
            store.grantFragment('asylum_no_departure');
            this.playDialogueSequence(localizedDialogue('story.asylum.briefing'), () => this.showEmployeeMenu());
            return;
        }
        this.showEmployeeMenu();
    }

    private showEmployeeMenu() {
        const store = useGameStore.getState();
        const asked = store.day2Progress.optionalDiscoveries;
        const choices = [
            { id: 'day2_asylum_rounds', text: i18n.t('story.asylum.choices.rounds'), consequences: {} },
            ...(!asked.includes('asylum_exact_date') ? [{ id: 'day2_asylum_date', text: i18n.t('story.asylum.choices.date'), consequences: {} }] : []),
            ...(!asked.includes('asylum_suitcase_guarded') ? [{ id: 'day2_asylum_suitcase', text: i18n.t('story.asylum.choices.suitcase'), consequences: {} }] : []),
            ...(!asked.includes('asylum_sleep_schedule') ? [{ id: 'day2_asylum_sleep', text: i18n.t('story.asylum.choices.sleep'), consequences: {} }] : []),
            { id: 'day2_asylum_leave', text: i18n.t('story.asylum.choices.leave'), consequences: {} },
        ];
        store.setDialog({
            textKey: choices.length === 2 ? 'story.asylum.menuDone' : 'story.asylum.menuPrompt',
            speaker: i18n.t('story.asylum.employee'), type: 'bottom', choices,
            onComplete: (choiceId) => this.resolveEmployeeTopic(choiceId),
        });
    }

    private resolveEmployeeTopic(choiceId?: string) {
        const store = useGameStore.getState();
        if (!choiceId || choiceId === 'day2_asylum_leave') return;
        let lines = localizedDialogue('story.asylum.rounds');
        if (choiceId === 'day2_asylum_date') {
            this.markOptional('asylum_exact_date');
            lines = localizedDialogue('story.asylum.date');
        } else if (choiceId === 'day2_asylum_suitcase') {
            this.markOptional('asylum_suitcase_guarded');
            lines = localizedDialogue('story.asylum.suitcase');
        } else if (choiceId === 'day2_asylum_sleep') {
            this.markOptional('asylum_sleep_schedule');
            lines = localizedDialogue('story.asylum.sleep');
        } else {
            store.grantFragment('asylum_no_departure');
        }
        const askedCount = ['asylum_exact_date', 'asylum_suitcase_guarded', 'asylum_sleep_schedule']
            .filter((id) => useGameStore.getState().day2Progress.optionalDiscoveries.includes(id)).length;
        if (askedCount === 3 && !store.day2Progress.optionalDiscoveries.includes('asylum_interview_complete')) {
            this.markOptional('asylum_interview_complete');
            store.addJournalNote(
                i18n.t('story.asylum.journal.beforeTitle'),
                i18n.t('story.asylum.journal.beforeContent'),
                i18n.t('story.asylum.journal.asylumTimestamp'),
            );
        }
        this.playDialogueSequence(lines, () => this.showEmployeeMenu());
    }

    private addRoomClue(id: string, x: number, y: number, width: number, height: number, label: string, text: string) {
        this.addHotspot({
            scene: this, x, y, width, height, type: 'inspect', actionLabel: label,
            onClick: () => {
                const store = useGameStore.getState();
                const clues = store.day2Progress.roomClues;
                const isNew = !clues.includes(id);
                if (isNew) store.updateDay2Progress({ roomClues: [...clues, id] });
                store.setDialog({
                    textKey: text,
                    type: 'bottom',
                    onComplete: () => {
                        const latest = useGameStore.getState();
                        if (!latest.day2Progress.disappearanceConfirmed && latest.day2Progress.roomClues.length >= 3) {
                            latest.updateDay2Progress({ disappearanceConfirmed: true });
                            latest.grantFragment('asylum_sealed_room');
                            latest.grantFragment('asylum_room_undisturbed');
                            latest.setDialog({
                                textKey: 'story.asylum.sealedRoom', type: 'bottom',
                            });
                        }
                    },
                });
            },
        });
    }

    private enterSuitcase() {
        this.location = 'SUITCASE';
        this.showBackground('day2Suitcase');
        this.addSuitcaseItem('photo', 230, 385, 250, 330, i18n.t('story.asylum.actions.photo'), () => this.inspectPhoto());
        this.addSuitcaseItem('dossier', 620, 390, 390, 390, i18n.t('story.asylum.actions.file'), () => this.readDossier());
        this.addSuitcaseItem('note', 915, 365, 150, 280, i18n.t('story.asylum.actions.note'), () => this.readNote());
        this.addBack(() => this.leaveSuitcase(), i18n.t('story.asylum.actions.closeSuitcase'));
    }

    private addSuitcaseItem(id: string, x: number, y: number, width: number, height: number, label: string, action: () => void) {
        this.addHotspot({
            scene: this, x, y, width, height, type: 'inspect', actionLabel: label,
            onClick: () => {
                if (useGameStore.getState().day2Progress.suitcaseItems.includes(id)) {
                    useGameStore.getState().startDialogue({ text: i18n.t('story.asylum.alreadyExamined') });
                    return;
                }
                action();
            },
        });
    }

    private markSuitcaseItem(id: string) {
        const store = useGameStore.getState();
        if (store.day2Progress.suitcaseItems.includes(id)) return;
        const suitcaseItems = [...store.day2Progress.suitcaseItems, id];
        store.updateDay2Progress({ suitcaseItems });
        if (suitcaseItems.length >= 3) {
            store.updateDay2Progress({ fatherEffectsCollected: true });
            store.setDialog({ textKey: 'story.asylum.effectsDone', type: 'bottom' });
        }
    }

    private inspectPhoto() {
        const store = useGameStore.getState();
        store.useAnchor('day2_asylum', 'family_photo', 10);
        store.grantFragment('father_photo_before_1921');
        store.setDialog({
            textKey: 'story.asylum.photo',
            type: 'bottom',
            onComplete: () => this.markSuitcaseItem('photo'),
        });
    }

    private readDossier() {
        const store = useGameStore.getState();
        store.openDocument({
            title: i18n.t('story.asylum.fileTitle'),
            content: i18n.t('story.asylum.file'),
            onClose: () => {
                store.addArchivedDocument(
                    'day2_father_file',
                    i18n.t('story.asylum.archive.fileTitle'),
                    i18n.t('story.asylum.archive.fileSummary'),
                    i18n.t('story.asylum.journal.asylumTimestamp'),
                );
                store.grantFragment('asylum_admission_1924');
                store.grantFragment('asylum_change_1921');
                this.markSuitcaseItem('dossier');
            },
        });
    }

    private readNote() {
        const store = useGameStore.getState();
        store.openDocument({
            title: i18n.t('story.asylum.noteTitle'),
            content: i18n.t('story.asylum.note'),
            onClose: () => {
                store.addArchivedDocument(
                    'day2_cemetery_note',
                    i18n.t('story.asylum.archive.noteTitle'),
                    i18n.t('story.asylum.archive.noteSummary'),
                    i18n.t('story.asylum.journal.effectsTimestamp'),
                );
                store.grantFragment('father_note_cache');
                store.updateDay2Progress({ cemeteryLeadKnown: true });
                store.addJournalNote(
                    i18n.t('story.asylum.journal.leadTitle'),
                    i18n.t('story.asylum.journal.leadContent'),
                    i18n.t('story.office2.date'),
                );
                this.markSuitcaseItem('note');
            },
        });
    }

    private leaveSuitcase() {
        const store = useGameStore.getState();
        if (!store.day2Progress.fatherEffectsCollected) {
            store.startDialogue({ text: i18n.t('story.asylum.mustInspect') });
            return;
        }
        this.enterReception();
    }

    private markOptional(id: string) {
        const store = useGameStore.getState();
        if (store.day2Progress.optionalDiscoveries.includes(id)) return false;
        store.updateDay2Progress({ optionalDiscoveries: [...store.day2Progress.optionalDiscoveries, id] });
        return true;
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
}
