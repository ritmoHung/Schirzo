import { AudioClip, AudioSource, tween } from "cc";
import { GlobalSettings } from "./GlobalSettings";

export class AudioManager {
    private globalSettings: GlobalSettings;
    private bgmAudioSource: AudioSource = new AudioSource();
    private sfxAudioSource: AudioSource = new AudioSource();
    
    
    
    // # Lifecycle
    constructor(globalSettings: GlobalSettings) {
        this.globalSettings = globalSettings;
    }



    // # Functions
    // # BGM
    // Play next BGM immediately
    public playBGM(clip: AudioClip, loop: boolean = true) {
        if (clip) {
            this.bgmAudioSource.stop();
            this.bgmAudioSource.clip = clip;
            this.bgmAudioSource.loop = loop;
            this.bgmAudioSource.volume = this.globalSettings.musicVolume;
            this.bgmAudioSource.play();
        } else {
            console.warn("AUDIO::BGM: Clip is not provided");
        }
    }

    // Fade in current BGM
    public fadeIn(duration: number = 1) {
        if (!this.bgmAudioSource.playing) {
            this.bgmAudioSource.play();
        }

        tween(this.bgmAudioSource)
            .to(duration, { volume: this.globalSettings.musicVolume }, { easing: "quadIn" })
            .start();
    }
    // Stop current BGM immediately; fade in next BGM
    public fadeInBGM(clip: AudioClip, duration: number = 1, loop: boolean = true) {
        if (clip) {
            this.bgmAudioSource.stop();
            this.bgmAudioSource.clip = clip;
            this.bgmAudioSource.loop = loop;

            this.bgmAudioSource.volume = 0;
            this.bgmAudioSource.play();
            tween(this.bgmAudioSource)
                .to(duration, { volume: this.globalSettings.musicVolume }, { easing: "quadIn" })
                .start();
        } else {
            console.warn("AUDIO::BGM: Clip is not provided");
        }
    }

    // Stop current BGM immediately
    public stopBGM() {
        this.bgmAudioSource.stop();
    }

    // Fade out current BGM
    public fadeOut(duration: number = 1) {
        tween(this.bgmAudioSource)
            .to(duration, { volume: 0 }, { easing: "quadOut" })
            .start();
    }
    // Fade out and stop current BGM
    public fadeOutBGM(duration: number = 1) {
        tween(this.bgmAudioSource)
            .to(duration, { volume: 0 }, { easing: "quadOut" })
            .call(() => {
                this.bgmAudioSource.stop();
            })
            .start();
    }

    // Transition between current and next BGM
    public transitionBGM(clip: AudioClip, fadeOutDuration: number = 0.5, fadeInDuration: number = 0.5, loop: boolean = true) {
        tween(this.bgmAudioSource)
            .to(fadeOutDuration, { volume: 0 }, { easing: "quadOut" })
            .call(() => {
                this.fadeInBGM(clip, fadeInDuration, loop);
            })
            .start();
    }

    // # SFX
    public playSFX(clip: AudioClip) {
        if (clip) {
            this.sfxAudioSource.playOneShot(clip, this.globalSettings.sfxVolume);
        } else {
            console.log("AUDIO::SFX: Clip is not provided");
        }
    }
}