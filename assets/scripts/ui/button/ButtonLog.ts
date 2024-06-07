import { UIOpacity, _decorator } from "cc";
import { ButtonSquare } from "./ButtonSquare";
const { ccclass, property } = _decorator;

@ccclass("ButtonLog")
export class ButtonLog extends ButtonSquare {
    @property(UIOpacity)
    dotUiOpacity: UIOpacity

    @property
    showNotificationDot: boolean = false;



    // # Lifecycle
    onLoad() {
        super.onLoad();
        this.setDotVisibility();
    }

    update() {
        this.setDotVisibility();
    }

    setDotVisibility() {
        this.showNotificationDot
            ? this.dotUiOpacity.opacity = 255
            : this.dotUiOpacity.opacity = 0;
    }
}