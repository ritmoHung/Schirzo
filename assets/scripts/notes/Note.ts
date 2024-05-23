import { _decorator, AudioClip, Component, EventKeyboard, Input, input } from "cc";
import { ChartPlayer } from "../ChartPlayer";
import { JudgePoint } from "../JudgePoint";
const { ccclass, property } = _decorator;

@ccclass("Note")
export abstract class Note extends Component {
    @property(AudioClip)
    sfx: AudioClip | null = null

    protected chartPlayer: ChartPlayer
    protected judgePoint: JudgePoint

    protected isFake: boolean
    protected time: number
    protected speed: number


    
    // # Lifecycle
    onLoad() {
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    onDestroy() {
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    protected abstract onKeyDown(event: EventKeyboard): void;

    update(deltaTime: number) {
        
    }



    // # Functions
    initialize(data: any, judgePoint: JudgePoint) {
        this.chartPlayer = ChartPlayer.Instance;
        this.judgePoint = judgePoint;

        this.isFake = data.isFake || false;
        this.time = data.time;
        this.speed = data.speed || 1.0;

        const offset = this.judgePoint.calculatePositionOffset(this.time);
        this.node.setPosition(0, offset, 0);
    }
}

