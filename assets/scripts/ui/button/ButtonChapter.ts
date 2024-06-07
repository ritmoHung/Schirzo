import { _decorator, RichText, Sprite, SpriteFrame } from "cc";
import { BaseButton } from "./BaseButton";
const { ccclass, property, executeInEditMode } = _decorator;

@ccclass("ButtonChapter")
@executeInEditMode
export class ButtonChapter extends BaseButton {
    @property(Sprite)
    bg: Sprite

    @property(SpriteFrame)
    bgSprite: SpriteFrame

    @property(RichText)
    clearedText: RichText

    @property(RichText)
    totalText: RichText

    @property
    cleared: number = 0

    @property
    total: number = 0



    // # Lifecycle
    onLoad() {
        super.onLoad();
        this.bg.spriteFrame = this.bgSprite;
        this.clearedText.string = this.cleared.toString();
        this.totalText.string = this.total.toString();
    }
}