import { _decorator, AudioClip, Component, EventKeyboard, input, Input, KeyCode, tween, UIOpacity, Vec3 } from "cc";
import { ChartPlayer } from "./ChartPlayer";
import { JudgePoint } from "./JudgePoint";
const { ccclass, property } = _decorator;

@ccclass("ClickNote")
export class ClickNote extends Component {
    @property(AudioClip)
    sfx: AudioClip | null = null

    private judgePoint: JudgePoint

    private isFake: boolean
    private time: number
    private speed: number

    

    // # Lifecycle
    onLoad() {
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    onDestroy() {
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    onKeyDown(event: EventKeyboard) {
        const globalTime = ChartPlayer.Instance ? ChartPlayer.Instance.getGlobalTime() : 0;
        const dt = Math.abs(globalTime - this.time);

        if (!this.isFake && dt <= 0.08 && (event.keyCode === KeyCode.KEY_F || event.keyCode === KeyCode.KEY_J)) {
            console.log(`TIME: ${this.time}, HIT: ${globalTime}, KEY: ${event.keyCode}`);
            // ChartPlayer.Instance.playSfx(this.sfx);
            this.node.destroy();
        }
    }

    update() {
        const globalTime = ChartPlayer.Instance ? ChartPlayer.Instance.getGlobalTime() : 0;

        if (globalTime >= this.time + 0.08) {
            console.log("MISS");
            this.node.destroy();
        }
    }



    // # Functions
    initialize(data: any, judgePoint: JudgePoint) {
        this.judgePoint = judgePoint;
        this.isFake = data.isFake;
        this.time = data.time;
        this.speed = data.speed;

        const offset = this.judgePoint.calculatePositionOffset(this.time);
        this.node.setPosition(0, offset, 0);
    }
}