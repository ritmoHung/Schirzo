import { _decorator, Component, Sprite, UIOpacity } from "cc";
import { GlobalSettings } from "../settings/GlobalSettings";
import { SceneTransition } from "../ui/SceneTransition";
import { DatabaseManager } from "../lib/DatabaseManager";
const { ccclass, property } = _decorator;

@ccclass("Prelude")
export class Prelude extends Component {
    @property(SceneTransition)
    sceneTransition: SceneTransition

    @property(Sprite)
    prelude: Sprite

    @property(UIOpacity)
    uiOpacity: UIOpacity



    // # Lifecycle
    start() {
        this.scheduleOnce(() => {
            const globalSettings = GlobalSettings.getInstance();
            globalSettings.setUserData({ key: "isNewPlayer", data: false });
            DatabaseManager.updateData();

            this.sceneTransition.fadeOutAndLoadScene("ChapterSelect");
        }, 6);
    }
}