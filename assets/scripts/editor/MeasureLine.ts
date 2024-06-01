import { _decorator, BoxCollider, BoxCollider2D, Color, Component, EventMouse, Input, input, Label, Node, Prefab, rect, Sprite, UIOpacity, v3, Vec3, view } from 'cc';
import { ChartEditor } from './ChartEditor';
import { MeasureLinePool } from './MeasureLinePool';
import { ChartPlayer } from '../chart/ChartPlayer';
import { JudgePoint } from '../chart/JudgePoint';
import { EditorJudgePoint } from './EditorJudgePoint';
const { ccclass, property } = _decorator;

@ccclass('MeasureLine')
export class MeasureLine extends Component {
    public time: [number, number] = [0, 0];
    public pool: MeasureLinePool;
    public unitIndex: number = 0;

    opacity: UIOpacity = null;
    label: Label = null;
    sprite: Sprite = null;

    private hovering: boolean = false;
    private interactable: boolean = false;

    onLoad() {
        this.opacity = this.getComponent(UIOpacity);
        this.label = this.node.getChildByName("TimeLabel").getComponent(Label);
        this.sprite = this.node.getChildByName("MeasureLineSprite").getComponent(Sprite);
        this.updateLabel();
    }

    update(dt: number) {
        if (ChartEditor.Instance.selectedJudgePoint) {
            if (this.interactable && this.time[0] > ChartEditor.Instance.endTime[0] || this.time[0] == ChartEditor.Instance.endTime[0] && this.time[1] > ChartEditor.Instance.endTime[1]) {
                this.off();
            } else if (!this.interactable) {
                this.on();
            }
            this.updateLinePos();
            this.updateLineOpacity();
        } else {
            this.opacity.opacity = 0;
            if (this.hovering) {
                this.hoverEnd();
            }
            if (this.interactable) {
                this.off();
            }
        }
    }

    pull() {
        const bpb = ChartEditor.Instance.bpb;
        const bottomPosition = ChartEditor.Instance.selectedJudgePoint.node.position;
        let pulling = true;
        let y = this.node.position.y;
        for (let i = 0; i < 10 && pulling; i++) {
            if (y < bottomPosition.y) {
                this.time = [this.time[0] + this.pool.renderBarCount, this.time[1]];
            } else if (y >= this.pool.resolution.height) {
                this.time = [this.time[0] - this.pool.renderBarCount, this.time[1]];
            } else {
                pulling = false;
            }
            y = bottomPosition.y + this.pool.barHeight * (this.time[0] - this.pool.currentTime[0] + (this.time[1] - this.pool.currentTime[1]) / ChartPlayer.Instance.UPB / bpb);
        }
        this.node.position = v3(this.node.position.x, y);
        this.updateLabel();
    }

    on() {
        this.hovering = false;
        this.interactable = true;
        this.sprite.node.scale = v3(1, 1);
        this.sprite.color = new Color("#FFFFFF");
        this.node.on(Node.EventType.MOUSE_ENTER, this.hoverStart, this);
        this.node.on(Node.EventType.MOUSE_UP, this.measureLineClick, this);
        this.node.on(Node.EventType.MOUSE_LEAVE, this.hoverEnd, this);
    }

    off() {
        this.interactable = false;
        this.node.off(Node.EventType.MOUSE_ENTER, this.hoverStart, this);
        this.node.off(Node.EventType.MOUSE_UP, this.measureLineClick, this);
        this.node.off(Node.EventType.MOUSE_LEAVE, this.hoverEnd, this);
    }

    measureLineClick(event: EventMouse) {
        const judgePoint = ChartEditor.Instance.judgePointPool.pool[ChartEditor.Instance.selectedJudgePoint.index].getComponent(EditorJudgePoint);
        if (ChartEditor.Instance.editTargetInput.string == "note") {
            if (event.getButton() == 0) {
                if (!judgePoint.hasNote(this.time)) {
                    judgePoint.createNote({
                        "type": ChartEditor.Instance.noteProperties.noteTypeInput.index,
                        "direction": 1,
                        "time": this.time
                    });
                }
            } else if (event.getButton() == 2) {
                if (judgePoint.hasNote(this.time)) {
                    judgePoint.removeNote(this.time);
                }
            }
        } else {
            
        }
    }

    updateLinePos() {
        const bpb = ChartEditor.Instance.bpb;
        const bottomPosition = ChartEditor.Instance.selectedJudgePoint.node.position;

        this.node.position = v3(1020, bottomPosition.y + this.pool.barHeight * (this.time[0] - this.pool.currentTime[0] + (this.time[1] - this.pool.currentTime[1]) / ChartPlayer.Instance.UPB / bpb));
        if (this.node.position.y < bottomPosition.y) {
            this.time = [this.time[0] + this.pool.renderBarCount, this.time[1]];
            this.updateLabel();
        } else if (this.node.position.y >= this.pool.resolution.height) {
            this.time = [this.time[0] - this.pool.renderBarCount, this.time[1]];
            this.updateLabel();
        }
    }

    updateLabel() {
        if (this.time[1] % ChartPlayer.Instance.UPB == 0) {
            this.label.node.active = true;
            this.label.string = `bAr ${this.time[0]}-${Math.floor(this.time[1] / ChartPlayer.Instance.UPB)}`
        } else {
            this.label.node.active = false;
        }
    }

    updateLineOpacity() {
        if (this.time[0] > ChartEditor.Instance.endTime[0] || this.time[0] == ChartEditor.Instance.endTime[0] && this.time[1] > ChartEditor.Instance.endTime[1]) {
            this.opacity.opacity = 0;
        } else if (this.node.position.y < ChartEditor.Instance.selectedJudgePoint.node.position.y || this.node.position.y > this.pool.resolution.height - 25) {
            this.opacity.opacity = 0;
        } else {
            if (this.hovering) {
                this.opacity.opacity = 200;
            } else if (this.time[1] == 0) {
                this.opacity.opacity = 150;
            } else if (this.time[1] % ChartPlayer.Instance.UPB == 0) {
                this.opacity.opacity = 100;
            } else {
                this.opacity.opacity = 25;
            }
        }
    }

    hoverStart() {
        if (this.opacity.opacity > 0) {
            this.hovering = true;
            this.sprite.node.scale = v3(1, 1.5);
            this.sprite.color = new Color("#CCCCFF");
            if (ChartEditor.Instance.editTargetInput.string == "note") {
                ChartEditor.Instance.hoverTime = this.time;
                if (!ChartEditor.Instance.holdSetting) {
                    if (!ChartEditor.Instance.isPreviewNodeExists) {
                        ChartEditor.Instance.updatePreviewNote();
                    }
                    ChartEditor.Instance.updatePreviewNotePosition(this.node.position.y);
                }
            }
        }
    }

    hoverEnd() {
        if (this.opacity.opacity > 0) {
            this.hovering = false;
            this.sprite.node.scale = v3(1, 1);
            this.sprite.color = new Color("#FFFFFF");
            ChartEditor.Instance.endMeasureLineHover();
        }
    }
}


