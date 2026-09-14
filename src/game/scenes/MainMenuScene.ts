import Phaser from 'phaser';
import { useGameStore } from '../../store/useGameStore';
import i18n from '../../i18n';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super('MainMenu');
  }

  preload() {
    if (!this.cache.audio.exists('menu_music')) {
      this.load.audio('menu_music', '/assets/menu_theme.mp3');
    }
  }

  create() {
    useGameStore.getState().setScene('MainMenu');
    this.cameras.main.setBackgroundColor('#05070a');
    this.cameras.main.fadeIn(1000, 0, 0, 0);

    // Audio handling
    const playMenuMusic = () => {
      try {
        const soundManager = this.sound as Phaser.Sound.WebAudioSoundManager;
        if (soundManager.context && soundManager.context.state === 'suspended') {
          soundManager.context.resume();
        }

        if (!this.sound.get('menu_music')) {
          const music = this.sound.add('menu_music', { volume: 0.35, loop: true });
          music.play();
        }
      } catch (e) {
        console.warn('Audio play restricted:', e);
      }
    };

    playMenuMusic();
    this.input.once('pointerdown', () => playMenuMusic());

    // Language selector
    const langs = ['FR', 'EN', 'AR'];
    langs.forEach((langCode, index) => {
      const btnLang = this.add
        .text(1150 + index * 45, 40, langCode, {
          fontFamily: 'Share Tech Mono, monospace',
          fontSize: '18px',
          color: i18n.language.toUpperCase() === langCode ? '#e2e8f0' : '#475569',
        })
        .setOrigin(0.5)
        .setInteractive({ useHandCursor: true });

      btnLang.on('pointerdown', () => {
        i18n.changeLanguage(langCode.toLowerCase());
        this.scene.restart();
      });
    });

    // Title
    const titleText = this.add
      .text(640, 200, "M A E L S T R O M", {
        fontFamily: 'Cinzel, serif',
        fontSize: '54px',
        color: '#f8fafc',
      })
      .setOrigin(0.5);

    this.add
      .text(640, 260, "— L ' É V E I L —", {
        fontFamily: 'Share Tech Mono, monospace',
        fontSize: '18px',
        color: '#94a3b8',
      })
      .setOrigin(0.5);

    // Menu options
    const store = useGameStore.getState();
    const hasSave = store.hasSave();

    const menuOptions = [
      {
        text: i18n.t('menu.newGame'),
        action: () => this.startNewGame(),
      },
      {
        text: i18n.t('menu.continue'),
        action: () => this.continueSavedGame(),
        disabled: !hasSave,
      },
      {
        text: i18n.t('menu.settings'),
        action: () => {
          store.startDialogue({
            speaker: 'RÉGLAGES',
            text: 'Configuration : Rendu 16:9.\nSystème de sauvegarde automatique activé.',
          });
        },
      },
    ];

    let startY = 360;
    menuOptions.forEach((option, index) => {
      const color = option.disabled ? '#334155' : '#cbd5e1';
      const btn = this.add
        .text(640, startY + index * 60, option.text, {
          fontFamily: 'Share Tech Mono, monospace',
          fontSize: '22px',
          color: color,
        })
        .setOrigin(0.5);

      if (!option.disabled) {
        btn.setInteractive({ useHandCursor: true });
        btn.on('pointerover', () => {
          btn.setColor('#ffffff');
          btn.setScale(1.05);
        });
        btn.on('pointerout', () => {
          btn.setColor('#cbd5e1');
          btn.setScale(1.0);
        });
        btn.on('pointerdown', () => option.action());
      }
    });

    // Footer info
    this.add
      .text(640, 680, "Université de Miskatonic — Arkham, Massachusetts, 1928", {
        fontFamily: 'Share Tech Mono',
        fontSize: '14px',
        color: '#475569',
      })
      .setOrigin(0.5);
  }

  startNewGame() {
    useGameStore.getState().resetGame();
    this.sound.stopAll();
    this.cameras.main.fadeOut(800, 0, 0, 0);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('IntroSequence');
    });
  }

  continueSavedGame() {
    const store = useGameStore.getState();
    if (store.loadGame()) {
      const targetScene = store.currentScene || 'ProfessorOffice';
      this.sound.stopAll();
      this.cameras.main.fadeOut(800, 0, 0, 0);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        this.scene.start(targetScene);
      });
    } else {
      store.startDialogue({
        speaker: 'SYSTÈME',
        text: 'Aucune sauvegarde locale trouvée.',
      });
    }
  }
}