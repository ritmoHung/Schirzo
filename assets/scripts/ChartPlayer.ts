import { _decorator, AudioClip, AudioSource, Button, Component, JsonAsset, Prefab, resources } from "cc";
import { GlobalSettings } from "./GlobalSettings";
import { JudgePointPool } from "./JudgePointPool";
import { ChartText } from "./ChartText";
const { ccclass, property } = _decorator;

interface BPMEvent {
    startTime: [number, number];
    endTime: [number, number];
    bpm: [number, number, number];
}

interface Event {
    startTime: [number, number] | number;
    endTime: [number, number] | number;
    easing: string;
    start: number;
    end: number;
}

interface JudgePoint {
    noteList: any[];
    speedEvents: Event[];
    positionEvents: Event[];
    rotateEvents: Event[];
    opacityEvents: Event[];
}

@ccclass("ChartPlayer")
export class ChartPlayer extends Component {
    @property(Button)
    startButton: Button | null = null

    @property(Button)
    pauseButton: Button | null = null

    @property(Prefab)
    clickNotePrefab: Prefab | null = null

    @property(AudioSource)
    audioSource: AudioSource | null = null

    @property(JudgePointPool)
    judgePointPool: JudgePointPool

    @property(ChartText)
    chartText: ChartText

    private static instance: ChartPlayer;
    private songPath: string = "miserable";
    private globalTime: number = 0;
    private settings: GlobalSettings;
    private UPB = 120;  // Units per beat

    

    // # Lifecycle
    constructor() {
        super();
        this.settings = GlobalSettings.getInstance();
    }

    public static get Instance() {
        return this.instance;
    }

    onLoad() {
        ChartPlayer.instance = this;
        if (this.startButton) {
            this.startButton.node.on("click", () => this.startGame());
        }
        if (this.pauseButton) {
            this.pauseButton.node.on("click", () => this.pauseMusic());
        }
    }

    start() {
        if (this.audioSource) {
            this.loadMusic(`songs/${this.songPath}/base`);
        } else {
            console.error("AudioSource component is not attached.");
        }
    }

    update(deltaTime: number) {
        if (this.audioSource && this.audioSource.playing) {
            this.globalTime += deltaTime;
        }
    }



    // # Functions
    loadMusic(path: string) {
        resources.load(path, AudioClip, (error, clip: AudioClip) => {
            if (error) {
                console.error("Failed to load music:", error);
                return;
            }

            if (this.audioSource) {
                this.audioSource.clip = clip;
            }
        });
    }

    playMusic() {
        if (this.audioSource && this.audioSource.clip) {
            this.audioSource.play();
            console.log("Music playing");
        }
    }

    pauseMusic() {
        if (this.audioSource) {
            if (this.audioSource.playing) {
                this.audioSource.pause();
            } else {
                this.audioSource.play();
            }
        }
    }

    playSfx(clip: AudioClip) {
        if (this.audioSource && clip) {
            this.audioSource.playOneShot(clip, 1.0);
        } else {
            console.log("ERROR");
        }
    }

    loadChart(path: string) {
        resources.load(path, JsonAsset, (error, res: JsonAsset) => {
            if (error) {
                console.error("Failed to load chart:", error);
                return;
            }

            const chartData = res.json!;
            const bpmEvents = chartData.bpmEvents;
            const textEvents = chartData.textEventList.map(textEvent =>
                this.covertTextEvent(textEvent, bpmEvents)
            )
            const judgePoints = chartData.judgePointList.map(judgePoint =>
                this.convertJudgePointEvents(judgePoint, bpmEvents)
            );

            this.judgePointPool.createJudgePoints(judgePoints);
            this.chartText.initialize(textEvents);
        });
    }

    covertTextEvent(textEvent: any, bpmEvents: BPMEvent[]) {
        return {
            ...textEvent,
            time: Array.isArray(textEvent.time) ? this.convertToSeconds(textEvent.time, bpmEvents) + this.settings.offset : textEvent.time + this.settings.offset,
        }
    }

    convertJudgePointEvents(judgePoint: JudgePoint, bpmEvents: BPMEvent[]): JudgePoint {
        const convertEventTimings = (events: Event[]): Event[] =>
            events.map(event => ({
                ...event,
                startTime: Array.isArray(event.startTime) ? this.convertToSeconds(event.startTime, bpmEvents) + this.settings.offset : event.startTime + this.settings.offset,
                endTime: Array.isArray(event.endTime) ? this.convertToSeconds(event.endTime, bpmEvents) + this.settings.offset : event.endTime + this.settings.offset,
            }))

        const convertNoteTimings = (notes: any[]): any[] =>
            notes.map(note => ({
                ...note, 
                time: Array.isArray(note.time) ? this.convertToSeconds(note.time, bpmEvents) + this.settings.offset : note.time + this.settings.offset,
            }))

        return {
            ...judgePoint,
            noteList: convertNoteTimings(judgePoint.noteList),
            speedEvents: convertEventTimings(judgePoint.speedEvents),
            positionEvents: convertEventTimings(judgePoint.positionEvents),
            rotateEvents: convertEventTimings(judgePoint.rotateEvents),
            opacityEvents: convertEventTimings(judgePoint.opacityEvents)
        };
    }

    convertToSeconds(barBeat: [number, number], bpmEvents: BPMEvent[]): number {
        const targetBar = barBeat[0];
        const targetBeat = barBeat[1] / this.UPB;

        let totalTime = 0;
        for (const event of bpmEvents) {
            const [bpm, bpb, unit] = event.bpm;
            const [startBar, startBeat] = event.startTime;
            const [endBar, endBeat] = event.endTime;

            const effectiveBPM = bpm * (4 / unit);
            const beatDuration = 60 / effectiveBPM;
            const barDuration = bpb * beatDuration;

            // Out of an event's range if:
            // 1. Target bar > event's end bar
            // 2. Target bar = event's end bar, but target beat > event's end beat
            if (targetBar > endBar || (targetBar === endBar && targetBeat > endBeat)) {
                totalTime += (endBar - startBar) * barDuration + (endBeat - startBeat) * beatDuration;
            } else {
                totalTime += (targetBar - startBar) * barDuration + (targetBeat - startBeat) * beatDuration;
                break;
            }
        }

        return totalTime;
    }

    startGame() {
        this.audioSource.stop();
        this.judgePointPool.reset();
        this.loadChart(`songs/${this.songPath}/2`);
        this.globalTime = 0;

        this.scheduleOnce(() => {
            this.playMusic();
        }, 1);
    }

    getGlobalTime() {
        return this.globalTime;
    }
}