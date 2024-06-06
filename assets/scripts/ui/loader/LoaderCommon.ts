import { _decorator, Animation, Component, Sprite, SpriteFrame } from "cc";
const { ccclass, property } = _decorator;

@ccclass("LoaderCommon")
export class LoaderCommon extends Component {
    @property(Animation)
    animation: Animation

    @property(Sprite)
    status: Sprite

    @property(SpriteFrame)
    loadingSprite: SpriteFrame

    @property(SpriteFrame)
    successSprite: SpriteFrame

    @property(SpriteFrame)
    warningSprite: SpriteFrame

    @property(SpriteFrame)
    errorSprite: SpriteFrame



    // # Lifecycle
    start() {
        this.showStatus("loading");
    }



    // # Functions
    showStatus(status: string) {
        switch (status) {
            case "success":
                this.animation.stop();
                this.status.node.angle = 0;
                this.status.spriteFrame = this.successSprite;
                break;
            case "warning":
                this.animation.stop();
                this.status.node.angle = 0;
                this.status.spriteFrame = this.warningSprite;
                break;
            case "error":
                this.animation.stop();
                this.status.node.angle = 0;
                this.status.spriteFrame = this.errorSprite;
                break;
            case "loading":
            default:
                this.animation.play();
                this.status.spriteFrame = this.loadingSprite;
                break;
        }
    }
}