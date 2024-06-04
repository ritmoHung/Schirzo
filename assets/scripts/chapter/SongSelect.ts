import { _decorator, AudioClip, Button, Component, director, EventKeyboard, Input, input, JsonAsset, KeyCode, Label, Node, resources, RichText, Sprite, SpriteFrame, tween, UIOpacity } from "cc";
import { GlobalSettings } from "../settings/GlobalSettings";
import { SceneTransition } from "../ui/SceneTransition";
import { BackgroundController } from "../ui/bg/BackgroundController";
import { BaseButton } from "../ui/button/BaseButton";
const { ccclass, property } = _decorator;

@ccclass("SongSelect")
export class SongSelect extends Component {
    @property(SceneTransition)
    sceneTransition: SceneTransition

    @property(BackgroundController)
    background: BackgroundController

    // Song Info
    @property(RichText)
    songTitle: RichText

    @property(RichText)
    songArtist: RichText

    @property(Sprite)
    songJacket: Sprite
    @property(SpriteFrame)
    jacketLockedSprite: SpriteFrame

    // Buttons
    @property(Button)
    prevButton: Button

    @property(Button)
    nextButton: Button

    @property(Button)
    backButton: Button

    @property(Button)
    logsButton: Button

    @property(Button)
    settingsButton: Button

    private globalSettings: GlobalSettings
    private songs: any = []
    private selectedSongIndex: number = 0
    private jacketCache: { [key: string]: SpriteFrame } = {};
    private previewCache: { [key: string]: AudioClip } = {};



    // # Lifecycle
    onLoad() {
        this.globalSettings = GlobalSettings.getInstance();
        this.background.spriteName = this.globalSettings.selectedChapterId;
        this.loadSongs(this.globalSettings.selectedChapterId);

        // Song Info
        this.setSongInfo(this.selectedSongIndex);

        // Buttons
        this.prevButton.node.on(Button.EventType.CLICK, this.selectPreviousSong, this);
        this.nextButton.node.on(Button.EventType.CLICK, this.selectNextSong, this);
        this.backButton.node.on(Button.EventType.CLICK, this.loadPreviousScene, this);
        this.logsButton.node.on(Button.EventType.CLICK, this.loadChapterLogsScene, this);
        this.settingsButton.node.on(Button.EventType.CLICK, this.loadChapterLogsScene, this);

        // Key Down
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);

        director.preloadScene("ChartPlayer", (err) => {
            if (err) {
                console.log("SCENE::CHARTPLAYER: Failed");
                return;
            }
            console.log("SCENE::CHARTPLAYER: Preloaded");
        });
    }

    onDestroy() {
        this.jacketCache = {}
        this.previewCache = {}
    }

    onKeyDown(event: EventKeyboard) {
        switch (event.keyCode) {
            case KeyCode.KEY_A:
            case KeyCode.ARROW_LEFT:
                this.globalSettings.audioManager.playSFX(this.prevButton.getComponent(BaseButton).sfx);
                this.selectPreviousSong();
                break;
            case KeyCode.KEY_D:
            case KeyCode.ARROW_RIGHT:
                this.globalSettings.audioManager.playSFX(this.nextButton.getComponent(BaseButton).sfx);
                this.selectNextSong();
                break;
            case KeyCode.ENTER:
            case KeyCode.SPACE:
                this.loadChartPlayerScene();
                break;
            default:
                break;
        }
    }

    
    
    // # Functions
    loadSongs(chapterId: string) {
        this.songs = this.globalSettings.songs.filter(song => song.chapter.id === chapterId);
        this.songs = this.songs.sort((a: any, b: any) => a.chapter.index - b.chapter.index)
    }

    getSongJacket(songId: string): Promise<SpriteFrame> {
        if (this.jacketCache[songId]) {
            return Promise.resolve(this.jacketCache[songId]);
        }

        return new Promise((resolve, reject) => {
            const path = `songs/${songId}/jacket/spriteFrame`;
            resources.load(path, SpriteFrame, (error, spriteFrame) => {
                if (error) {
                    console.error(`SONG::${songId}::JACKET: Failed to load sprite, reason: ${error.message}`);
                    reject(error);
                    return;
                }

                this.jacketCache[songId] = spriteFrame;
                resolve(spriteFrame);
            });
        });
    }

    getSongPreview(songId: string): Promise<AudioClip> {
        if (this.previewCache[songId]) {
            return Promise.resolve(this.previewCache[songId]);
        }

        return new Promise((resolve, reject) => {
            const path = `songs/${songId}/preview`;
            resources.load(path, AudioClip, (error, audioClip) => {
                if (error) {
                    console.error(`SONG::${songId}::PREVIEW: Failed to load audio, reason: ${error.message}`);
                    reject(error);
                    return;
                }

                this.previewCache[songId] = audioClip;
                resolve(audioClip);
            });
        });
    }

    async setSongInfo(songIndex: number) {
        const songData = this.songs[songIndex];
        const songUnlocked = this.isSongUnlocked(songData);

        this.songTitle.string = songUnlocked ? songData.name : this.getRandomString();
        this.songArtist.string = songUnlocked ? songData.artist : this.getRandomString();

        if (songUnlocked) {
            const jacketSprite = await this.getSongJacket(songData.id);
            const previewClip = await this.getSongPreview(songData.id);
            tween(this.songJacket.getComponent(UIOpacity))
                .to(0.15, { opacity: 0 }, { easing: "smooth"})
                .call(() => {
                    this.songJacket.spriteFrame = jacketSprite;
                    tween(this.songJacket.getComponent(UIOpacity))
                        .to(0.15, { opacity: 255 }, { easing: "smooth"})
                        .start();
                })
                .start();
            this.globalSettings.audioManager.transitionBGM(previewClip);
        } else {
            this.songJacket.spriteFrame = this.jacketLockedSprite;
            this.globalSettings.audioManager.fadeOutBGM(0.5);
        }
    }

    getRandomString(): string {
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+[]{}|;:,.<>?";
        let result = "";

        const minLength: number = 5, maxLength: number = 15;
        const charactersLength = characters.length;
        const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }

        return result;
    }

    isSongUnlocked(songData: any) {
        return (
            songData.default_unlocked || 
            (this.globalSettings.userData?.songs && 
             this.globalSettings.userData.songs[songData.id]?.unlocked)
        );
    }

    selectPreviousSong() {
        const length = this.songs.length;
        this.selectedSongIndex !== 0
            ? this.selectedSongIndex--
            : this.selectedSongIndex = length - 1;

        this.setSongInfo(this.selectedSongIndex);
    }

    selectNextSong() {
        const length = this.songs.length;
        this.selectedSongIndex !== length - 1
            ? this.selectedSongIndex++
            : this.selectedSongIndex = 0;

        this.setSongInfo(this.selectedSongIndex);
    }

    loadChartPlayerScene() {
        const songData = this.songs[this.selectedSongIndex];
        const songUnlocked = this.isSongUnlocked(songData);

        if (songUnlocked) {
            this.globalSettings.selectedSong = { type: "vanilla", id: songData.id };
            this.sceneTransition.fadeOutAndLoadScene("ChartPlayer");
        } else {
            // TODO: Do something
        }
    }

    loadPreviousScene() {
        this.globalSettings.audioManager.fadeOutBGM(0.5);
        this.sceneTransition.fadeOutAndLoadScene("ChapterSelect");
    }

    loadChapterLogsScene() {
        this.globalSettings.audioManager.fadeOutBGM(0.5);
        this.sceneTransition.fadeOutAndLoadScene("ChapterLogs");
    }
}