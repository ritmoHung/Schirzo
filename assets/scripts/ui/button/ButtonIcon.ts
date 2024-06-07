import { _decorator, Sprite, SpriteFrame } from "cc";
import { BaseButton } from "./BaseButton";
const { ccclass, property, executeInEditMode } = _decorator;

@ccclass("ButtonIconOutline")
@executeInEditMode
export class ButtonIconOutline extends BaseButton {
    @property(Sprite)
    icon: Sprite

    @property(SpriteFrame)
    iconSprite: SpriteFrame



    // # Lifecycle
    onLoad() {
        super.onLoad();
        this.icon.spriteFrame = this.iconSprite;
    }
}