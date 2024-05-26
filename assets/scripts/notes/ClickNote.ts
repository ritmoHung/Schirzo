import { _decorator, EventKeyboard, KeyCode } from "cc";
import { JudgePoint } from "../JudgePoint";
import { Note } from "./Note";
const { ccclass, property } = _decorator;

@ccclass("ClickNote")
export class ClickNote extends Note {
    // # Lifecycle
    protected onKeyDown(event: EventKeyboard) {
        const globalTime = this.chartPlayer.getGlobalTime() || 0;
        const dt = Math.abs(globalTime - this.time);

        if (!this.isFake && dt <= 0.08 && (event.keyCode === KeyCode.KEY_F || event.keyCode === KeyCode.KEY_J)) {
            console.log(`TIME: ${this.time}, HIT: ${globalTime}, KEY: ${event.keyCode}`);
            // ChartPlayer.Instance.playSfx(this.sfx);
            this.node.destroy();
        }
    }

    update() {
        const globalTime = this.chartPlayer.getGlobalTime() || 0;

        if (globalTime >= this.time + 0.08) {
            console.log("MISS");
            this.node.destroy();
        }
    }



    // # Functions
    initialize(data: any, judgePoint: JudgePoint) {
        super.initialize(data, judgePoint);

        const offset = this.judgePoint.calculatePositionOffset(this.time);
        this.node.setPosition(0, offset, 0);
    }
}