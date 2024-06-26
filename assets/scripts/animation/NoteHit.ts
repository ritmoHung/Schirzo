import { _decorator, Animation, AnimationClip, Color, Component, math, Node, Sprite } from "cc";
import { JudgementType } from "../lib/JudgeManager";
const { ccclass, property } = _decorator;

@ccclass("NoteHit")
export class NoteHit extends Component {
    @property(Animation)
    anim1: Animation
    @property(Animation)
    anim2: Animation

    @property(Sprite)
    sprite1: Sprite
    @property(Sprite)
    sprite2: Sprite

    @property
    type: string = "good"

    private anim1Finished: boolean = false
    private anim2Finished: boolean = false



    // # Lifecycle
    onLoad() {
        switch (this.type) {
            case JudgementType.PDecrypt:
            case JudgementType.Decrypt:
                this.sprite1.color = Color.YELLOW;
                this.sprite2.color = Color.YELLOW;
                break;
            case JudgementType.Good:
                this.sprite1.color = Color.CYAN;
                this.sprite2.color = Color.CYAN;
                break;
            case JudgementType.Cypher:
            default:
                this.sprite1.color = Color.WHITE;
                this.sprite2.color = Color.WHITE;
                break;
        }
        this.anim1.on(Animation.EventType.FINISHED, () => this.anim1Finished = true, this);
        this.anim2.on(Animation.EventType.FINISHED, () => this.anim2Finished = true, this);
    }

    update() {
        if (this.anim1Finished && this.anim2Finished) {
            this.node.destroy();
        }
    }



    // # Initialize
    initialize(type: JudgementType) {
        this.type = type;
    }
}