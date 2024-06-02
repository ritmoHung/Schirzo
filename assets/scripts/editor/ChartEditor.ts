import { _decorator, assetManager, AudioClip, AudioSource, Button, clamp, Color, Component, EditBox, instantiate, Label, Node, Prefab, Size, tween, v3, view } from 'cc';
import { NumericInput } from './input/NumericInput';
import { Chart } from '../lib/Chart';
import { MeasureLinePool } from './MeasureLinePool';
import { Note } from '../chart/notes/Note';
import { EventProperties } from './EventProperties';
import { NoteProperties } from './NoteProperties';
import { EditorJudgePoint } from './EditorJudgePoint';
import { ChartPlayer } from '../chart/ChartPlayer';
import { JudgePointPool } from '../chart/JudgePointPool';
import { ProgressSlider } from '../chart/ProgressSlider';
import { TimelinePool } from './TimelinePool';
const { ccclass, property } = _decorator;

@ccclass('ChartEditor')
export class ChartEditor extends Component {
    @property(Button)
    saveButton: Button = null;
    @property(Button)
    renewButton: Button = null;
    @property(Button)
    playButton: Button = null;
    @property(Label)
    startLabel: Label = null;
    @property(Button)
    backButton: Button = null;
    @property(Button)
    importMusicButton: Button = null;
    @property(Label)
    musicNameLabel: Label = null;
    @property(Label)
    musicProgressLabel: Label = null;

    @property(Node)
    musicNotImportedNode: Node = null;
    @property(Node)
    musicImportedNode: Node = null;

    @property(Node)
    holdNoteNotFinishedNode: Node = null;

    @property(Node)
    judgePointPoolNode: Node = null;
    @property(EditBox)
    bpmEditbox: EditBox = null;
    @property(EditBox)
    bpbEditbox: EditBox = null;
    @property(EditBox)
    durationEditbox: EditBox = null;

    @property(Node)
    judgePointNotSelectedNode: Node = null;
    @property(Node)
    judgePointSelectedNode: Node = null;

    @property(NumericInput)
    measureLineSplitInput: NumericInput = null;
    @property(NumericInput)
    judgePointInput: NumericInput = null;
    @property(NumericInput)
    editTargetInput: NumericInput = null;

    @property(NoteProperties)
    noteProperties: NoteProperties = null;
    @property(EventProperties)
    eventProperties: EventProperties = null;

    @property(Prefab)
    editorHoldNotePrefab: Prefab = null;

    @property(AudioSource)
    audioSource: AudioSource = null;
    @property(ProgressSlider)
    progressSlider: ProgressSlider = null;
    @property(Button)
    musicControlButton: Button = null;

    public selectedJudgePoint: EditorJudgePoint = null;

    bpm: number = 0;
    bpb: number = 0;
    duration: number = 0;
    judgePointPool: JudgePointPool = null;
    chartData: Record<string, any>;
    holdSetting = false;

    private previewNote: Node = null;
    private isHovering: boolean;
    private currentHoverY: number;
    private currentHoverTime: [number, number];
    private _endTime: [number, number];

    public get endTime() {
        return this._endTime;
    }

    private resolution: Size
    private audioFile: File

    private static instance: ChartEditor = null;
    public static get Instance(): ChartEditor {
        return this.instance;
    }

    public get selectedJudgePointData() {
        return ChartEditor.Instance.selectedJudgePoint ? ChartEditor.Instance.chartData.judgePointList[ChartEditor.Instance.selectedJudgePoint.index] : null;
    }

    onLoad() {
        ChartEditor.instance = this;
        this.resolution = view.getDesignResolutionSize();
        this.judgePointPool = this.judgePointPoolNode.getComponent(JudgePointPool);

        this.progressSlider.enabled = false;
        this.playButton.interactable = false;
        this.updateMusicProps();
        this.musicControlButton.node.on("click", this.toggleMusic, this);
        this.backButton.node.on("click", this.back, this);
        this.renewButton.node.on("click", this.clearData, this);
        this.saveButton.node.on("click", this.saveChart, this);
        this.importMusicButton.node.on("click", this.importMusic, this);
        this.measureLineSplitInput.node.on("change", this.updateMeasureLineProps, this);
        this.judgePointInput.node.on("change", this.updateJudgePointPool, this);
        this.editTargetInput.node.on("change", this.propsUpdate, this);
        this.bpmEditbox.node.on("change", (value) => this.bpm = Number.parseInt(value), this);
        this.bpbEditbox.node.on("change", (value) => this.bpb = Number.parseInt(value), this);
        this.durationEditbox.node.on("change", (value) => this.duration = Number.parseInt(value), this);
    }

    back() {
        // TODO: Back to menu scene
    }

    start() {
        this.clearData();
    }

    onDestroy() {
        ChartEditor.instance = null;
    }

    update(dt: number) {
        this.updateBeatHoverLabel();
        this.updateJudgePointProps();
        this.updateMusicProps();
        if (this.audioSource && this.audioSource.playing) {
            const progress = this.audioSource.currentTime / this.duration;
            this.progressSlider.updateProgress(progress);
        }
    }

    public togglePauseButton(pause: boolean) {
        if (pause) {
            this.startLabel.string = "STart";
        } else {
            this.startLabel.string = "pAuse";
        }
    }

    toggleMusic() {
        if (!this.audioSource || !this.audioSource.clip) return;
        const label = this.musicControlButton.node.getChildByName("Label").getComponent(Label);
        if (this.audioSource.playing) {
            label.string = "▶";
            this.audioSource.pause();
        } else {
            label.string = "| |";
            this.audioSource.play();
        }
    }

    playMusic() {
        if (!this.audioSource || !this.audioSource.clip || !this.audioSource.playing) return;
        const label = this.musicControlButton.node.getChildByName("Label").getComponent(Label);
        label.string = "| |";
        this.audioSource.play();
    }

    // Note
    public get hoverTime() {
        return this.currentHoverTime;
    }

    public set hoverTime(time: [number, number]) {
        this.currentHoverTime = time;
        this.isHovering = true;
    }

    public set hoverY(y: number) {
        this.currentHoverY = y;
    }

    public get hoverY() {
        return this.currentHoverY;
    }

    public endMeasureLineHover() {
        this.isHovering = false;
        this.previewNote.active = false;
    }

    public get isPreviewNodeExists() {
        return this.previewNote != null;
    }

    updatePreviewNote() {
        if (this.previewNote) {
            this.previewNote.destroy();
        }
        if (this.selectedJudgePoint) {
            this.previewNote = instantiate(ChartPlayer.Instance[`${this.noteProperties.noteTypeInput.string}NotePrefab`]);
            const comp = this.previewNote.getComponents(Component).find((component) => component instanceof Note);
            comp.keydownListen = false;
            comp.enabled = false;
            this.previewNote.position = v3(this.selectedJudgePoint.node.position.x - this.resolution.width / 2, (this.isHovering) ? this.hoverY - this.resolution.height / 2 : -100);
            this.node.addChild(this.previewNote);
        }
    }

    updatePreviewNotePosition(y: number) {
        if (this.selectedJudgePoint && this.previewNote) {
            this.isHovering = true;
            this.previewNote.active = true;
            this.previewNote.position = v3(this.selectedJudgePoint.node.position.x - this.resolution.width / 2, clamp(y, this.selectedJudgePoint.node.position.y, this.resolution.height) - this.resolution.height / 2);
            this.hoverY = y;
        }
    }

    // Judge point selection
    selectJudgePoint(object: EditorJudgePoint) {
        this.updateJudgePointProps();
        TimelinePool.Instance.publishTimelines();
        for (const sprite of this.judgePointPool.sprites) {
            if (sprite.node.parent.uuid == object.node.uuid) {
                sprite.color = new Color("#FFFFFF");
                tween(sprite.node).to(0.1, { scale: v3(1.1, 1.1, 1) }, { easing: "sineInOut" }).start();
            } else {
                sprite.color = new Color("#999999");
                tween(sprite.node).stop().to(0.1, { scale: v3(1, 1, 1) }, { easing: "sineInOut" }).start();
            }
        }
        this.selectedJudgePoint = object;
        TimelinePool.Instance.loadTimelines(this.selectedJudgePointData);
    }

    // Control
    updateMeasureLineProps(value: string) {
        MeasureLinePool.Instance.rearrangePoolWithSplit(Number.parseInt(value));
    }

    updateJudgePointPool(value: string) {
        const count = Number.parseInt(value);
        if (count > this.judgePointPool.pool.length) {
            const size = view.getDesignResolutionSize();
            const clone = structuredClone(Chart.distributedJudgePoint(count - 1));
            this.chartData.judgePointList.push(clone);
            const node = this.judgePointPool.createJudgePoint(clone);
            node.position = v3(0.2 + 0.15 * (count - 1), 0.2).multiply3f(size.width, size.height, 0);
            node.getComponent(EditorJudgePoint).index = count - 1;
        } else if (count < this.judgePointPool.pool.length) {
            this.chartData.judgePointList.pop();

            const removedNode = this.judgePointPool.popJudgePoint();
            if (this.selectedJudgePoint && this.selectedJudgePoint.node.uuid == removedNode.uuid) {
                this.selectedJudgePoint = null;
                this.endMeasureLineHover();
            }
            removedNode.destroy();
        }
        //ChartPlayer.Instance.reloadChart();
    }

    propsUpdate(value: string) {
        if (value == "note") {
            this.eventProperties.node.active = false;
            this.noteProperties.node.active = true;
        } else if (value == "event") {
            this.noteProperties.node.active = false;
            this.eventProperties.node.active = true;

        }
    }

    clearData() {
        this.chartData = structuredClone(Chart.defaultJson);
        this.progressSlider.enabled = false;
        this.playButton.interactable = false;
        this.selectedJudgePoint = null;
        this.holdSetting = false;
        this.musicNameLabel.string = "";
        this.bpmEditbox.string = "";
        this.bpbEditbox.string = "";
        this.durationEditbox.string = "";
        this.editTargetInput.clear();
        this.judgePointInput.clear();
        this.measureLineSplitInput.clear();
        MeasureLinePool.Instance.clear();
        this.judgePointPool.reset();
        this.judgePointPoolNode.removeAllChildren();
        this.audioSource.clip = null;
        if (this.previewNote) {
            this.previewNote.destroy();
            this.previewNote = null;
        }
    }

    saveChart() {
        TimelinePool.Instance.publishTimelines();
        TimelinePool.Instance.publishTextEvent();

        const file = new File([JSON.stringify(this.publishChart())], "2.json", {type: "text/plain"});
        const a = document.createElement("a");
        a.href = URL.createObjectURL(file);
        a.download = "2.json";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        console.log(this.publishChart());
    }

/* 
    importChart() {
        let input = document.createElement("input");
        input.setAttribute("type", "file");
        input.setAttribute("accept", ".json");
        input.setAttribute("style", "display:none");
        document.body.appendChild(input);
        input.addEventListener("input", async (event) => {
            const file = (event.target as HTMLInputElement).files[0];
            const json = JSON.parse(await file.text()) as Record<string, any>;
            this.chartData = json;
        })
        input.click();
    }
*/

    importMusic() {
        let input = document.createElement("input");
        input.setAttribute("type", "file");
        input.setAttribute("accept", "audio/ogg");
        input.setAttribute("style", "display:none");
        document.body.appendChild(input);
        input.addEventListener("input", (event) => {
            let file = (event.target as HTMLInputElement).files[0];
            this.audioFile = file;
            ChartEditor.Instance.musicNameLabel.string = "loAding...";
            assetManager.loadRemote<AudioClip>(URL.createObjectURL(file), { "ext": ".ogg" }, (err, clip) => {
                if (!err) {
                    this.bpm = 160; this.bpmEditbox.string = "160";
                    this.bpb = 4; this.bpbEditbox.string = "4";
                    this.audioSource.clip = clip;
                    this.duration = Math.ceil(clip.getDuration());
                    this.durationEditbox.string = `${this.duration}`;

                    MeasureLinePool.Instance.initializePool();
                    MeasureLinePool.Instance.rearrangePoolWithSplit(4);
                    ChartEditor.Instance.musicNameLabel.string = file.name;

                    this.progressSlider.enabled = true;
                    this.playButton.interactable = true;

                    this.updateEndTime();
                }
            })
        })
        input.click();
    }

    progressToTime(progress: number): [number, number] {
        const time = progress * this.duration
        const beats = Math.ceil(time * this.bpm / 60);
        const bars = Math.floor(beats / this.bpb);
        const units = (beats % this.bpb) * ChartPlayer.Instance.UPB;
        return [bars, units];
    }

    updateEndTime() {
        const beats = Math.ceil(this.duration * this.bpm / 60);
        const bars = Math.floor(beats / this.bpb);
        const units = (beats % this.bpb) * ChartPlayer.Instance.UPB;
        this._endTime = [bars, units];
    }

    setEditorTimeByProgress(progress: number) {
        const time = ChartEditor.Instance.progressToTime(progress);
        this.updateMusicProgress(time);
        if (!MeasureLinePool.Instance) return;
        MeasureLinePool.Instance.currentTime = time;
        MeasureLinePool.Instance.pull();
    }

    updateMusicProgress(time: [number, number]) {
        const second = (time[0] * this.bpb + time[1] / ChartPlayer.Instance.UPB) * 60 / this.bpm;
        if (second > 0 && second < this.duration) {
            this.audioSource.stop();
            this.audioSource.currentTime = second;
            this.playMusic();
            console.log("test");
            this.progressSlider.updateProgress(second / this.duration);
        }
    }

    updateBeatHoverLabel() {
        if (!this.audioSource.clip) {
            this.musicProgressLabel.string = "no Music"
        } else if (!this.isHovering) {
            this.musicProgressLabel.string = "not hoVering"
        } else {
            this.musicProgressLabel.string = ` bar ${this.currentHoverTime[0]}, beAt ${Math.floor(this.currentHoverTime[1] / ChartPlayer.Instance.UPB)}, uniT ${this.currentHoverTime[1] % ChartPlayer.Instance.UPB}/${ChartPlayer.Instance.UPB}`
        }
    }

    updateMusicProps() {
        if (this.audioSource.clip) {
            this.musicNotImportedNode.active = false;
            this.musicControlButton.node.active = true;
            if (this.holdSetting) {
                this.holdNoteNotFinishedNode.active = true;
                this.musicImportedNode.active = false;
            } else {
                this.holdNoteNotFinishedNode.active = false;
                this.musicImportedNode.active = true;
            }
        } else {
            this.musicNotImportedNode.active = true;
            this.musicControlButton.node.active = false;
            this.musicImportedNode.active = false;
        }
    }

    updateJudgePointProps() {
        if (this.selectedJudgePoint) {
            this.judgePointNotSelectedNode.active = false;
            this.judgePointSelectedNode.active = true;
        } else {
            this.judgePointNotSelectedNode.active = true;
            this.judgePointSelectedNode.active = false;
        }
    }

    publishChart() {
        return {
            ...this.chartData,
            bpm: [this.bpm, this.bpb, 4],
            bpmEvents: [
                {
                    startTime: [0, 0],
                    endTime: this.endTime,
                    bpm: [this.bpm, this.bpb, 4],
                }
            ]
        }
    }
}


