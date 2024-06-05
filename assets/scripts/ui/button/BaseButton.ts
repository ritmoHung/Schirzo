import { _decorator, AudioClip, Button, Component, Node, tween, UIOpacity, Vec3 } from "cc";
import { GlobalSettings } from "../../settings/GlobalSettings";
const { ccclass, property, executeInEditMode } = _decorator;

@ccclass("BaseButton")
@executeInEditMode
export class BaseButton extends Component {
    @property(Button)
    button: Button

    @property(UIOpacity)
    uiOpacity: UIOpacity

    @property(AudioClip)
    sfx: AudioClip

    private globalSettings: GlobalSettings
    private cursorClass: string = "cursor-pointer"
    private initialScale: Vec3 = new Vec3()
    private scaleFactor: number = 0.95



    // # Lifecycle
    onLoad() {
        this.globalSettings = GlobalSettings.getInstance();
        this.initialScale.set(this.node.scale);

        this.button.node.on(Node.EventType.MOUSE_ENTER, this.onMouseEnter, this);
        this.button.node.on(Node.EventType.MOUSE_LEAVE, this.onMouseLeave, this);
        this.button.node.on(Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.button.node.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.button.node.on(Node.EventType.TOUCH_CANCEL, this.onTouchCancel, this);

        if (!document.querySelector(`.${this.cursorClass}`)) {
            const style = document.createElement("style");
            style.innerHTML = `
                .${this.cursorClass} {
                    cursor: pointer;
                }
            `

            document.head.appendChild(style);
        }
    }



    // # Functions
    onMouseEnter() {
        if (this.button.interactable) {
            document.body.classList.add(this.cursorClass);
        }
    }
    onMouseLeave() {
        document.body.classList.remove(this.cursorClass);
    }

    onTouchStart() {
        if (this.button.interactable) {
            this.scaleDown();
            if (this.sfx) {
                this.globalSettings.audioManager.playSFX(this.sfx);
            }
        }
    }
    onTouchEnd() {
        if (this.button.interactable) {
            this.scaleUp();
        }
    }
    onTouchCancel() {
        if (this.button.interactable) {
            this.scaleUp();
        }
    }

    scaleDown() {
        const targetScale = new Vec3(
            this.initialScale.x * this.scaleFactor,
            this.initialScale.y * this.scaleFactor,
            this.initialScale.z * this.scaleFactor
        );

        tween(this.node)
            .to(0.15, { scale: targetScale }, { easing: "smooth" })
            .start();
    }

    scaleUp() {
        tween(this.node)
            .to(0.15, { scale: this.initialScale }, { easing: "smooth" })
            .start();
    }
}