import { _decorator, Button, Component, EventKeyboard, Input, input, KeyCode, RichText, Slider, Toggle } from "cc";
import { GlobalSettings } from "./GlobalSettings";
import { DatabaseManager } from "../lib/DatabaseManager";
import { SceneTransition } from "../ui/SceneTransition";
import { ButtonIconOutline } from "../ui/button/ButtonIcon";
const { ccclass, property } = _decorator;

const MAX_OFFSET = 0.3;

@ccclass("SettingsScreen")
export class Settings extends Component {
    @property(SceneTransition)
    sceneTransition: SceneTransition

    // Sliders
    @property(Slider)
    flowSpeedSlider: Slider
    @property(Slider)
    chartOffsetSlider: Slider
    @property(Slider)
    musicVolumeSlider: Slider
    @property(Slider)
    sfxVolumeSlider: Slider

    // Toggle
    @property(Toggle)
    devModeToggle: Toggle

    // RichTexts
    @property(RichText)
    flowSpeedText: RichText
    @property(RichText)
    charOffsetText: RichText
    @property(RichText)
    musicVolumeText: RichText
    @property(RichText)
    sfxVolumeText: RichText
        
    // Buttons
    @property(Button)
    backButton: Button

    private globalSettings: GlobalSettings



    // # Lifecycle
    onLoad() {
        this.globalSettings = GlobalSettings.getInstance();

        // Buttons
        this.backButton.node.on(Button.EventType.CLICK, () => this.loadScene(this.globalSettings.lastSceneName), this);

        // Sliders
        this.flowSpeedSlider.progress = this.globalSettings.getUserData("settings", "flow_speed") / 10;
        this.flowSpeedText.string = this.globalSettings.getUserData("settings", "flow_speed").toString();
        this.flowSpeedSlider.node.on("slide", this.onFlowSpeedSliderChange, this);

        let offsetSec = this.globalSettings.getUserData("settings", "offset");
        offsetSec = (typeof offsetSec === "number") ? offsetSec : 0;
        this.chartOffsetSlider.progress = this.getSliderProgressByOffset(offsetSec);
        this.charOffsetText.string = (1000 * offsetSec).toFixed(0);
        this.chartOffsetSlider.node.on("slide", this.onChartOffsetSliderChange, this);
        
        this.musicVolumeSlider.progress = this.globalSettings.musicVolume;
        this.musicVolumeText.string = (10 * this.globalSettings.musicVolume).toFixed(0);
        this.musicVolumeSlider.node.on("slide", this.onMusicVolumeSliderChange, this);

        this.sfxVolumeSlider.progress = this.globalSettings.sfxVolume;
        this.sfxVolumeText.string = (10 * this.globalSettings.sfxVolume).toFixed(0);
        this.sfxVolumeSlider.node.on("slide", this.onSfxVolumeSliderChange, this);

        // Toggle
        this.devModeToggle.isChecked = this.globalSettings.devMode;
        this.devModeToggle.node.on("toggle", this.onToggle, this)

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
    // * Flow Speed
    onFlowSpeedSliderChange() {
        const roundedProgress = this.getFlowSpeedRoundedProgress();
        const string = (roundedProgress * 10).toFixed(1);
        this.flowSpeedText.string = string;
        this.flowSpeedSlider.progress = roundedProgress;
        this.setFlowSpeed(parseFloat(string));
    }
    getFlowSpeedRoundedProgress(): number {
        const progress = Math.max(0.1, this.flowSpeedSlider.progress);
        return (progress !== 0) ? (Math.round(progress * 100) / 100) : 0;
    }
    setFlowSpeed(value: number) {
        this.globalSettings.setUserData({ key: "settings", id: "flow_speed", data: value });
    }

    // * Chart Offset
    onChartOffsetSliderChange() {
        const offset = this.getOffsetBySliderProgress(this.chartOffsetSlider.progress);
        const string = (1000 * offset).toFixed(0);
        this.charOffsetText.string = string;
        this.setChartOffset(parseFloat(offset.toFixed(3)));
    }
    getOffsetBySliderProgress(progress: number): number {
        return ((1 - progress) * (-MAX_OFFSET) + progress * MAX_OFFSET);
    }
    getSliderProgressByOffset(offset: number) {
        return (offset + MAX_OFFSET) / (2 * MAX_OFFSET);
    }
    setChartOffset(value: number) {
        this.globalSettings.setUserData({ key: "settings", id: "offset", data: value });
    }

    // * Music Volume
    onMusicVolumeSliderChange() {
        const progress = this.musicVolumeSlider.progress;
        const string = (progress * 10).toFixed(0);
        this.musicVolumeText.string = string;

        this.globalSettings.musicVolume = parseFloat(string) / 10;
    }

    // * SFX Volume
    onSfxVolumeSliderChange() {
        const progress = this.sfxVolumeSlider.progress;
        const string = (progress * 10).toFixed(0);
        this.sfxVolumeText.string = string;

        this.globalSettings.sfxVolume = parseFloat(string) / 10;
    }

    // * Dev Mode
    onToggle () {
        this.globalSettings.devMode = this.devModeToggle.isChecked;
    }

    // *
    loadScene(sceneName: string) {
        localStorage.setItem("musicVolume", this.globalSettings.musicVolume.toString());
        localStorage.setItem("sfxVolume", this.globalSettings.sfxVolume.toString());
        DatabaseManager.updateData();
        this.globalSettings.audioManager.fadeOutBGM(0.5);
        this.sceneTransition.fadeOutAndLoadScene(sceneName);
    }
}