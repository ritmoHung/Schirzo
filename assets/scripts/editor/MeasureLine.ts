import { _decorator, BoxCollider, BoxCollider2D, Color, Component, Input, input, Node, Prefab, rect, Sprite, UIOpacity, v3, view } from 'cc';
import { ChartEditor } from './ChartEditor';
import { MeasureLinePool } from './MeasureLinePool';
import { ChartPlayer } from '../chart/ChartPlayer';
const { ccclass, property } = _decorator;

@ccclass('MeasureLine')
export class MeasureLine extends Component {
    public time: [number, number] = [0, 0];
    public pool: MeasureLinePool;
    public unitIndex: number = 0;

    opacity: UIOpacity = null;
    sprite: Sprite = null;

    private hovering: boolean = false;

    onLoad() {
        this.opacity = this.getComponent(UIOpacity);
        this.sprite = this.node.getChildByName("MeasureLineSprite").getComponent(Sprite);
        this.node.on(Node.EventType.MOUSE_ENTER, this.hoverStart, this);
        this.node.on(Node.EventType.MOUSE_LEAVE, this.hoverEnd, this);
        //input.on(Input.EventType.MOUSE_WHEEL, (event) => this.pool.scroll(event.getScrollY() * 0.25), this);
    }

    update(dt: number) {
        if (ChartEditor.Instance.selectedJudgePoint) {
            this.updateLinePos();
            this.updateLineOpacity();
        } else {
            this.opacity.opacity = 0;
        }
    }

    updateLinePos() {
        const bpb = ChartEditor.Instance.bpb;
        const bottomPosition = ChartEditor.Instance.selectedJudgePoint.node.position;

        this.node.position = v3(960, bottomPosition.y + this.pool.barHeight * (this.time[0] - this.pool.currentTime[0] + (this.time[1] - this.pool.currentTime[1]) / ChartPlayer.Instance.UPB / bpb));
        if (this.node.position.y < bottomPosition.y) {
            this.time = [this.time[0] + this.pool.renderBarCount, this.time[1]];
        } else if (this.node.position.y > this.pool.resolution.height) {
            this.time = [this.time[0] - this.pool.renderBarCount, this.time[1]];
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
        this.hovering = true;
        this.sprite.node.scale = v3(1, 1.5);
        this.sprite.color = new Color("#CCCCFF");
    }

    hoverEnd() {
        this.hovering = false;
        this.sprite.node.scale = v3(1, 1);
        this.sprite.color = new Color("#FFFFFF");
    }
}


