import { _decorator, Button, Component, EventKeyboard, Input, input, instantiate, JsonAsset, KeyCode, Node, Prefab, resources, ScrollView, SpriteFrame, tween, UIOpacity, Vec3 } from "cc";
import { GlobalSettings } from "../settings/GlobalSettings";
import { SceneTransition } from "../ui/SceneTransition";
import { DatabaseManager } from "../lib/DatabaseManager";
import { ButtonLog } from "../ui/button/ButtonLog";
import { TextLog } from "../ui/text/TextLog";
import { ButtonIconOutline } from "../ui/button/ButtonIcon";
const { ccclass, property } = _decorator;

@ccclass("ChapterLogs")
export class ChapterLogs extends Component {
    @property(SceneTransition)
    sceneTransition: SceneTransition

    // Nodes
    @property(Node)
    tablet: Node
    @property(Node)
    logsLayout: Node
    @property(Node)
    logPanel: Node
    @property(Node)
    logContents: Node

    // Prefabs
    @property(Prefab)
    buttonLogPrefab: Prefab
    @property(Prefab)
    textLogPrefab: Prefab

    // ScrollView
    @property(ScrollView)
    scrollView: ScrollView

    // Buttons
    @property(Button)
    backButton: Button
    @property(Button)
    closeLogButton: Button

    // Sprites
    @property(SpriteFrame)
    logLockedSprite: SpriteFrame
    @property(SpriteFrame)
    logNoteSprite: SpriteFrame

    private globalSettings: GlobalSettings
    private logCache: { [key: string]: any } = {}
    private buttonStates: Map<Node, boolean> = new Map()
    private logOpened: boolean = false



    // # Lifecycle
    onLoad() {
        this.globalSettings = GlobalSettings.getInstance();
        this.scrollView.enabled = false;
        this.loadChapterLogs();

        // Buttons
        this.backButton.node.on(Button.EventType.CLICK, this.loadPreviousScene, this);
        this.closeLogButton.node.on(Button.EventType.CLICK, this.closeLog, this);
        
        // Key Down
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    onKeyDown(event: EventKeyboard) {
        switch (event.keyCode) {
            case KeyCode.ESCAPE:
                if (this.logOpened) {
                    this.globalSettings.audioManager.playSFX(this.closeLogButton.getComponent(ButtonIconOutline).sfx);
                    this.closeLog();
                } else {
                    this.globalSettings.audioManager.playSFX(this.backButton.getComponent(ButtonIconOutline).sfx);
                    this.loadPreviousScene();
                }
                break;
            default:
                break;
        }
    }

    start() {
        this.tablet.setPosition(new Vec3(0, -1000, 0));
        this.tablet.angle = 5;
        tween(this.tablet)
            .to(1, { position: new Vec3(0, 0, 0), angle: 0 }, { easing: "sineOut" })
            .start();
    }



    // # Functions
    loadChapterLogs() {
        const selectedChapterId = this.globalSettings.selectedChapterId;
        const songs = this.globalSettings.songs.filter(song => song.chapter.id === selectedChapterId);
        songs.sort((a, b) => a.index - b.index);

        songs.forEach(song => {
            if (song.log_ids && Array.isArray(song.log_ids)) {
                song.log_ids.forEach((logId: string) => {
                    this.createLogButton(logId);
                })
            }
        });
    }

    createLogButton(logId: string) {
        const log = this.globalSettings.getUserData("logs", logId);
        const unlockLevel: number = log?.unlock_level ?? 0;
        const unlocked: boolean = unlockLevel > 0;
        const hasRead: boolean = log?.has_read ?? false;

        const logButton = instantiate(this.buttonLogPrefab);
        const logButtonComponent = logButton.getComponent(ButtonLog);
        logButtonComponent.labelText = logId.toUpperCase();
        logButtonComponent.iconSprite = unlocked ? this.logNoteSprite : this.logLockedSprite;
        logButtonComponent.uiOpacity.opacity = unlocked ? 255 : 127;
        logButtonComponent.showNotificationDot = unlocked && !hasRead;

        const buttonComponent = logButtonComponent.button;
        if (unlocked) {
            buttonComponent.node.on(Button.EventType.CLICK, () => {
                logButtonComponent.showNotificationDot = false;
                this.openLog(logId, unlockLevel, hasRead);
            });
        } else {
            buttonComponent.interactable = false;
        }

        this.logsLayout.addChild(logButton);
    }

    async openLog(logId: string, unlockLevel: number, hasRead: boolean) {
        this.logOpened = true;
        this.disableLogButtons();
        this.scrollView.enabled = true;

        const log = await this.getLog(logId);
        this.renderLog(log, unlockLevel);
        
        this.logPanel.setPosition(new Vec3(0, -60, 0));
        tween(this.logPanel)
            .to(0.25, { position: new Vec3(0, 0, 0) }, { easing: "sineOut" })
            .start();
        tween(this.logPanel.getComponent(UIOpacity))
            .to(0.25, { opacity: 255 }, { easing: "sineOut" })
            .start();

        // Patch and save log opened state
        if (!hasRead) {
            this.globalSettings.patchUserData({ key: "logs", id: logId, data: { has_read: true } });
            DatabaseManager.updateData();
        }
    }

    getLog(logId: string): Promise<any> {
        if (this.logCache[logId]) {
            return Promise.resolve(this.logCache[logId]);
        }

        return new Promise((resolve, reject) => {
            const path = `logs/${logId}`;
            resources.load(path, JsonAsset, (error, asset) => {
                if (error) {
                    console.error(`LOG::${logId}: Failed to load JSON, reason: ${error.message}`);
                    reject(error);
                    return;
                }

                this.logCache[logId] = asset.json!;
                resolve(asset.json!);
            });
        });
    }

    renderLog(log: any, unlockLevel: number) {
        this.logContents.removeAllChildren();

        log.contents.forEach((contentData: any) => {
            const textLog = instantiate(this.textLogPrefab);
            const textLogComponent = textLog.getComponent(TextLog);
            
            switch (contentData.type) {
                case "text":
                default:
                    textLogComponent.text = this.parseNestedContent(contentData.content, unlockLevel);
            }

            this.logContents.addChild(textLog);
        });
    }

    parseNestedContent(content: string, unlockLevel: number): any {
        // Regular expression to find all {key: value} pairs
        const regex = /\{([^{}]+)\}/g;
        let match: any;
        let parsedContent = content;
    
        while ((match = regex.exec(content)) !== null) {
            const pair = match[1]; // Get the content inside the braces
            let [key, value] = pair.split(/:\s*/);
            key = key.trim();
            value = value.trim();
    
            const keyNumber = parseInt(key);

            let replacement = "";
            if (!isNaN(keyNumber)) {
                if (keyNumber <= unlockLevel) {
                    replacement = value;
                } else {
                    replacement = `<color=#D85C5C>${this.getRandomString(value.length)}</color>`;
                }
            }

            parsedContent = parsedContent.replace(match[0], replacement);
        }
    
        return parsedContent;
    }
    getRandomString(length: number): string {
        const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+[]{}|;:,.<>?";
        let result = "";

        const charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }

        return result;
    }
    
    closeLog() {
        this.logOpened = false;
        tween(this.logPanel)
            .to(0.25, { position: new Vec3(0, -60, 0) }, { easing: "sineOut" })
            .start();
        tween(this.logPanel.getComponent(UIOpacity))
            .to(0.25, { opacity: 0 }, { easing: "sineIn" })
            .call(() => {
                this.scrollView.enabled = false;
                this.logContents.removeAllChildren();
                this.enableLogButtons();
            })
            .start();
    }

    disableLogButtons() {
        this.buttonStates.clear();
        const buttons = this.logsLayout.getComponentsInChildren(Button);
        buttons.forEach(button => {
            this.buttonStates.set(button.node, button.interactable);
            button.interactable = false;
        })
    }

    enableLogButtons() {
        this.buttonStates.forEach((state, node) => {
            const button = node.getComponent(Button);
            if (button) {
                button.interactable = state;
            }
        });
    }

    loadPreviousScene() {
        tween(this.tablet)
            .to(1, { position: new Vec3(0, -1000, 0), angle: 5 }, { easing: "sineIn" })
            .start();
        this.sceneTransition.fadeOutAndLoadScene("SongSelect");
    }
}