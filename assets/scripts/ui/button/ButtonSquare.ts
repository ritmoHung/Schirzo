import { _decorator, Label, Sprite, SpriteFrame } from "cc";
import { BaseButton } from "./BaseButton";
const { ccclass, property, executeInEditMode } = _decorator;

@ccclass("ButtonSquare")
@executeInEditMode
export class ButtonSquare extends BaseButton {
    @property(Sprite)
    icon: Sprite

    @property(Label)
    label: Label

    @property(SpriteFrame)
    iconSprite: SpriteFrame

    @property
    labelText: string = ""



    // # Lifecycle
    onLoad() {
        super.onLoad();
        this.icon.spriteFrame = this.iconSprite;
        this.label.string = this.labelText;
    }
}