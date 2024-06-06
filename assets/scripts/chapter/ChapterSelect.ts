import { _decorator, AudioClip, Button, Component, director, EventKeyboard, Input, input, KeyCode, Label, Node } from "cc";
import { GlobalSettings } from "../settings/GlobalSettings";
import { SceneTransition } from "../ui/SceneTransition";
import { ButtonIconOutline } from "../ui/button/ButtonIcon";
const { ccclass, property } = _decorator;

@ccclass("ChapterSelect")
export class ChapterSelect extends Component {
    @property(SceneTransition)
    sceneTransition: SceneTransition

    @property(Node)
    chapterContainer: Node = null;

    @property(AudioClip)
    bgm: AudioClip

    // Buttons
    @property(Button)
    backButton: Button
    @property(Button)
    settingsButton: Button

    private globalSettings: GlobalSettings



    // # Lifecycle
    onLoad() {
        this.globalSettings = GlobalSettings.getInstance();
        this.loadChapters();

        // Buttons
        this.backButton.node.on(Button.EventType.CLICK, () => this.loadScene("IntroScreen"), this);
        this.settingsButton.node.on(Button.EventType.CLICK, () => this.loadScene("SettingsScreen"), this);

        // Key Down
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);

        // Preload SongSelect
        director.preloadScene("SongSelect", (error) => {
            if (error) {
                console.log("SCENE::SONGSELECT: Failed");
                return;
            }
            console.log("SCENE::SONGSELECT: Preloaded");
        });
    }

    start() {
        this.globalSettings.audioManager.playBGM(this.bgm);
    }

    onKeyDown(event: EventKeyboard) {
        switch (event.keyCode) {
            case KeyCode.KEY_S:
                this.globalSettings.audioManager.playSFX(this.settingsButton.getComponent(ButtonIconOutline).sfx);
                this.loadScene("SettingsScreen");
                break;
            case KeyCode.ESCAPE:
                this.globalSettings.audioManager.playSFX(this.backButton.getComponent(ButtonIconOutline).sfx);
                this.loadScene("IntroScreen");
                break;
            default:
                break;
        }
    }



    // # Functions
    loadChapters() {
        this.globalSettings.chapters.sort((a, b) => a.index - b.index);
        this.globalSettings.chapters.forEach(chapterData => {
            this.createChapterButton(chapterData);
        });
    }

    createChapterButton(chapterData: any) {
        const chapterButton = new Node();
        const buttonComponent = chapterButton.addComponent(Button);
        const labelComponent = chapterButton.addComponent(Label);
        labelComponent.string = chapterData.name;

        buttonComponent.node.on(Button.EventType.CLICK, () => {
            this.globalSettings.selectedChapterId = chapterData.id;
            this.sceneTransition.fadeOutAndLoadScene("SongSelect");
        });
        this.chapterContainer.addChild(chapterButton);
    }

    loadScene(sceneName: string) {
        this.globalSettings.lastSceneName = director.getScene().name;
        this.globalSettings.audioManager.fadeOutBGM(0.5);
        this.sceneTransition.fadeOutAndLoadScene(sceneName);
    }
}