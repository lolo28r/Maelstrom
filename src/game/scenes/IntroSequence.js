import Phaser from 'phaser';
import { useGameStore } from '../../store/useGameStore';

export class IntroSequence extends Phaser.Scene {
  constructor() {
    super('IntroSequence');
  }

  preload() {
    this.load.audio('intro_theme', '/assets/intro.mp3');
  }

  create() {
    this.cameras.main.setBackgroundColor('#000000');

    // Création d'une texture SVG en mémoire pour le bouton Plein Écran
    const svgIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#888888" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
      </svg>
    `;
    const blob = new Blob([svgIcon], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    this.load.image('fullscreen_icon', url);
    this.load.once('complete', () => {
      this.createFullscreenButton();
    });
    this.load.start();

    // Lancement de la musique d'ambiance
    const music = this.sound.add('intro_theme', { volume: 0, loop: false });
    music.play();
    this.tweens.add({ targets: music, volume: 0.5, duration: 3000 });

    this.time.delayedCall(2000, () => {
      this.askQuestion1(music);
    });
  }

  createFullscreenButton() {
    const fsBtn = this.add.image(1230, 40, 'fullscreen_icon')
      .setInteractive({ useHandCursor: true })
      .setScale(1.2);

    fsBtn.on('pointerover', () => fsBtn.setTint(0xffffff));
    fsBtn.on('pointerout', () => fsBtn.clearTint());
    fsBtn.on('pointerdown', () => {
      if (this.scale.isFullscreen) {
        this.scale.stopFullscreen();
      } else {
        this.scale.startFullscreen();
      }
    });
  }

  askQuestion1(music) {
    this.showDialogue(
      "Vous êtes-vous déjà demandé quels sont les sombres secrets que renferme notre univers ?",
      () => { this.askQuestion2(music); }
    );
  }

  askQuestion2(music) {
    this.showDialogue(
      "Pensez-vous réellement que nous sommes en sécurité... seuls sur une boule géante dans le vide cosmique ?",
      () => { this.showInteractiveChoice(music); }
    );
  }

  showDialogue(textString, onCompleteCallback) {
    const textObj = this.add.text(640, 360, textString, {
      fontFamily: 'Special Elite',
      fontSize: '26px',
      color: '#ffffff',
      align: 'center',
      wordWrap: { width: 900 }
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: textObj,
      alpha: 1,
      duration: 1500,
      hold: 3500,
      yoyo: true,
      onComplete: () => {
        textObj.destroy();
        onCompleteCallback();
      }
    });
  }

  showInteractiveChoice(music) {
    const questionObj = this.add.text(640, 260, "Face à l'inconnu, quelle est votre nature profonde ?", {
      fontFamily: 'Special Elite',
      fontSize: '24px',
      color: '#cccccc',
      align: 'center',
      wordWrap: { width: 900 }
    }).setOrigin(0.5).setAlpha(0);

    const btn1 = this.add.text(640, 380, "1. Je crois en la science, en la logique et en ce qui se mesure.", {
      fontFamily: 'Special Elite',
      fontSize: '20px',
      color: '#888888',
      align: 'center'
    }).setOrigin(0.5).setAlpha(0).setInteractive({ useHandCursor: true });

    const btn2 = this.add.text(640, 460, "2. Je sens depuis longtemps que des forces invisibles régissent notre monde.", {
      fontFamily: 'Special Elite',
      fontSize: '20px',
      color: '#888888',
      align: 'center'
    }).setOrigin(0.5).setAlpha(0).setInteractive({ useHandCursor: true });

    this.tweens.add({
      targets: [questionObj, btn1, btn2],
      alpha: 1,
      duration: 1500
    });

    btn1.on('pointerover', () => btn1.setColor('#ffffff'));
    btn1.on('pointerout', () => btn1.setColor('#888888'));
    btn1.on('pointerdown', () => {
      useGameStore.getState().increaseConsciousness(0);
      this.resolveChoice("Une belle illusion pour se rassurer...", questionObj, btn1, btn2, music);
    });

    btn2.on('pointerover', () => btn2.setColor('#ffffff'));
    btn2.on('pointerout', () => btn2.setColor('#888888'));
    btn2.on('pointerdown', () => {
      useGameStore.getState().increaseConsciousness(5);
      this.resolveChoice("Votre esprit est déjà poreux aux murmures...", questionObj, btn1, btn2, music);
    });
  }

  resolveChoice(reactionText, qObj, b1, b2, music) {
    this.tweens.add({
      targets: [qObj, b1, b2],
      alpha: 0,
      duration: 800,
      onComplete: () => {
        qObj.destroy();
        b1.destroy();
        b2.destroy();

        const reactionObj = this.add.text(640, 360, reactionText, {
          fontFamily: 'Special Elite',
          fontSize: '26px',
          color: '#ffffff',
          align: 'center'
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
          targets: reactionObj,
          alpha: 1,
          duration: 1200,
          hold: 2500,
          yoyo: true,
          onComplete: () => {
            reactionObj.destroy();
            this.showCreditsAndTitle(music);
          }
        });
      }
    });
  }

  showCreditsAndTitle(music) {
    const credit1 = this.add.text(640, 320, 'Écrit et imaginé par Laurien', {
      fontFamily: 'Special Elite',
      fontSize: '24px',
      color: '#cccccc'
    }).setOrigin(0.5).setAlpha(0);

    const credit2 = this.add.text(640, 390, 'Avec l\'aide de Gemini', {
      fontFamily: 'Special Elite',
      fontSize: '20px',
      color: '#888888'
    }).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: [credit1, credit2],
      alpha: 1,
      duration: 1500,
      hold: 2500,
      yoyo: true,
      onComplete: () => {
        const bigTitle = this.add.text(640, 360, 'M A E L S T R O M', {
          fontFamily: 'Special Elite',
          fontSize: '64px',
          color: '#ffffff'
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
          targets: bigTitle,
          alpha: 1,
          duration: 2000,
          hold: 2000,
          onComplete: () => {
            music.stop();
            this.cameras.main.fadeOut(400, 0, 0, 0);
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
              this.startAct1();
            });
          }
        });
      }
    });
  }

  startAct1() {
    console.log("Fin de l'intro interactive ! Lancement de l'Acte 1...");
  }
}