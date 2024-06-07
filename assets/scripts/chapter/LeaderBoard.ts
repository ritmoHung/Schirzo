import { _decorator, Button, Component, director, EventKeyboard, Input, input, KeyCode, Node, resources, RichText, Sprite, SpriteFrame, tween, UIOpacity } from "cc";
import { GlobalSettings } from "../settings/GlobalSettings";
import { SceneTransition } from "../ui/SceneTransition";
import { BackgroundController } from "../ui/bg/BackgroundController";
import { BaseButton } from "../ui/button/BaseButton";
import { DatabaseManager } from "../lib/DatabaseManager";
const { ccclass, property } = _decorator;

@ccclass("LeaderBoard")
export class LeaderBoard extends Component {
    @property(SceneTransition)
    sceneTransition: SceneTransition

    @property(BackgroundController)
    background: BackgroundController

    // Song Info
    @property(RichText)
    songTitle: RichText

    @property(RichText)
    songArtist: RichText

    // Buttons
    @property(Button)
    prevButton: Button

    @property(Button)
    nextButton: Button

    @property(Button)
    backButton: Button

    @property(RichText)
    ScoreNameList: RichText

    @property(RichText)
    ScoreList: RichText

    private globalSettings: GlobalSettings
    private songs: any = []
    private selectedSongIndex: number = 0
    private keyPressed: boolean = false
    private leaderboard: any = [];

    // # Lifecycle
    onLoad() {
        this.globalSettings = GlobalSettings.getInstance();
        this.background.type = this.globalSettings.selectedChapterId;
        this.loadSongs(this.globalSettings.selectedChapterId);

        // Song Info
        this.selectedSongIndex = parseInt(localStorage.getItem(`${this.globalSettings.selectedChapterId}SelectedSongIndex`) || "0");
        this.setSongInfo(this.selectedSongIndex);

        // Buttons
        this.prevButton.node.on(Button.EventType.CLICK, this.selectPreviousSong, this);
        this.nextButton.node.on(Button.EventType.CLICK, this.selectNextSong, this);
        this.backButton.node.on(Button.EventType.CLICK, this.loadPreviousScene, this);

        // Key Down
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.on(Input.EventType.KEY_PRESSING, this.onKeyPressing, this);
    }

    onDestroy() {

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
            case KeyCode.ESCAPE:
                this.loadPreviousScene();
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
            this.onKeyDown(event);
        }
    }

    
    
    // # Functions
    loadSongs(chapterId: string) {
        this.songs = this.globalSettings.songs.filter(song => song.chapter.id === chapterId);
        this.songs = this.songs.sort((a: any, b: any) => a.chapter.index - b.chapter.index)
    }

    async getLeaderBoard(SongId: string) {
        this.leaderboard = await DatabaseManager.getLeaderBoard(SongId);
        //this.leaderboard = this.leaderboard.sort((a: any, b: any) => a.score - b.score);
    }

    async setSongInfo(songIndex: number) {
        localStorage.setItem(`${this.globalSettings.selectedChapterId}SelectedSongIndex`, songIndex.toString());
        const songData = this.songs[songIndex];
        console.log(songData);
    
        const songUnlocked = this.isSongUnlocked(songData);
        console.log(songData.id);
        
        await this.getLeaderBoard(songData.id).then(() => {
            console.log("Leaderboard");
            console.log(this.leaderboard);
        });
    
        this.songTitle.string = songUnlocked ? songData.name : this.getRandomString();
        this.songArtist.string = songUnlocked ? songData.artist : this.getRandomString();

        if (this.leaderboard) {
            this.ScoreList.string = `Score`;
            this.ScoreNameList.string = `Name`;
            for(const key in this.leaderboard){
                if (this.leaderboard.hasOwnProperty(key)) {
                    this.ScoreList.string += `\n${this.leaderboard[key].score.toString()}`;
                    this.ScoreNameList.string += `\n${this.leaderboard[key].name}`;
                }
            }
        } else {
            this.ScoreList.string = `Nope`;
            this.ScoreNameList.string = `Nope`;
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

    loadPreviousScene() {
        this.globalSettings.audioManager.fadeOutBGM(0.5);
        this.sceneTransition.fadeOutAndLoadScene("SongSelect");
    }
}