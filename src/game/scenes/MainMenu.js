import Phaser from 'phaser';

export class MainMenu extends Phaser.Scene {
  constructor() {
    super('MainMenu');
  }

  preload() {
    this.load.audio('menu_music', '/assets/menu_theme.mp3');
  }

  create() {
    this.cameras.main.setBackgroundColor('#000000');

    // Sécurité audio : si le contexte audio est bloqué par le navigateur, on l'active au premier clic
    if (this.sound.context.state === 'suspended') {
      this.sound.context.resume();
    }

    if (!this.sound.get('menu_music')) {
      const music = this.sound.add('menu_music', { volume: 0.4, loop: true });
      music.play();
    }

    // Centrage parfait basé sur les nouvelles coordonnées 16:9 (640 au lieu de 512)
    this.add.text(640, 180, 'M A E L S T R O M', {
      fontFamily: 'Special Elite',
      fontSize: '64px',
      color: '#ffffff',
    }).setOrigin(0.5);

    const menuOptions = [
      { text: 'Nouvelle Partie', action: () => this.startNewGame() },
      { text: 'Continuer', action: () => this.continueGame() },
      { text: 'Réglages', action: () => this.openSettings() },
      { text: 'Crédits', action: () => this.showCredits() }
    ];

    let startY = 340;
    menuOptions.forEach((option, index) => {
      const btn = this.add.text(640, startY + (index * 65), option.text, {
        fontFamily: 'Special Elite',
        fontSize: '26px',
        color: '#aaaaaa'
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });

      btn.on('pointerover', () => btn.setColor('#ffffff'));
      btn.on('pointerout', () => btn.setColor('#aaaaaa'));
      btn.on('pointerdown', () => option.action());
    });
  }

  startNewGame() {
    this.sound.stopAll();
    this.cameras.main.fadeOut(1000, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('IntroSequence');
    });
  }

  continueGame() { console.log("Continuer..."); }
  openSettings() { console.log("Réglages..."); }
  showCredits() { console.log("Crédits..."); }
}