import { _decorator, Component, Event, EventKeyboard, Input, input, instantiate, Node, Prefab, Size, sp, systemEvent, view } from 'cc';
import { ChartEditor } from './ChartEditor';
import { MeasureLine } from './MeasureLine';
import { ChartPlayer } from '../chart/ChartPlayer';
const { ccclass, property } = _decorator;

@ccclass('MeasureLinePool')
export class MeasureLinePool extends Component {
    public readonly measureLineBeatGap: number = 0.2

    @property(Prefab)
    measureLinePrefab: Prefab = null;

    public currentTime: [number, number] = [0, 0];
    public topViewTime: [number, number] = [0, 0];
    public measureLineSplit = 8

    resolution: Size;
    barHeight: number;
    renderBarCount: number = 0; 
    private _pool: MeasureLine[] = [];
    private static instance: MeasureLinePool

    public get pool() {
        return this._pool;
    }

    public static get Instance() {
        return this.instance;
    }

    onLoad() {
        MeasureLinePool.instance = this;
        input.on(Input.EventType.MOUSE_WHEEL, (event) => this.scroll(event.getScrollY() * 0.25), this);
    }

    clear() {
        for (const node of this._pool) {
            node.node.destroy();
        }
        this._pool = [];
    }

    scroll(speed: number) {
        const UPBar = ChartPlayer.Instance.UPB * ChartEditor.Instance.bpb;
        this.currentTime[1] += speed;
        if (this.currentTime[1] < 0) {
            if (this.currentTime[0] == 0) {
                this.currentTime[1] = 0;
            } else {
                this.currentTime[0]--;
                this.currentTime[1] += UPBar;
            }
        } else if (this.currentTime[1] >= UPBar) {
            this.currentTime[0]++;
            this.currentTime[1] -= UPBar;
        }
    }

    update(dt: number) {
        this.topViewTime = [this.currentTime[0] + this.renderBarCount, this.currentTime[1]];
    }

    timeInRange([targetBar, targetUnit], [startBar, startUnit], [endBar, endUnit]) {
        return (startBar < targetBar || startBar == targetBar && startUnit <= targetUnit) && (targetBar < endBar || targetBar == endBar && targetUnit < endBar);
    }

    initializePool() {
        const bpb = ChartEditor.Instance.bpb;
        this.resolution = view.getDesignResolutionSize();
        this.barHeight = this.resolution.height * this.measureLineBeatGap * bpb;
        this.renderBarCount = 4 / bpb;
        for (let beat = 0; beat < 4; beat++) {
            for (let unit = 0; unit < 12; unit++) {
                const node = instantiate(this.measureLinePrefab);
                const measureLine = node.getComponent(MeasureLine);
                measureLine.time = [Math.floor(beat / bpb), ChartPlayer.Instance.UPB * (beat % bpb + unit / 12)];
                measureLine.pool = this;
                measureLine.unitIndex = unit;
                this._pool.push(measureLine);
                this.node.addChild(node);
            }
        }
    }

    rearrangePoolWithSplit(split: number) {
        this.measureLineSplit = split;
        this._pool.forEach((measureLine) => {
            if (measureLine.unitIndex < split) {
                measureLine.enabled = true;
                measureLine.on();
                measureLine.time = [measureLine.time[0], measureLine.time[1] - measureLine.time[1] % ChartPlayer.Instance.UPB + ChartPlayer.Instance.UPB * measureLine.unitIndex / split];
            } else {
                measureLine.enabled = false;
                measureLine.off();
                measureLine.opacity.opacity = 0;
            }
        })
    }
}


