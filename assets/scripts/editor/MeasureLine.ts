import { _decorator, BoxCollider, BoxCollider2D, Color, Component, Input, input, Label, Node, Prefab, rect, Sprite, UIOpacity, v3, view } from 'cc';
import { ChartEditor } from './ChartEditor';
import { MeasureLinePool } from './MeasureLinePool';
import { ChartPlayer } from '../chart/ChartPlayer';
import { JudgePoint } from '../chart/JudgePoint';
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
            this.updateLinePos();
            this.updateLineOpacity();
            if (!this.interactable) {
                this.on();
            }
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

    measureLineClick() {
        if (ChartEditor.Instance.editTargetInput.string == "note") {
            ChartEditor.Instance.addNote(this.time);
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
        if (this.hovering) {
            this.opacity.opacity = 200;
        } else if (this.node.position.y < ChartEditor.Instance.selectedJudgePoint.node.position.y || this.node.position.y > this.pool.resolution.height - 25) {
            this.opacity.opacity = 0;
        } else if (this.time[1] == 0) {
            this.opacity.opacity = 150;
        } else if (this.time[1] % ChartPlayer.Instance.UPB == 0) {
            this.opacity.opacity = 100;
        } else {
            this.opacity.opacity = 25;
        }
    }

    hoverStart() {
        if (this.opacity.opacity > 0) {
            this.hovering = true;
            this.sprite.node.scale = v3(1, 1.5);
            this.sprite.color = new Color("#CCCCFF");
            if (ChartEditor.Instance.editTargetInput.string == "note") {
                ChartEditor.Instance.hoverTime = this.time;
                if (!ChartEditor.Instance.isPreviewNodeExists) {
                    ChartEditor.Instance.updatePreviewNote();
                }
                ChartEditor.Instance.updatePreviewNotePosition(this.node.position.y);
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


