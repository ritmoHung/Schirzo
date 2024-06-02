import { _decorator, Component, instantiate, Node, Prefab, v2, v3 } from 'cc';
import { Timeline } from './input/Timeline';
import { TimelineNode } from './input/TimelineNode';
import { ChartEditor } from './ChartEditor';
import { Chart } from '../lib/Chart';
import { MeasureLinePool } from './MeasureLinePool';
const { ccclass, property } = _decorator;

@ccclass('TimelinePool')
export class TimelinePool extends Component {
    @property(Prefab)
    timelineNodePrefab: Prefab = null;
    @property(Timeline)
    positionTimeline: Timeline = null;
    @property(Timeline)
    speedTimeline: Timeline = null;
    @property(Timeline)
    opacityTimeline: Timeline = null;
    @property(Timeline)
    textTimeline: Timeline = null;

    array: Timeline[];
    selectOn: Timeline = null;

    private static instance: TimelinePool = null;

    public static get Instance() {
        return this.instance;
    }

    onLoad() {
        TimelinePool.instance = this;
        this.array = [this.positionTimeline, this.opacityTimeline, this.speedTimeline, this.textTimeline];
    }

    update(dt: number) {
        const object = ChartEditor.Instance.eventProperties.eventFilterToggle.selectionIndex;
        if (ChartEditor.Instance.selectedJudgePoint) {
            this.node.position = v3(ChartEditor.Instance.selectedJudgePoint.node.position.x - MeasureLinePool.Instance.resolution.width/2, 0);
        }
        for (let i = 0; i < 4; i++) {
            this.array[i].node.active = ChartEditor.Instance.selectedJudgePoint && object[i];
            if (this.selectOn && !this.selectOn.node.active) {
                this.selectOn.select(false);
                this.selectOn = null;
            }
        }
    }

    select(type: number) {
        for (let i = 0; i < 4; i++) {
            this.array[i].select(i == type as number);
        }
        this.selectOn = this.array[type];
    }

    createNode(time: [number, number], rightClick: boolean) {
        if (this.selectOn) {
            this.selectOn.createNode(time, rightClick);
        }
    }

    loadTimelines(judgePointData) {
        this.positionTimeline.loadChart(judgePointData.positionEvents);
        this.speedTimeline.loadChart(judgePointData.speedEvents);
        this.opacityTimeline.loadChart(judgePointData.opacityEvents);
    }

    publishTimelines() {
        if (!ChartEditor.Instance.selectedJudgePointData) return
        ChartEditor.Instance.selectedJudgePointData.positionEvents = this.positionTimeline.publishChart();
        ChartEditor.Instance.selectedJudgePointData.speedEvents = this.speedTimeline.publishChart();
        ChartEditor.Instance.selectedJudgePointData.opacityEvents = this.opacityTimeline.publishChart();
        return {
            positionEvents: this.positionTimeline.publishChart(),
            speedEvents: this.speedTimeline.publishChart(),
            opacityEvents: this.opacityTimeline.publishChart()
        }
    }

    publishTextEvent() {
        ChartEditor.Instance.chartData.textEventList = this.textTimeline.publishChart();
    }
}


