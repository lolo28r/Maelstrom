import Phaser from 'phaser';
import { useGameStore } from '../../store/useGameStore';

export class ProfessorOfficeScene extends Phaser.Scene {
  private cityBgGroup!: Phaser.GameObjects.Group;
  private officeBgGroup!: Phaser.GameObjects.Group;
  private normalGroup!: Phaser.GameObjects.Group;
  private trueViewGroup!: Phaser.GameObjects.Group;
  private unsubscribeStore?: () => void;
  private isOfficeVisible: boolean = false;

  constructor() {
    super('ProfessorOffice');
  }

  preload() {
    this.load.image('city_night', '/assets/backgrounds/city_night.png');
    this.load.image('office_interior', '/assets/backgrounds/office_interior.png');
  }

  create() {
    useGameStore.getState().setScene('ProfessorOffice');
    this.cameras.main.setBackgroundColor('#020408');
    this.cameras.main.fadeIn(1000, 0, 0, 0);

    this.cityBgGroup = this.add.group();
    this.officeBgGroup = this.add.group();
    this.normalGroup = this.add.group();
    this.trueViewGroup = this.add.group();

    // 1. City Opening Background
    this.createCityBackground();

    // 2. Office Background (Hidden initially)
    this.createOfficeBackground();
    this.officeBgGroup.setVisible(false);
    this.normalGroup.setVisible(false);
    this.trueViewGroup.setVisible(false);

    // Subscribe to Zustand True View state updates
    this.unsubscribeStore = useGameStore.subscribe((state) => {
      if (this.isOfficeVisible) {
        this.updateTrueViewVisibility(state.trapezohedron.trueViewActive);
      }
    });

    // 3. Trigger initial monologue (Laurence Lindner Arkham City presentation)
    this.time.delayedCall(400, () => {
      useGameStore.getState().setDialog({
        textKey: 'intro.monologue_city',
        onComplete: () => this.transitionToOffice(),
      });
    });
  }

  private createCityBackground() {
    if (this.textures.exists('city_night') && this.textures.get('city_night').key !== '__MISSING') {
      const cityImg = this.add.image(640, 360, 'city_night').setDisplaySize(1280, 720);
      this.cityBgGroup.add(cityImg);
    } else {
      // Procedural fallback background for city at night
      const g = this.add.graphics();
      g.fillStyle(0x050a14, 1);
      g.fillRect(0, 0, 1280, 720);

      // Distant Arkham buildings silhouette
      g.fillStyle(0x020409, 1);
      g.fillRect(100, 320, 180, 400);
      g.fillRect(250, 240, 220, 480);
      g.fillRect(450, 380, 160, 340);
      g.fillRect(680, 280, 260, 440);
      g.fillRect(920, 350, 200, 370);

      // Fog layer
      g.fillStyle(0x1e293b, 0.25);
      g.fillRect(0, 500, 1280, 220);

      this.cityBgGroup.add(g);

      const cityText = this.add
        .text(640, 360, "ARKHAM — MASSACHUSETTS, 1926", {
          fontFamily: 'Cinzel, serif',
          fontSize: '32px',
          color: '#64748b',
        })
        .setOrigin(0.5);
      this.cityBgGroup.add(cityText);
    }
  }

  private createOfficeBackground() {
    if (
      this.textures.exists('office_interior') &&
      this.textures.get('office_interior').key !== '__MISSING'
    ) {
      const officeImg = this.add.image(640, 360, 'office_interior').setDisplaySize(1280, 720);
      this.officeBgGroup.add(officeImg);
    } else {
      // Procedural interior office background fallback
      const graphics = this.add.graphics();

      // Floor & Wall
      graphics.fillStyle(0x140d07, 1);
      graphics.fillRect(0, 520, 1280, 200);
      graphics.fillStyle(0x0a101d, 1);
      graphics.fillRect(0, 0, 1280, 520);

      // Gothic Window
      graphics.fillStyle(0x020617, 1);
      graphics.fillRect(800, 80, 320, 360);
      graphics.lineStyle(2, 0x334155, 1);
      graphics.strokeRect(800, 80, 320, 360);
      graphics.lineBetween(960, 80, 960, 440);

      // Bookshelf
      graphics.fillStyle(0x271910, 1);
      graphics.fillRect(80, 100, 260, 420);

      // Mahogany Desk
      graphics.fillStyle(0x3f2314, 1);
      graphics.fillRect(420, 380, 340, 140);
      graphics.lineStyle(2, 0x5c351e, 1);
      graphics.strokeRect(420, 380, 340, 140);

      this.officeBgGroup.add(graphics);
    }

    // True View Layer tint
    const trueG = this.add.graphics();
    trueG.fillStyle(0x3b0764, 0.25);
    trueG.fillRect(0, 0, 1280, 720);
    this.trueViewGroup.add(trueG);
  }

  private transitionToOffice() {
    this.cameras.main.fadeOut(800, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      // Hide city, show office
      this.isOfficeVisible = true;
      this.cityBgGroup.setVisible(false);
      this.officeBgGroup.setVisible(true);
      this.normalGroup.setVisible(true);

      const isTrueView = useGameStore.getState().trapezohedron.trueViewActive;
      this.updateTrueViewVisibility(isTrueView);

      // Auto-save game state on arriving at desk
      useGameStore.getState().saveGame();

      // Camera Fade In & Second Monologue on desk
      this.cameras.main.fadeIn(1000, 0, 0, 0);
      this.time.delayedCall(400, () => {
        useGameStore.getState().setDialog({
          textKey: 'intro.monologue_office',
        });
      });
    });
  }

  private updateTrueViewVisibility(active: boolean) {
    this.trueViewGroup.setVisible(active);
  }

  destroy() {
    if (this.unsubscribeStore) {
      this.unsubscribeStore();
    }
  }
}