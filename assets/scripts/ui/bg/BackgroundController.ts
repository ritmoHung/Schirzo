import { _decorator, Component, resources, Sprite, SpriteFrame } from "cc";
import { EDITOR } from "cc/env";
const { ccclass, property, executeInEditMode } = _decorator;

@ccclass("BackgroundController")
@executeInEditMode
export class BackgroundController extends Component {
    @property(Sprite)
    bgSpriteComponent: Sprite

    @property(Sprite)
    charSpriteComponent: Sprite

    @property
    type: string = "luna"

    @property
    blur: boolean = false

    @property
    showCharacter: boolean = true



    // # Lifecycle
    onLoad() {
        if (this.type) {
            this.loadSprite(this.type);
        }
    }

    
    
    // # Functions
    loadSprite(type: string) {
        if (EDITOR) {
            // TODO: Able to preview in editor
        } else {
            // Resolve sprite paths
            let bgSpritePath: string = "", charSpritePath: string = "";
            if (!this.blur) {
                bgSpritePath = `images/bg/${this.type}/bg/spriteFrame`;

                // Character Sprite
                if (this.showCharacter) {
                    charSpritePath = `images/bg/${this.type}/character/spriteFrame`;
                }
            } else {
                bgSpritePath = `images/bg/${this.type}/bg${this.showCharacter ? "" : "_nc"}_blur/spriteFrame`;
            }

            // Load background sprite frame
            bgSpritePath && resources.load(bgSpritePath, SpriteFrame, (error, spriteFrame) => {
                if (error) {
                    console.error(`BG::${type.toUpperCase()}::BG: Failed to load sprite, reason: ${error.message}`);
                    return;
                }
    
                this.bgSpriteComponent.spriteFrame = spriteFrame;
            });

            // Load character sprite frame
            charSpritePath && resources.load(charSpritePath, SpriteFrame, (error, spriteFrame) => {
                if (error) {
                    console.error(`BG::${type.toUpperCase()}::CHAR: Failed to load sprite, reason: ${error.message}`);
                    return;
                }
    
                this.charSpriteComponent.spriteFrame = spriteFrame;
            });
        }
    }
}