import { _decorator, UIOpacity, v3 } from "cc";
import { JudgePoint } from "../chart/JudgePoint";

const { ccclass, property } = _decorator;

@ccclass("EditorJudgePoint")
export class EditorJudgePoint extends JudgePoint {
    update(dt: number) {
        const globalTime = this.chartPlayer.getGlobalTime() || 0;

        // Reset search indexes if time rewinds
        if (globalTime < this.lastGlobalTime) this.lastEventIndexes = {};
        
        if (globalTime !== this.lastGlobalTime) {
            // Update NoteContainer position
            const offset = this.calculatePositionOffset(globalTime);
            this.topNoteContainer.setPosition(0, -offset, 0);
            this.bottomNoteContainer.setPosition(0, offset, 0);

            // Update last global time
            this.lastGlobalTime = globalTime;
        }
    }
}