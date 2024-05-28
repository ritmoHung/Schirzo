import { _decorator, EventKeyboard } from "cc";
import { JudgePoint } from "../JudgePoint";
import { Note } from "./Note";
const { ccclass, property } = _decorator;

@ccclass("DragNote")
export class DragNote extends Note {
    // # Lifecycle
    protected onKeyDown(event: EventKeyboard) {
        const globalTime = this.chartPlayer.getGlobalTime() || 0;
    }

    update() {
        const globalTime = this.chartPlayer.getGlobalTime() || 0;

        if (globalTime >= this.time) {
            if (!this.hasPlayedSFX) {
                if (Math.abs(globalTime - this.lastGlobalTime) < 1) this.chartPlayer.playSfx(this.sfx);
                this.hasPlayedSFX = true;
            }

            if (this.mode !== "autoplay") {
                this.node.destroy();
            }
        } else {
            this.hasPlayedSFX = false;
        }

        this.updateUI(globalTime);
        this.lastGlobalTime = globalTime;
    }



    // # Functions
    initialize(data: any, judgePoint: JudgePoint) {
        super.initialize(data, judgePoint);

        const offset = this.judgePoint.calculatePositionOffset(this.time);
        this.node.setPosition(0, offset, 0);
    }
}