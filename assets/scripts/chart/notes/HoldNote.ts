import { _decorator, easing, EventKeyboard, Node } from "cc";
import { JudgePoint } from "../JudgePoint";
import { Note } from "./Note";
const { ccclass, property } = _decorator;

@ccclass("HoldNote")
export class HoldNote extends Note {
    @property(Node)
    private startSprite: Node

    @property(Node)
    private endSprite: Node

    @property(Node)
    private rectSprite: Node

    private holdTime: number
    private startPosition: number
    private endOffset: number
    private hasPressed: boolean



    // # Lifecycle
    onKeyDown(event: EventKeyboard) {
        // TODO
    }

    update() {
        // TODO
        const globalTime = this.chartPlayer.getGlobalTime() || 0;

        if (globalTime >= this.time && globalTime < this.time + this.holdTime) {
            if (!this.hasPressed) {
                if (Math.abs(globalTime - this.lastGlobalTime) < 1) this.chartPlayer.playSfx(this.sfx);
                this.hasPressed = true;
            }
        } else if (globalTime >= this.time + this.holdTime) {
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
        const endTime = data.endTime;
        this.holdTime = endTime - this.time;

        this.startPosition = this.judgePoint.calculatePositionOffset(this.time);
        const endPosition = this.judgePoint.calculatePositionOffset(this.time + this.holdTime);

        this.endOffset = endPosition - this.startPosition;
        this.node.setPosition(0, this.startPosition, 0);
        this.startSprite.setPosition(0, 0, 0);
        this.endSprite.setPosition(0, this.endOffset, 0);
        this.rectSprite.setPosition(0, this.endOffset / 2, 0);
        this.rectSprite.setScale(1, this.endOffset, 1);
    }

    updateUI(time: number) {
        if (time > this.time + this.holdTime) {
            const fadeDuration = 0.1;
            const elapsedTime = time - this.time;
            const progress = Math.min(elapsedTime / fadeDuration, 1); // Ensure progress does not exceed 1
            this.uiOpacity.opacity = 255 * (1 - easing.linear(progress));
            this.node.setScale((1 - easing.expoIn(progress)), (1 - easing.expoIn(progress)));
        } else {
            this.uiOpacity.opacity = 255;
            this.node.setScale(1, 1);
        }

        time = Math.min(Math.max(time, this.time), this.time + this.holdTime);
        const newStartPosition = this.judgePoint.calculatePositionOffset(time);

        // Update StartSprite position
        const startOffset = newStartPosition - this.startPosition;
        this.startSprite.setPosition(0, startOffset, 0);

        // Update RectSprite position & scale
        this.rectSprite.setPosition(0, (startOffset + this.endOffset) / 2, 0);
        this.rectSprite.setScale(1, this.endOffset - startOffset, 1);
    }
}