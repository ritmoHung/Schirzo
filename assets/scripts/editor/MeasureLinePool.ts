import { _decorator, Component, EventKeyboard, Input, input, instantiate, KeyCode, Node, Prefab, Size, view } from 'cc';
import { ChartEditor } from './ChartEditor';
import { MeasureLine } from './MeasureLine';
import { ChartPlayer } from '../chart/ChartPlayer';
const { ccclass, property } = _decorator;

@ccclass('MeasureLinePool')
export class MeasureLinePool extends Component {
    public readonly measureLineBeatGap: number = 0.2

    @property(Node)
    scroller: Node = null;
    @property(Prefab)
    measureLinePrefab: Prefab = null;

    public currentTime: [number, number] = [0, 0];
    public topViewTime: [number, number] = [0, 0];
    public measureLineSplit = 8

    resolution: Size;
    barHeight: number;
    renderBarCount: [number, number] = [0, 0]; 

    private _pool: MeasureLine[] = [];
    private keyHold: number = 0;

    private static instance: MeasureLinePool;
    public get pool() {
        return this._pool;
    }

    public static get Instance() {
        return this.instance;
    }

    onLoad() {
        MeasureLinePool.instance = this;
        input.on(Input.EventType.MOUSE_WHEEL, (event) => this.scroll(event.getScrollY() * 0.25), this);
        input.on(Input.EventType.KEY_DOWN, this.scrollByKey, this);
        input.on(Input.EventType.KEY_PRESSING, this.scrollByKey, this);
        input.on(Input.EventType.KEY_UP, () => this.keyHold = 0, this);
    }

    /*
    onDestroy() {
        input.off(Input.EventType.MOUSE_WHEEL, (event) => this.scroll(event.getScrollY() * 0.25), this);
        input.off(Input.EventType.KEY_DOWN, this.scrollByKey, this);
        input.off(Input.EventType.KEY_PRESSING, this.scrollByKey, this);
        input.off(Input.EventType.KEY_UP, () => this.keyHold = 0, this);
    }*/

    clear() {
        for (const node of this._pool) {
            node.node.destroy();
        }
        this._pool = [];
    }

    pull() {
        for (const node of this._pool) {
            node.pull();
        }
    }

    updateTime() {
        for (const node of this._pool) {
            node.updateTime();
        }
    }

    scrollByKey(event: EventKeyboard) {
        this.keyHold++;
        const speed = (this.keyHold > 48) ? 240 : (this.keyHold > 16) ? 40 : (this.keyHold > 6) ? 20 : 10;
        if (speed == 240) {
            this.pull();
        }

        if (event.keyCode == KeyCode.KEY_W) {
            this.scroll(speed);
        } else if (event.keyCode == KeyCode.KEY_S) {
            this.scroll(-speed);
        }
    }

    scroll(unit: number) {
        if (!ChartEditor.Instance.endTime) return
        const UPBar = ChartPlayer.Instance.editorUPB * ChartEditor.Instance.bpb;
        this.currentTime[1] += unit;
        if (unit > 0 && this.currentTime[0] >= ChartEditor.Instance.endTime[0]) {
            this.currentTime[1] -= unit;
            return;
        } else if (this.currentTime[1] < 0) {
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
        ChartEditor.Instance.updateMusicProgress(this.currentTime);
    }

    update(dt: number) {
        this.topViewTime = [this.currentTime[0] + this.renderBarCount[0], this.currentTime[1] + this.renderBarCount[1]];
    }

    initializePool() {
        const bpb = ChartEditor.Instance.bpb;
        this.resolution = view.getDesignResolutionSize();
        this.barHeight = this.resolution.height * this.measureLineBeatGap * bpb;
        this.renderBarCount = [Math.floor(4 / bpb), Math.floor(4 % bpb) * 120];
        for (let beat = 0; beat < 4; beat++) {
            for (let unit = 0; unit < 12; unit++) {
                const node = instantiate(this.measureLinePrefab);
                const measureLine = node.getComponent(MeasureLine);
                measureLine.time = [Math.floor(beat / bpb), ChartPlayer.Instance.editorUPB * (beat % bpb + unit / 12)];
                measureLine.pool = this;
                measureLine.unitIndex = unit;
                this._pool.push(measureLine);
                this.node.addChild(node);
            }
        }
    }

    rearrangePoolWithBpb(bpb: number) {
        if (bpb <= 0) return;
        this.resolution = view.getDesignResolutionSize();
        this.barHeight = this.resolution.height * this.measureLineBeatGap * bpb;
        this.renderBarCount = [Math.floor(4 / bpb), Math.floor(4 % bpb) * 120];
        for (let beat = 0; beat < 4; beat++) {
            for (let unit = 0; unit < 12; unit++) {
                const node = this.pool[beat * 12 + unit];
                const measureLine = node.getComponent(MeasureLine);
                measureLine.time = [Math.floor(beat / bpb), ChartPlayer.Instance.editorUPB * (beat % bpb + unit / 12)];
                console.log(measureLine.time[0],  measureLine.time[1])
            }
        }
        this.updateTime();
        this.pull();
    }

    rearrangePoolWithSplit(split: number) {
        this.measureLineSplit = split;
        this._pool.forEach((measureLine) => {
            if (measureLine.unitIndex < split) {
                measureLine.enabled = true;
                measureLine.on();
                measureLine.time = [measureLine.time[0], measureLine.time[1] - measureLine.time[1] % ChartPlayer.Instance.editorUPB + ChartPlayer.Instance.editorUPB * measureLine.unitIndex / split];
            } else {
                measureLine.enabled = false;
                measureLine.off();
                measureLine.opacity.opacity = 0;
            }
        })
    }
}


