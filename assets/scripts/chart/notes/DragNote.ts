import { _decorator, EventKeyboard } from "cc";
import { JudgePoint } from "../JudgePoint";
import { Note } from "./Note";
import { P_DECRYPT_RANGE, GOOD_RANGE, JudgementType } from "../../lib/JudgeManager";
const { ccclass, property } = _decorator;

@ccclass("DragNote")
export class DragNote extends Note {
    // # Lifecycle
    update() {
        const globalTime = this.chartPlayer.getGlobalTime() || 0;
        const mode = this.chartPlayer.getMode();

        if (!this.isFake && globalTime >= this.time) {
            switch (mode) {
                case "autoplay":
                    if (!this.hasPlayedSfx) {
                        if (Math.abs(globalTime - this.lastGlobalTime) < 0.1) {
                            this.hasPlayedSfx = true;
                            this.chartPlayer.playSfx(this.sfx);
                            this.playNoteHitAnim(JudgementType.PDecrypt);
                        }
                    }
                    break;
                case "gameplay":
                    if (this.isJudged) {
                        this.chartPlayer.playSfx(this.sfx);
                        this.playNoteHitAnim(JudgementType.PDecrypt);
                        this.node.destroy();
                    }

                    const dt = 1000 * (globalTime - this.time);
                    if (dt > GOOD_RANGE) {
                        this.isJudged = true;
                        this.judgeManager.judgeNote(dt);
                        this.node.destroy();
                    }
                    break;
                default:
                    break;
            }
        } else {
            this.hasPlayedSfx = false;
        }

        this.updateUI(globalTime);
        this.lastGlobalTime = globalTime;
        super.update();
    }

    protected onKeyDown(event: EventKeyboard): void {
        this.judge(event);
    }

    protected onKeyPressing(event: EventKeyboard): void {
        this.judge(event);
    }

    protected onKeyUp(event: EventKeyboard): void {
        this.judge(event);
    }



    // # Functions
    initialize(data: any, judgePoint: JudgePoint) {
        super.initialize(data, judgePoint);

        const offset = this.judgePoint.calculatePositionOffset(this.time);
        this.node.setPosition(0, offset, 0);
    }

    judge(event: EventKeyboard) {
        const mode = this.chartPlayer.getMode();

        if (!this.isFake && mode !== "autoplay") {
            const globalTime = this.chartPlayer.getGlobalTime() || 0;
            const dt = 1000 * (globalTime - this.time);
            if (Math.abs(dt) <= GOOD_RANGE && !this.isJudged) {
                this.isJudged = true;
                this.judgeManager.judgeNote(P_DECRYPT_RANGE);
            }
        }
    }
}