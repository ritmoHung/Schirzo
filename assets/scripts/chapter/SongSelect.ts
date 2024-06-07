import { _decorator, AudioClip, Button, Component, director, EventKeyboard, Input, input, KeyCode, Node, resources, RichText, Sprite, SpriteFrame, tween, UIOpacity } from "cc";
import { GlobalSettings } from "../settings/GlobalSettings";
import { SceneTransition } from "../ui/SceneTransition";
import { BaseButton } from "../ui/button/BaseButton";
import { ButtonIconOutline } from "../ui/button/ButtonIcon";
const { ccclass, property } = _decorator;

@ccclass("SongSelect")
export class SongSelect extends Component {
    @property(SceneTransition)
    sceneTransition: SceneTransition

    @property(AudioClip)
    enterSFX: AudioClip
    @property(AudioClip)
    errorSFX: AudioClip

    // Song Info
    @property(RichText)
    songTitle: RichText

    @property(RichText)
    songArtist: RichText

    @property(RichText)
    songScore: RichText

    @property(RichText)
    songAccuracy: RichText

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

    // UIOpacity
    @property(UIOpacity)
    notificationDot: UIOpacity

    private globalSettings: GlobalSettings
    private songs: any = []
    private selectedSongIndex: number = 0
    private keyPressed: boolean = false;
    private jacketCache: { [key: string]: SpriteFrame } = {};
    private previewCache: { [key: string]: AudioClip } = {};



    // # Lifecycle
    onLoad() {
        this.globalSettings = GlobalSettings.getInstance();
        this.loadSongs(this.globalSettings.selectedChapterId);

        // Song Info
        this.selectedSongIndex = parseInt(localStorage.getItem(`${this.globalSettings.selectedChapterId}SelectedSongIndex`) || "0");
        this.setSongInfo(this.selectedSongIndex);

        // Buttons
        const logs = this.globalSettings.getUserData("logs");
        if (this.hasUnreadLogs(logs)) {
            this.notificationDot.opacity = 255;
        }
        this.prevButton.node.on(Button.EventType.CLICK, this.selectPreviousSong, this);
        this.nextButton.node.on(Button.EventType.CLICK, this.selectNextSong, this);
        this.backButton.node.on(Button.EventType.CLICK, () => this.loadScene("ChapterSelect"), this);
        this.logsButton.node.on(Button.EventType.CLICK, () => this.loadScene("ChapterLogs"), this);
        this.settingsButton.node.on(Button.EventType.CLICK, () => this.loadScene("SettingsScreen"), this);
        this.songJacket.node.on(Node.EventType.TOUCH_END, this.loadChartPlayerScene, this)

        // Key Down
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.on(Input.EventType.KEY_PRESSING, this.onKeyPressing, this);

        // Preload ChartPlayer
        director.preloadScene("ChartPlayer", (error) => {
            if (error) {
                console.log("SCENE::CHARTPLAYER: Failed");
                return;
            }
            console.log("SCENE::CHARTPLAYER: Preloaded");
        });
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
            case KeyCode.KEY_L:
                this.globalSettings.audioManager.playSFX(this.logsButton.getComponent(ButtonIconOutline).sfx);
                this.loadScene("ChapterLogs");
                break;
            case KeyCode.KEY_S:
                this.globalSettings.audioManager.playSFX(this.settingsButton.getComponent(ButtonIconOutline).sfx);
                this.loadScene("SettingsScreen");
                break;
            case KeyCode.ENTER:
            case KeyCode.SPACE:
                this.loadChartPlayerScene();
                break;
            case KeyCode.ESCAPE:
                this.globalSettings.audioManager.playSFX(this.backButton.getComponent(ButtonIconOutline).sfx);
                this.loadScene("ChapterSelect");
                break;
            default:
                break;
        }
    }
    onKeyPressing(event: EventKeyboard) {
        if (!this.keyPressed) {
            this.keyPressed = true;
            setTimeout(() => {
                this.keyPressed = false;
            }, 50);

            if (event.keyCode === KeyCode.KEY_A ||
                event.keyCode === KeyCode.ARROW_LEFT ||
                event.keyCode === KeyCode.KEY_D ||
                event.keyCode === KeyCode.ARROW_RIGHT
            ) {
                this.onKeyDown(event);
            }
        }
    }

    onDestroy() {
        this.jacketCache = {}
        this.previewCache = {}
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
        localStorage.setItem(`${this.globalSettings.selectedChapterId}SelectedSongIndex`, songIndex.toString());
        const songData = this.songs[songIndex];
        const songUnlocked = this.isSongUnlocked(songData);

        // Song Info
        this.songTitle.string = songUnlocked ? songData.name : this.getRandomString();
        this.songArtist.string = songUnlocked ? songData.artist : this.getRandomString();

        // Song Scores
        const songRecord = this.globalSettings.userData.songs[songData.id];
        const score = songRecord?.score !== undefined ? songRecord.score.toString().padStart(6, "0") : "000000";
        const accuracy = songRecord?.accuracy !== undefined ? songRecord.accuracy.toFixed(2) : "00.00";
        this.songScore.string = score;
        this.songAccuracy.string = `${accuracy}%`;

        // Song Jacket & Preview Audio
        let sprite: SpriteFrame;
        if (songUnlocked) {
            sprite = await this.getSongJacket(songData.id);

            const previewClip = await this.getSongPreview(songData.id);
            this.globalSettings.audioManager.transitionBGM(previewClip);
        } else {
            sprite = this.jacketLockedSprite;

            this.globalSettings.audioManager.fadeOutBGM(0.5);
        }
        tween(this.songJacket.getComponent(UIOpacity))
                .to(0.1, { opacity: 0 }, { easing: "smooth"})
                .call(() => {
                    this.songJacket.spriteFrame = sprite;
                    tween(this.songJacket.getComponent(UIOpacity))
                        .to(0.1, { opacity: 255 }, { easing: "smooth"})
                        .start();
                })
                .start();
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

    hasUnreadLogs(logs: { [key: string]: any }): boolean {
        for (const logId in logs) {
            const unlockLevel = logs[logId]?.unlock_level || 0;
            if (unlockLevel > 0 && logs[logId]?.has_read === false) {
                return true;
            }
        }
        return false;
    }
    
    loadChartPlayerScene() {
        const songData = this.songs[this.selectedSongIndex];
        const songUnlocked = this.isSongUnlocked(songData);

        if (songUnlocked) {
            this.globalSettings.audioManager.playSFX(this.enterSFX);
            this.globalSettings.selectedSong = { 
                type: "vanilla",
                id: songData.id,
                mode: "gameplay",
                anomaly: false,
            };
            this.loadScene("ChartPlayer");
        } else {
            this.globalSettings.audioManager.playSFX(this.errorSFX);
        }
    }

    loadScene(sceneName: string) {
        this.globalSettings.lastSceneName = director.getScene().name;
        this.globalSettings.audioManager.fadeOutBGM(0.5);
        this.sceneTransition.fadeOutAndLoadScene(sceneName);
    }
}