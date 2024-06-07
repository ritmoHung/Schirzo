import { _decorator, EventKeyboard, KeyCode } from "cc";
import { JudgePoint } from "../JudgePoint";
import { Note } from "./Note";
import { ACTIVE_RANGE, GOOD_RANGE } from "../../lib/JudgeManager";
const { ccclass, property } = _decorator;

@ccclass("ClickNote")
export class ClickNote extends Note {
    private static activeNote: ClickNote | null = null
    protected key: KeyCode | null = null



    // # Lifecycle
    update() {
        const globalTime = this.chartPlayer.getGlobalTime() || 0;
        const mode = this.chartPlayer.getMode();
        
        // Calculate dt and set isActive = true if it falls in the range of judge
        const dt = 1000 * (globalTime - this.time);
        if (Math.abs(dt) <= ACTIVE_RANGE && !this.isJudged && !this.isActive) {
            this.isActive = true;
            ClickNote.activeNote = this;
        }

        if (!this.isFake && globalTime >= this.time) {
            switch (mode) {
                case "autoplay":
                    if (!this.hasPlayedSfx) {
                        if (Math.abs(globalTime - this.lastGlobalTime) < 0.1) {
                            this.hasPlayedSfx = true;
                            this.chartPlayer.playSfx(this.sfx);
                        }
                    }
                    break;
                case "gameplay":
                    // ? Note not pressed
                    const dt = 1000 * (globalTime - this.time);
                    if (dt > GOOD_RANGE && !this.isJudged) {
                        this.isJudged = true;
                        this.isActive = false;
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
    }

    protected onKeyDown(event: EventKeyboard): void {
        const keyCode = event.keyCode;
        const keyActive = this.judgeManager.activeKeys.get(keyCode) ?? false;

        if (!keyActive && this.isActive && (this.key === null || keyCode === this.key)) {
            this.judgeManager.activeKeys.set(keyCode, true);
            this.judge(event);
        }
    }

    protected onKeyPressing(event: EventKeyboard): void {
        // Do nothing
    }

    protected onKeyUp(event: EventKeyboard): void {
        const keyCode = event.keyCode;
        this.judgeManager.activeKeys.set(keyCode, false);
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
                this.isActive = false;
                this.chartPlayer.playSfx(this.sfx);
                this.judgeManager.judgeNote(dt);
                this.node.destroy();
            }
        }
    }
}