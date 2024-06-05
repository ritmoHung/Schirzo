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