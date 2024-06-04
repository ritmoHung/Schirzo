import { _decorator, Button, Component } from "cc";
import { GlobalSettings } from "../settings/GlobalSettings";
import { DatabaseManager } from "../lib/DatabaseManager";
import { SceneTransition } from "../ui/SceneTransition";
const { ccclass, property } = _decorator;

@ccclass("ResultScreen")
export class ResultScreen extends Component {
    @property(SceneTransition)
    sceneTransition: SceneTransition

    @property(Button)
    backButton: Button | null = null

    @property(Button)
    retryButton: Button | null = null

    private globalSettings: GlobalSettings



    // # Lifecycle
    onLoad() {
        this.globalSettings = GlobalSettings.getInstance();

        this.retryButton.node.on("click", () => this.retry());
        this.backButton.node.on("click", () => this.back());

        const songId = this.globalSettings.selectedSong.id;
        this.globalSettings.userData.songs[songId] = {
            score: 1000000,
            accuracy: 100.00,
        };
        const { songIds, logIds } = this.globalSettings.unlockManager.checkUnlocks();
        songIds.forEach(songId => {
            if (!this.globalSettings.userData.songs[songId]) {
                this.globalSettings.userData.songs[songId] = {};
            }
            this.globalSettings.userData.songs[songId].unlocked = true;
        });
        
        logIds.forEach(logId => {
            if (!this.globalSettings.userData.logs[logId]) {
                this.globalSettings.userData.logs[logId] = {};
            }
            this.globalSettings.userData.logs[logId].unlocked = true;
        });
        DatabaseManager.setUserData(this.globalSettings.user.uid, this.globalSettings.userData);
    }



    // # Functions
    retry() {
        this.sceneTransition.fadeOutAndLoadScene("ChartPlayer");
    }

    back() {
        this.sceneTransition.fadeOutAndLoadScene("SongSelect");
    }
}