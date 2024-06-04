import { _decorator, Button, Component } from "cc";
import { GlobalSettings } from "../settings/GlobalSettings";
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

        this.globalSettings.unlockManager.checkUnlocks();
    }



    // # Functions
    retry() {
        this.sceneTransition.fadeOutAndLoadScene("ChartPlayer");
    }

    back() {
        this.sceneTransition.fadeOutAndLoadScene("SongSelect");
    }
}