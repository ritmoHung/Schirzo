import { _decorator, color, Color, Component, Enum, EventMouse, instantiate, Node, Sprite, UITransform, v3 } from 'cc';
import { TimelineNode } from './TimelineNode';
import { ChartEditor } from '../ChartEditor';
import { MeasureLinePool } from '../MeasureLinePool';
import { TimelinePool } from '../TimelinePool';
import { ChartPlayer } from '../../chart/ChartPlayer';
import { JudgePointPool } from '../../chart/JudgePointPool';
const { ccclass, property } = _decorator;

export enum TimelineNodeType {
    position = 0, opacity = 1, speed = 2, text = 3
}

export const TimelineColor: Map<TimelineNodeType, Color> = new Map([
    [TimelineNodeType.position, new Color("#F06161")],
    [TimelineNodeType.opacity, new Color("#94F061")],
    [TimelineNodeType.speed, new Color("#9B60E7")],
    [TimelineNodeType.text, new Color("#EBDF3D")]
])

@ccclass('Timeline')
export class Timeline extends Component {
    @property(Sprite)
    timelineSprite: Sprite = null;
    @property(UITransform)
    timelineTransform: UITransform = null;
    @property({ type: Enum(TimelineNodeType), serializable: true })
    type: TimelineNodeType = TimelineNodeType.position;

    nodes: TimelineNode[] = [];
    hovered: boolean = false;
    selected: boolean = false;

    onLoad() {
        this.timelineSprite.color = TimelineColor.get(this.type);
        this.node.on(Node.EventType.MOUSE_ENTER, this.hoverStart, this);
        this.node.on(Node.EventType.MOUSE_DOWN, this.timelineClick, this);
        this.node.on(Node.EventType.MOUSE_LEAVE, this.hoverEnd, this);
    }

    update(dt: number) {
        this.updatePosition();
    }

    hoverStart(event: EventMouse) {
        event.preventSwallow = true;
        this.hovered = true;
    }

    timelineClick(event: EventMouse) {
        event.preventSwallow = true;
        if (this.hovered) {
            TimelinePool.Instance.select(this.type);
        }
    }

    hoverEnd(event: EventMouse) {
        event.preventSwallow = true;
        this.hovered = false;
    }

    select(value: boolean) {
        this.selected = value;
        if (value) {
            this.timelineTransform.width = 8;
        } else {
            this.timelineTransform.width = 5;
        }
    }

    createNode(time: [number, number], rightClick: boolean) {
        for (let i = 0; i < this.nodes.length; i++) {
            const nodeComponent = this.nodes[i];
            const node = nodeComponent.node;
            if (!nodeComponent) {
                this.nodes.splice(i, 1);
                continue
            }
            if (nodeComponent.time[0] == time[0] && nodeComponent.time[1] == time[1]) {
                if (rightClick) {
                    this.nodes.splice(i, 1);
                    node.removeFromParent();
                }
                return
            }
        }
        const node = instantiate(TimelinePool.Instance.timelineNodePrefab);
        const nodeComponent = node.getComponent(TimelineNode);
        nodeComponent.timeline = this;
        nodeComponent.time = time;
        nodeComponent.type = this.type;
        this.node.addChild(node);
        this.nodes.push(nodeComponent);
        this.updatePosition();
        return nodeComponent;
    }

    updatePosition() {
        for (const nodeComponent of this.nodes) {
            const node = nodeComponent.node;
            node.position = v3(0, MeasureLinePool.Instance.barHeight * (nodeComponent.time[0] - MeasureLinePool.Instance.currentTime[0] + (nodeComponent.time[1] - MeasureLinePool.Instance.currentTime[1]) / ChartPlayer.Instance.UPB / ChartEditor.Instance.bpb) - MeasureLinePool.Instance.resolution.height * 0.3);
            if (node.position.y < -MeasureLinePool.Instance.resolution.height * 0.3 || node.position.y > MeasureLinePool.Instance.resolution.height * 0.5) {
                node.active = false;
                nodeComponent.close();
            } else {
                node.active = true;
            }
        }
    }

    loadChart(eventData) {
        for (const node of this.nodes) {
            node.node.destroy();
        }
        this.nodes = [];
        if (this.type == TimelineNodeType.text) { // Won't happen anyway
            for (const event of eventData) {
                const node = this.createNode(event.time, false);
                node.value = event.text;
            }
        } else {
            console.log(eventData);
            for (const event of eventData) {
                const node = this.createNode(event.endTime, false);
                node.easingTypeInput.setString(event.easing, 0);
                node.value = event.end;
            }
        }
    }

    publishChart() {
        let data = []
        if (this.type == TimelineNodeType.text) {
            const sortedNodes = this.nodes.sort((a, b) => a.time[0] > b.time[0] || a.time[0] == b.time[0] && a.time[1] > b.time[1] ? 1 : -1)
            for (let i = 0; i < sortedNodes.length; i++) {
                const node = sortedNodes[i];
                data.push({
                    "text": node.value,
                    "font": "default",
                    "time": node.time
                });
            }
            //data = data.sort((a, b) => a.time[0] > b.time[0] || a.time[0] == b.time[0] && a.time[1] > b.time[1] ? 1 : -1);
        } else {
            let prevTime = [0, 0], prevValue = null;
            const sortedNodes = this.nodes.sort((a, b) => a.time[0] > b.time[0] || a.time[0] == b.time[0] && a.time[1] > b.time[1] ? 1 : -1)
            for (let i = 0; i < sortedNodes.length; i++) {
                const node = sortedNodes[i];
                data.push({
                    "startTime": prevTime,
                    "endTime": node.time,
                    "easing": prevValue ? node.easingTypeInput.rawString : "constant",
                    "start": prevValue ?? node.value,
                    "end": node.value
                });
                prevTime = node.time;
                prevValue = node.value;
                
            }
            //data = data.sort((a, b) => a.startTime[0] > b.startTime[0] || a.startTime[0] == b.startTime[0] && a.startTime[1] > b.startTime[1] ? 1 : -1);
        }
        return data;
    }
}


