import { _decorator, Component, resources, Sprite, SpriteFrame } from "cc";
import { EDITOR } from "cc/env";
const { ccclass, property, executeInEditMode } = _decorator;

@ccclass("BackgroundController")
@executeInEditMode
export class BackgroundController extends Component {
    @property(Sprite)
    spriteComponent: Sprite

    @property
    spriteName: string = "luna"

    @property
    blur: boolean = false

    @property
    showCharacter: boolean = true



    // # Lifecycle
    onLoad() {
        if (this.spriteName) {
            this.loadSprite(this.spriteName);
        }
    }

    
    
    // # Functions
    loadSprite(spriteName: string) {
        const spritePath = `images/bg/bg_${spriteName}${this.blur ? "_blur" : ""}/spriteFrame`;

        if (EDITOR) {
            // TODO: Able to preview in editor
        } else {
            resources.load(spritePath, SpriteFrame, (error, spriteFrame) => {
                if (error) {
                    console.error(`BG::${spriteName.toUpperCase()}: Failed to load sprite, reason: ${error.message}`);
                    return;
                }
    
                this.spriteComponent.spriteFrame = spriteFrame;
            });
        }
    }
}