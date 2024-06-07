import { _decorator, AudioClip, Component, easing, EventKeyboard, Input, input, UIOpacity } from "cc";
import { ChartPlayer } from "../ChartPlayer";
import { JudgeManager } from "../../lib/JudgeManager";
import { JudgePoint } from "../JudgePoint";
const { ccclass, property } = _decorator;

@ccclass("Note")
export abstract class Note extends Component {
    @property(UIOpacity)
    uiOpacity: UIOpacity

    @property(AudioClip)
    sfx: AudioClip | null = null

    protected chartPlayer: ChartPlayer
    protected judgeManager: JudgeManager
    protected judgePoint: JudgePoint

    protected mode: string = "autoplay"
    protected hasPlayedSfx = false
    protected lastGlobalTime: number = -1

    protected isFake: boolean
    protected time: number
    protected speed: number
    protected isActive: boolean = false
    protected isJudged: boolean = false

    protected actKeydown: boolean = true;

    // Editor
    public set keydownListen(value: boolean) {
        this.actKeydown = value;
    }

    public get noteTime() {
        return this.time;
    }

    // # Lifecycle
    onLoad() {
        if (!this.actKeydown) return;
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.on(Input.EventType.KEY_PRESSING, this.onKeyPressing, this);
        input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
    }

    onDestroy() {
        if (!this.actKeydown) return;
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.off(Input.EventType.KEY_PRESSING, this.onKeyPressing, this);
        input.off(Input.EventType.KEY_UP, this.onKeyUp, this);
    }

    protected abstract onKeyDown(event: EventKeyboard): void;
    protected abstract onKeyPressing(event: EventKeyboard): void;
    protected abstract onKeyUp(event: EventKeyboard): void;

    update(deltaTime: number) {

    }



    // # Functions
    initialize(data: any, judgePoint: JudgePoint) {
        this.chartPlayer = ChartPlayer.Instance;
        this.judgeManager = JudgeManager.getInstance();
        this.judgePoint = judgePoint;

        this.isFake = data?.isFake ?? false;
        this.time = data.time;
        this.speed = data?.speed ?? 1.0;

        const offset = this.judgePoint.calculatePositionOffset(this.time);
        this.node.setPosition(0, offset, 0);
    }

    protected updateUI(time: number) {
        if (time > this.time) {
            const fadeDuration = 0.1;
            const elapsedTime = time - this.time;
            const progress = Math.min(elapsedTime / fadeDuration, 1); // Ensure progress does not exceed 1
            this.uiOpacity.opacity = 255 * (1 - easing.linear(progress));
            this.node.setScale((1 - easing.expoIn(progress)), (1 - easing.expoIn(progress)));
        } else {
            this.uiOpacity.opacity = 255;
            this.node.setScale(1, 1);
        }
    }
}