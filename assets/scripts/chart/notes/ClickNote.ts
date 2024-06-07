import { _decorator, EventKeyboard, KeyCode } from "cc";
import { JudgePoint } from "../JudgePoint";
import { Note } from "./Note";
const { ccclass, property } = _decorator;

@ccclass("ClickNote")
export class ClickNote extends Note {
    // # Lifecycle
    update() {
        const globalTime = this.chartPlayer.getGlobalTime() || 0;

        if (globalTime >= this.time) {
            if (!this.hasPlayedSfx) {
                if (Math.abs(globalTime - this.lastGlobalTime) < 1) this.chartPlayer.playSfx(this.sfx);
                this.hasPlayedSfx = true;
            }

            if (this.mode !== "autoplay") {
                this.node.destroy();
            }
        } else {
            this.hasPlayedSfx = false;
        }

        this.updateUI(globalTime);
        this.lastGlobalTime = globalTime;
    }

    protected onKeyDown(event: EventKeyboard): void {
        const globalTime = this.chartPlayer.getGlobalTime() || 0;
        const dt = Math.abs(globalTime - this.time);

        if (!this.isFake && dt <= 0.08 && (event.keyCode === KeyCode.KEY_F || event.keyCode === KeyCode.KEY_J)) {
            console.log(`TIME: ${this.time}, HIT: ${globalTime}, KEY: ${event.keyCode}`);
            // ChartPlayer.Instance.playSfx(this.sfx);
            this.node.destroy();
        }
    }

    protected onKeyPressing(event: EventKeyboard): void {

    }

    protected onKeyUp(event: EventKeyboard): void {
        
    }



    // # Functions
    initialize(data: any, judgePoint: JudgePoint) {
        super.initialize(data, judgePoint);

        const offset = this.judgePoint.calculatePositionOffset(this.time);
        this.node.setPosition(0, offset, 0);
    }
}