import { _decorator, EventKeyboard } from "cc";
import { JudgePoint } from "../chart/JudgePoint";
import { Note } from "./Note";
const { ccclass, property } = _decorator;

@ccclass("DragNote")
export class DragNote extends Note {
    // # Lifecycle
    onKeyDown(event: EventKeyboard) {
        const globalTime = this.chartPlayer.getGlobalTime() || 0;
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

        const offset = this.judgePoint.calculatePositionOffset(this.time);
        this.node.setPosition(0, offset, 0);
    }
}