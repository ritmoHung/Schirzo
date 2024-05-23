import { _decorator, EventKeyboard } from "cc";
import { JudgePoint } from "../JudgePoint";
import { Note } from './Note';
const { ccclass, property } = _decorator;

@ccclass("HoldNote")
export class HoldNote extends Note {
    private holdTime: number



    // # Lifecycle
    onKeyDown(event: EventKeyboard) {
        // TODO
    }

    update() {
        // TODO
        const globalTime = this.chartPlayer.getGlobalTime() || 0;

        if (globalTime >= this.time + 0.08) {
            console.log("MISS");
            this.node.destroy();
        }
    }



    // # Functions
    initialize(data: any, judgePoint: JudgePoint) {
        super.initialize(data, judgePoint);
        this.holdTime = data.holdTime;

        const offset = this.judgePoint.calculatePositionOffset(this.time);
        this.node.setPosition(0, offset, 0);
    }
}