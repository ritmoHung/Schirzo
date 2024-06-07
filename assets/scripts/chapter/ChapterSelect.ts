import { _decorator, AudioClip, AudioSource, Button, Component, director, EventKeyboard, Input, input, instantiate, KeyCode, Label, Node, Prefab, resources, SpriteFrame, tween } from "cc";
import { GlobalSettings } from "../settings/GlobalSettings";
import { SceneTransition } from "../ui/SceneTransition";
import { ButtonChapter } from "../ui/button/ButtonChapter";
import { ButtonIconOutline } from "../ui/button/ButtonIcon";
const { ccclass, property } = _decorator;

@ccclass("ChapterSelect")
export class ChapterSelect extends Component {
    @property(SceneTransition)
    sceneTransition: SceneTransition

    @property(Node)
    chapterContainer: Node = null;

    @property(AudioSource)
    audioSource: AudioSource

    @property(AudioClip)
    bgm: AudioClip

    @property(Prefab)
    buttonChapterPrefab: Prefab

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
        const lunaChapterState = this.globalSettings.getUserData("chapters", "luna")?.progress_state ?? 0;
        if (lunaChapterState !== 2) {
            this.audioSource.play();
        }
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
    async loadChapters() {
        this.globalSettings.chapters.sort((a, b) => a.index - b.index);
        for (const chapterData of this.globalSettings.chapters) {
            // ! For demo purpose only
            for (let i = 0; i < 6; i++) {
                await this.createChapterButton(chapterData);
            }
        }
    }

    async createChapterButton(chapterData: any) {
        const chapterButton = instantiate(this.buttonChapterPrefab);
        const chapterButtonComponent = chapterButton.getComponent(ButtonChapter);

        // Chapter jacket
        const jacket = await this.getChapterJacket(chapterData.id);
        chapterButtonComponent.bgSprite = jacket;

        // Chapter texts
        let cleared: number = 0;
        for (const song of chapterData.songs) {
            const score = this.globalSettings.getUserData("songs", song.id)?.score ?? 0;
            if (score >= 800000) cleared++;
        }
        chapterButtonComponent.cleared = cleared;
        chapterButtonComponent.total = chapterData.songs.length;

        chapterButtonComponent.node.on(Button.EventType.CLICK, () => {
            this.globalSettings.selectedChapterId = chapterData.id;
            this.loadScene("SongSelect");
        });
        this.chapterContainer.addChild(chapterButton);
    }

    getChapterJacket(chapterId: string): Promise<SpriteFrame> {
        return new Promise((resolve, reject) => {
            const path = `chapters/${chapterId}/jacket/spriteFrame`;
            resources.load(path, SpriteFrame, (error, spriteFrame) => {
                if (error) {
                    console.error(`CHAPTER::${chapterId}::JACKET: Failed to load sprite, reason: ${error.message}`);
                    reject(error);
                    return;
                }

                resolve(spriteFrame);
            });
        });
    }
    
    fadeOutBGM(duration: number = 0.5) {
        this.globalSettings.audioManager.fadeOutBGM(duration);
        tween(this.audioSource)
            .to(duration, { volume: 0 }, { easing: "quadOut" })
            .call(() => {
                this.audioSource.stop();
            })
            .start();
    }

    loadScene(sceneName: string) {
        this.globalSettings.lastSceneName = director.getScene().name;
        this.fadeOutBGM();
        this.sceneTransition.fadeOutAndLoadScene(sceneName);
    }
}