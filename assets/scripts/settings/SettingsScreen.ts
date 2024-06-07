import { _decorator, Button, Component, EventKeyboard, Input, input, KeyCode } from "cc";
import { GlobalSettings } from "./GlobalSettings";
import { SceneTransition } from "../ui/SceneTransition";
import { ButtonIconOutline } from "../ui/button/ButtonIcon";
const { ccclass, property } = _decorator;

@ccclass("SettingsScreen")
export class Settings extends Component {
    @property(SceneTransition)
    sceneTransition: SceneTransition
        
    // Buttons
    @property(Button)
    backButton: Button

    private globalSettings: GlobalSettings



    // # Lifecycle
    onLoad() {
        this.globalSettings = GlobalSettings.getInstance();

        // Buttons
        this.backButton.node.on(Button.EventType.CLICK, () => this.loadScene(this.globalSettings.lastSceneName), this);

        // Key Down
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    onKeyDown(event: EventKeyboard) {
        switch (event.keyCode) {
            case KeyCode.ESCAPE:
                this.globalSettings.audioManager.playSFX(this.backButton.getComponent(ButtonIconOutline).sfx);
                this.loadScene(this.globalSettings.lastSceneName)
                break;
            default:
                break;
        }
    }

    
    
    // # Functions
    loadScene(sceneName: string) {
        this.globalSettings.audioManager.fadeOutBGM(0.5);
        this.sceneTransition.fadeOutAndLoadScene(sceneName);
    }
}