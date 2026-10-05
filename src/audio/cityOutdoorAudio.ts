import Phaser from 'phaser';
import { getSfxVolume } from './audioMix';

const FOOTSTEPS = [1, 2, 3, 4].map((index) => `citySnowFootstep${index}`);

export class CityOutdoorAudio {
    private ambience?: Phaser.Sound.BaseSound;
    private footstep?: Phaser.Sound.BaseSound;
    private location?: string;

    constructor(private scene: Phaser.Scene) {}

    static preload(scene: Phaser.Scene) {
        const base = `${import.meta.env.BASE_URL}assets/`;
        if (!scene.cache.audio.exists('cityAmbience')) scene.load.audio('cityAmbience', `${base}streetAmbiance.mp3`);
        FOOTSTEPS.forEach((key, index) => {
            if (!scene.cache.audio.exists(key)) scene.load.audio(key, `${base}snowFootstep${index + 1}.mp3`);
        });
    }

    enter(location: string, outdoors: boolean, streetAmbience = true) {
        if (outdoors) {
            if (streetAmbience) {
                if (!this.ambience) this.ambience = this.scene.sound.add('cityAmbience', { loop: true, volume: getSfxVolume() });
                if (!this.ambience.isPlaying) this.ambience.play();
            } else {
                this.ambience?.stop();
            }
            if (location !== this.location) {
                this.footstep?.stop();
                this.footstep?.destroy();
                this.footstep = this.scene.sound.add(Phaser.Utils.Array.GetRandom(FOOTSTEPS), { volume: getSfxVolume() });
                this.footstep.play();
            }
        } else {
            this.ambience?.stop();
            this.footstep?.stop();
        }
        this.location = location;
    }

    destroy() {
        this.ambience?.stop();
        this.ambience?.destroy();
        this.footstep?.stop();
        this.footstep?.destroy();
    }
}
