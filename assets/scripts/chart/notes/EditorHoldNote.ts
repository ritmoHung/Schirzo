import { _decorator, easing, EventKeyboard, Node, v3 } from "cc";
import { JudgePoint } from "../JudgePoint";
import { Note } from "./Note";
import { ChartEditor } from "../../editor/ChartEditor";
import { MeasureLinePool } from "../../editor/MeasureLinePool";
import { JudgePointPool } from "../JudgePointPool";
const { ccclass, property } = _decorator;

@ccclass("EditorHoldNote")
export class EditorHoldNote extends Note {
    @property(Node)
    private startSprite: Node

    @property(Node)
    private endSprite: Node

    @property(Node)
    private rectSprite: Node

    private startTime: [number, number]
    private endTime: [number, number]

    get startPos() {
        return v3(this.startSprite.position).add(this.node.position);
    }

    get endPos() {
        return v3(this.endSprite.position).add(this.node.position);
    }

    get note() {
        return {
            "type": 3,
            "direction": 1,
            "time": this.startTime,
            "endTime": this.endTime
        }
    }

    onKeyDown(event: EventKeyboard) { }
    protected onKeyPressing(event: EventKeyboard): void { }
    protected onKeyUp(event: EventKeyboard): void { }

    // # Functions
    initialize(data: any, judgePoint: JudgePoint) {
        super.initialize(data, judgePoint);
        this.startTime = data.time;
    }

    updateEnd(time: [number, number]) {
        if (!time || time.length < 2) return;
        const endOffset = ((time[0] - this.startTime[0]) * ChartEditor.Instance.bpb + (time[1] - this.startTime[1]) / this.chartPlayer.UPB) * MeasureLinePool.Instance.measureLineBeatGap * MeasureLinePool.Instance.resolution.height;
        if (endOffset < 0) return;
        this.startSprite.setPosition(0, 0, 0);
        this.endSprite.setPosition(0, endOffset, 0);
        this.rectSprite.setPosition(0, endOffset / 2, 0);
        this.rectSprite.setScale(1, endOffset, 1);
        this.endTime = time;
    }
}