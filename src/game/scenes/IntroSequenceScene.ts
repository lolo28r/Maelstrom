import Phaser from 'phaser';
import { useGameStore } from '../../store/useGameStore';
import i18n from '../../i18n';

export class IntroSequenceScene extends Phaser.Scene {
  private userChoices: number[] = [];

  constructor() {
    super('IntroSequence');
  }

  preload() {
    if (!this.cache.audio.exists('intro_theme')) {
      this.load.audio('intro_theme', '/assets/intro.mp3');
    }
    this.load.image('introEarth', '/assets/introEarth.png');
    this.load.image('introGalaxy', '/assets/introGalaxy.png');
    this.load.image('introVoid', '/assets/introVoid.png');
  }

  create() {
    useGameStore.getState().setScene('IntroSequence');
    this.cameras.main.setBackgroundColor('#000000');
    this.cameras.main.fadeIn(1500, 0, 0, 0);
    this.userChoices = [];

    const fsBtn = this.add
      .text(1230, 40, '[  ]', {
        fontFamily: 'Special Elite, cursive',
        fontSize: '20px',
        color: '#475569',
      })
      .setOrigin(1, 0)
      .setInteractive({ useHandCursor: true });

    fsBtn.on('pointerover', () => fsBtn.setColor('#e2e8f0'));
    fsBtn.on('pointerout', () => fsBtn.setColor('#475569'));
    fsBtn.on('pointerdown', () => {
      if (this.scale.isFullscreen) {
        this.scale.stopFullscreen();
      } else {
        this.scale.startFullscreen();
      }
    });

    let music: Phaser.Sound.BaseSound | null = null;
    try {
      if (this.cache.audio.exists('intro_theme')) {
        music = this.sound.add('intro_theme', { volume: 0, loop: false });
        music.play({ seek: 40 });
        this.tweens.add({ targets: music, volume: 0.5, duration: 3000 });
      }
    } catch (e) {
      console.warn('Audio play restricted or unavailable:', e);
    }

    this.time.delayedCall(1500, () => {
      this.askQuestion1(music);
    });
  }

  askQuestion1(music: Phaser.Sound.BaseSound | null) {
    this.showBinaryChoice(
      i18n.t('intro.q1'),
      () => {
        this.userChoices.push(1);
        this.askQuestion2(music);
      },
      () => {
        this.userChoices.push(0);
        this.askQuestion2(music);
      }
    );
  }

  askQuestion2(music: Phaser.Sound.BaseSound | null) {
    this.showBinaryChoice(
      i18n.t('intro.q2'),
      () => {
        this.userChoices.push(1);
        this.askQuestion3(music);
      },
      () => {
        this.userChoices.push(0);
        this.askQuestion3(music);
      }
    );
  }

  askQuestion3(music: Phaser.Sound.BaseSound | null) {
    this.showBinaryChoice(
      i18n.t('intro.q3'),
      () => {
        this.userChoices.push(1);
        this.askQuestion4(music);
      },
      () => {
        this.userChoices.push(0);
        this.askQuestion4(music);
      }
    );
  }

  askQuestion4(music: Phaser.Sound.BaseSound | null) {
    this.showBinaryChoice(
      i18n.t('intro.q4'),
      () => {
        this.userChoices.push(1);
        this.askQuestion5(music);
      },
      () => {
        this.userChoices.push(0);
        this.askQuestion5(music);
      }
    );
  }

  askQuestion5(music: Phaser.Sound.BaseSound | null) {
    this.showBinaryChoice(
      i18n.t('intro.q5'),
      () => {
        this.userChoices.push(1);
        this.evaluateProfileAndProceed(music);
      },
      () => {
        this.userChoices.push(0);
        this.evaluateProfileAndProceed(music);
      }
    );
  }

  showBinaryChoice(questionText: string, onYes: () => void, onNo: () => void) {
    const isRTL = i18n.language === 'ar';

    const qObj = this.add
      .text(640, 280, questionText, {
        fontFamily: 'Special Elite, cursive',
        fontSize: '24px',
        color: '#e2e8f0',
        align: isRTL ? 'right' : 'center',
        wordWrap: { width: 900 },
      })
      .setOrigin(0.5)
      .setAlpha(0);

    const btnYes = this.add
      .text(520, 440, i18n.t('intro.yes'), {
        fontFamily: 'Cinzel, serif',
        fontSize: '22px',
        color: '#94a3b8',
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setInteractive({ useHandCursor: true });

    const btnNo = this.add
      .text(760, 440, i18n.t('intro.no'), {
        fontFamily: 'Cinzel, serif',
        fontSize: '22px',
        color: '#94a3b8',
      })
      .setOrigin(0.5)
      .setAlpha(0)
      .setInteractive({ useHandCursor: true });

    this.tweens.add({
      targets: [qObj, btnYes, btnNo],
      alpha: 1,
      duration: 1500,
    });

    const cleanupAndProceed = (callback: () => void) => {
      this.tweens.add({
        targets: [qObj, btnYes, btnNo],
        alpha: 0,
        duration: 600,
        onComplete: () => {
          qObj.destroy();
          btnYes.destroy();
          btnNo.destroy();
          callback();
        },
      });
    };

    btnYes.on('pointerover', () => btnYes.setColor('#00f0ff'));
    btnYes.on('pointerout', () => btnYes.setColor('#94a3b8'));
    btnYes.on('pointerdown', () => cleanupAndProceed(onYes));

    btnNo.on('pointerover', () => btnNo.setColor('#a855f7'));
    btnNo.on('pointerout', () => btnNo.setColor('#94a3b8'));
    btnNo.on('pointerdown', () => cleanupAndProceed(onNo));
  }

  evaluateProfileAndProceed(music: Phaser.Sound.BaseSound | null) {
    const score = this.userChoices.reduce((a, b) => a + b, 0);
    useGameStore.getState().increaseConsciousness(score * 4);

    let verdictKey = 'intro.verdicts.aveugle';
    if (score >= 4) {
      verdictKey = 'intro.verdicts.fanatique';
    } else if (score === 3) {
      verdictKey = 'intro.verdicts.poreux';
    } else if (score === 2) {
      verdictKey = 'intro.verdicts.lucide';
    } else if (score === 1) {
      verdictKey = 'intro.verdicts.curieux';
    } else {
      verdictKey = 'intro.verdicts.dogmatique';
    }

    const finalVerdictText = i18n.t(verdictKey);

    const verdictObj = this.add
      .text(640, 360, finalVerdictText, {
        fontFamily: 'Cinzel, serif',
        fontSize: '42px',
        color: '#00f0ff',
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({
      targets: verdictObj,
      alpha: 1,
      duration: 1200,
      hold: 2500,
      yoyo: true,
      onComplete: () => {
        verdictObj.destroy();
        this.startCosmicSequence(music);
      },
    });
  }

  startCosmicSequence(music: Phaser.Sound.BaseSound | null) {
    const earthBg = this.add.image(640, 360, 'introEarth').setAlpha(0);
    earthBg.setDisplaySize(1280, 720);

    const galaxyBg = this.add.image(640, 360, 'introGalaxy').setAlpha(0);
    galaxyBg.setDisplaySize(1280, 720);

    const voidBg = this.add.image(640, 360, 'introVoid').setAlpha(0);
    voidBg.setDisplaySize(1280, 720);

    this.tweens.add({
      targets: earthBg,
      alpha: 1,
      duration: 1200,
      hold: 1500,
      yoyo: true,
      onComplete: () => {
        this.time.delayedCall(300, () => {
          this.tweens.add({
            targets: galaxyBg,
            alpha: 1,
            duration: 1200,
            hold: 1500,
            yoyo: true,
            onComplete: () => {
              this.time.delayedCall(300, () => {
                this.tweens.add({
                  targets: voidBg,
                  alpha: 1,
                  duration: 1200,
                  hold: 1500,
                  yoyo: true,
                  onComplete: () => {
                    earthBg.destroy();
                    galaxyBg.destroy();
                    voidBg.destroy();

                    this.time.delayedCall(500, () => {
                      this.showCreditsAndTitle(music);
                    });
                  },
                });
              });
            },
          });
        });
      },
    });
  }

  showCreditsAndTitle(music: Phaser.Sound.BaseSound | null) {
    const credit1 = this.add
      .text(640, 330, i18n.t('intro.credits.author'), {
        fontFamily: 'Special Elite, cursive',
        fontSize: '24px',
        color: '#cbd5e1',
      })
      .setOrigin(0.5)
      .setAlpha(0);

    const credit2 = this.add
      .text(640, 390, i18n.t('intro.credits.ai'), {
        fontFamily: 'Share Tech Mono, monospace',
        fontSize: '18px',
        color: '#64748b',
      })
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({
      targets: [credit1, credit2],
      alpha: 1,
      duration: 1200,
      hold: 2000,
      yoyo: true,
      onComplete: () => {
        const bigTitle = this.add
          .text(640, 360, 'M A E L S T R O M', {
            fontFamily: 'Cinzel, serif',
            fontSize: '56px',
            color: '#ffffff',
          })
          .setOrigin(0.5)
          .setAlpha(0);

        this.tweens.add({
          targets: bigTitle,
          alpha: 1,
          duration: 1800,
          hold: 2000,
          onComplete: () => {
            if (music) music.stop();
            this.cameras.main.fadeOut(800, 0, 0, 0);
            this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
              this.startAct1();
            });
          },
        });
      },
    });
  }

  startAct1() {
    this.scene.start('ProfessorOffice');
  }
}