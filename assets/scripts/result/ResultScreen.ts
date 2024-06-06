import { _decorator, Button, Component, EventKeyboard, KeyCode, RichText, tween, UIOpacity } from "cc";
import { GlobalSettings } from "../settings/GlobalSettings";
import { DatabaseManager } from "../lib/DatabaseManager";
import { SceneTransition } from "../ui/SceneTransition";
const { ccclass, property } = _decorator;

@ccclass("ResultScreen")
export class ResultScreen extends Component {
    @property(SceneTransition)
    sceneTransition: SceneTransition

    // Buttons
    @property(Button)
    backButton: Button | null = null
    @property(Button)
    retryButton: Button | null = null

    @property(RichText)
    unlockText: RichText

    @property(RichText)
    SongName: RichText

    @property(RichText)
    SongArtist: RichText

    @property(RichText)
    SongScore: RichText

    @property(RichText)
    SongAccuracy: RichText

    private globalSettings: GlobalSettings
    private unlockedSongIds: string[] = []
    private unlockedLogs: any[] = []


    // # Lifecycle
    onLoad() {
        this.globalSettings = GlobalSettings.getInstance();
        const selectedSong = this.globalSettings.selectedSong;

        // Buttons
        this.backButton.node.on("click", () => this.back());
        if (!selectedSong.anomaly) {
            this.retryButton.node.on("click", () => this.retry());
        } else{
            this.retryButton.getComponentInChildren(Button).interactable = false;
        }

        const songId = selectedSong.id;
        this.globalSettings.patchUserData({ key: "songs", id: songId, data: {
            score: 900000,
            accuracy: 100.00,
        }})
        const { unlockedSongIds, unlockedLogs } = this.globalSettings.unlockManager.checkUnlocks();
        this.unlockedSongIds = unlockedSongIds;
        this.unlockedLogs = unlockedLogs;
        unlockedSongIds.forEach(songId => {
            this.globalSettings.patchUserData({ key: "songs", id: songId, data: { unlocked: true } });
        });
        
        unlockedLogs.forEach(log => {
            this.globalSettings.patchUserData({ key: "logs", id: log.id, data: { unlock_level: log.unlock_level, has_read: false } });
        });

        // Save patched log data to database
        DatabaseManager.updateData();
    }

    start() {
        this.showUnlockedItems(this.unlockedSongIds, this.unlockedLogs);
        // Show result info
        this.showResultInfo(this.globalSettings.selectedSong.id);
    }

    onKeyDown(event: EventKeyboard) {
        switch (event.keyCode) {
            case KeyCode.ESCAPE:
                this.back();
                break;
            default:
                break;
        }
    }



    // # Functions
    showResultInfo(SongId: string){
        const tweenResultInfo = () => {
            const songData = this.globalSettings.songs.find(song => SongId === song.id);
            this.SongName.string = `SONG NAME: ${songData.name}`;
            this.SongArtist.string = `Artist: ${songData.artist}`;

            const songRecord = this.globalSettings.userData.songs[songData.id];
            const score = songRecord?.score !== undefined ? songRecord.score.toString().padStart(6, "0") : "000000";
            const accuracy = songRecord?.accuracy !== undefined ? songRecord.accuracy.toFixed(2) : "00.00";
            this.SongScore.string = `SCORE: ${score}`;
            this.SongAccuracy.string = `ACCURACY: ${accuracy}%`;

            tween(this.SongName.getComponent(UIOpacity))
                .to(0.5, { opacity: 255 }, { easing: "smooth" })
                .start();
            tween(this.SongArtist.getComponent(UIOpacity))
                .to(0.5, { opacity: 255 }, { easing: "smooth" })
                .start();
            tween(this.SongScore.getComponent(UIOpacity))
                .to(0.5, { opacity: 255 }, { easing: "smooth" })
                .start();
            tween(this.SongAccuracy.getComponent(UIOpacity))
                .to(0.5, { opacity: 255 }, { easing: "smooth" })
                .start();
        }
        tweenResultInfo();
    }
    showUnlockedItems(unlockedSongIds: string[], unlockedLogs: any[]) {
        const songIdsCopy = [...unlockedSongIds];
        const tweenNextSong = () => {
            if (songIdsCopy.length > 0) {
                const songId = songIdsCopy.shift();
                const songName = this.globalSettings.songs.find(song => songId === song.id).name;
                this.unlockText.string = `SONG UNLOCKED: ${songName}`;
                tween(this.unlockText.getComponent(UIOpacity))
                    .to(0.15, { opacity: 255 }, { easing: "smooth" })
                    .delay(4)
                    .to(0.15, { opacity: 0 }, { easing: "smooth" })
                    .call(tweenNextSong)
                    .start();
            } else {
                tweenNextLog();
            }
        }

        const tweenNextLog = () => {
            if (unlockedLogs.length > 0) {
                const log = unlockedLogs.shift();
                this.unlockText.string = `LOG UNLOCKED: ${log.id}, LEVEL ${log.unlock_level}`;
                tween(this.unlockText.getComponent(UIOpacity))
                    .to(0.5, { opacity: 255 }, { easing: "smooth" })
                    .delay(4)
                    .to(0.5, { opacity: 0 }, { easing: "smooth" })
                    .call(tweenNextLog)
                    .start();
            }
        };

        tweenNextSong();
    }

    retry() {
        this.sceneTransition.fadeOutAndLoadScene("ChartPlayer");
    }

    back() {
        this.sceneTransition.fadeOutAndLoadScene("SongSelect");
    }
}