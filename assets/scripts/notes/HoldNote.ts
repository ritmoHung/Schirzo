import { _decorator, EventKeyboard, Node } from "cc";
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
                this.chartPlayer.playSfx(this.sfx);
                this.hasPressed = true;
            }

            const newStartPosition = this.judgePoint.calculatePositionOffset(globalTime);

            // Update StartSprite position
            const startOffset = newStartPosition - this.startPosition;
            this.startSprite.setPosition(0, startOffset, 0);

            // Update RectSprite position & scale
            this.rectSprite.setPosition(0, (startOffset + this.endOffset) / 2, 0);
            this.rectSprite.setScale(1, this.endOffset - startOffset, 1);
        } else if (globalTime >= this.time + this.holdTime) {
            this.chartPlayer.playSfx(this.sfx);
            this.node.destroy();
        }
    }



    // # Functions
    initialize(data: any, judgePoint: JudgePoint) {
        super.initialize(data, judgePoint);
        this.holdTime = data.holdTime;

        this.startPosition = this.judgePoint.calculatePositionOffset(this.time);
        const endPosition = this.judgePoint.calculatePositionOffset(this.time + this.holdTime);

        this.endOffset = endPosition - this.startPosition;
        this.node.setPosition(0, this.startPosition, 0);
        this.startSprite.setPosition(0, 0, 0);
        this.endSprite.setPosition(0, this.endOffset, 0);
        this.rectSprite.setPosition(0, this.endOffset / 2, 0);
        this.rectSprite.setScale(1, this.endOffset, 1);
    }
}