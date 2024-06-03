import { _decorator, Button, Component, director, instantiate, JsonAsset, Node, Prefab, resources, RichText, SpriteFrame, tween, UIOpacity, UITransform, Vec3 } from "cc";
import { GlobalSettings } from "../settings/GlobalSettings";
import { ButtonSquare } from "../ui/button/ButtonSquare";
const { ccclass, property } = _decorator;

@ccclass("ChapterLogs")
export class ChapterLogs extends Component {
    @property(Node)
    logContainer: Node

    @property(Node)
    logContents: Node

    @property(Prefab)
    buttonSquare: Prefab

    @property(Button)
    backButton: Button

    @property(Button)
    closeLogButton: Button

    @property(SpriteFrame)
    logNoteSprite: SpriteFrame

    private globalSettings: GlobalSettings



    // # Lifecycle
    onLoad() {
        this.globalSettings = GlobalSettings.getInstance();
        this.loadLogs();

        this.backButton.node.on(Button.EventType.CLICK, this.loadPreviousScene, this);
        this.closeLogButton.node.on(Button.EventType.CLICK, this.closeLog, this);
    }



    // # Functions
    loadLogs() {
        const selectedChapterId = this.globalSettings.selectedChapterId;
        const songs = this.globalSettings.songs.filter(song => song.chapter_id === selectedChapterId);

        songs.forEach(song => {
            if (song.log_ids && Array.isArray(song.log_ids)) {
                song.log_ids.forEach((logId: string) => {
                    this.createLogButton(logId);
                })
            }
        });

        this.logContainer.setPosition(new Vec3(0, 0, 0));
    }

    createLogButton(logId: string) {
        const logButton = instantiate(this.buttonSquare);
        const buttonSquareComponent = logButton.getComponent(ButtonSquare);
        buttonSquareComponent.iconSprite = this.logNoteSprite;
        buttonSquareComponent.labelText = logId.toUpperCase();

        const buttonComponent = buttonSquareComponent.button;
        buttonComponent.node.on(Button.EventType.CLICK, () => {
            this.openLog(logId);
        });
        this.logContainer.addChild(logButton);
    }

    loadPreviousScene() {
        director.loadScene("SongSelect");
    }

    openLog(logId: string) {
        resources.load(`logs/${logId}`, JsonAsset, (error, asset) => {
            if (error) {
                console.error(`LOG::${logId}: Failed to load JSON, reason: ${error.message}`);
                return;
            }

            const logData = asset.json!;
            logData.contents.forEach((contentData: any) => {
                this.renderContent(contentData);
            })
        });

        tween(this.logContainer.getComponent(UIOpacity))
            .to(0.25, { opacity: 0 }, { easing: "sineOut" })
            .call(() => {
                this.logContainer.children.forEach(child => {
                    const button = child.getComponent(Button);
                    if (button) {
                        button.interactable = false;
                    }
                });
            })
            .start();
        
        this.logContents.setPosition(new Vec3(0, -100, 0));
        tween(this.logContents)
            .to(0.25, { position: new Vec3(0, 0, 0) }, { easing: "sineOut" })
            .start();
        tween(this.logContents.getComponent(UIOpacity))
            .to(0.25, { opacity: 255 }, { easing: "sineOut" })
            .start();
    }

    renderContent(contentData: any) {
        const content = new Node();
        content.addComponent(UITransform);
        const richText = content.addComponent(RichText);
        switch (contentData.type) {
            case "text":
            default:
                richText.string = contentData.content;
                break;
        }
        this.logContents.getChildByName("LogContentContainer").addChild(content);
    }

    closeLog() {
        tween(this.logContainer.getComponent(UIOpacity))
            .to(0.25, { opacity: 255 }, { easing: "sineOut" })
            .call(() => {
                this.logContainer.children.forEach(child => {
                    const button = child.getComponent(Button);
                    if (button) {
                        button.interactable = true;
                    }
                });
            })
            .start();

        tween(this.logContents)
            .to(0.25, { position: new Vec3(0, -100, 0) }, { easing: "sineOut" })
            .start();
        tween(this.logContents.getComponent(UIOpacity))
            .to(0.25, { opacity: 0 }, { easing: "sineOut" })
            .call(() => {
                this.logContents.getChildByName("LogContentContainer").destroyAllChildren();
            })
            .start();
    }
}