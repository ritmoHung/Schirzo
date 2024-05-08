import { _decorator, AudioClip, AudioSource, Button, Component, JsonAsset, Prefab, resources } from "cc";
import { GlobalSettings } from "./GlobalSettings";
import { JudgePointPool } from "./JudgePointPool";
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
    notePrefab: Prefab | null = null

    @property(AudioSource)
    audioSource: AudioSource | null = null

    @property(JudgePointPool)
    judgePointPool: JudgePointPool

    private static instance: ChartPlayer;
    private songPath: string = "rip";
    private globalTime: number = 0;
    private settings: GlobalSettings;

    

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

    onEnable() {
        this.audioSource.node.on(AudioSource.EventType.STARTED, this.onAudioStarted, this);
    }

    onAudioStarted() {
    }

    start() {
        if (this.audioSource) {
            this.loadMusic(`songs/${this.songPath}/base`);
        } else {
            console.error("AudioSource component is not attached.");
        }
        
        this.loadChart(`songs/${this.songPath}/2`);
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
            const judgePoints = chartData.judgePointList.map(judgePoint =>
                this.convertJudgePointEvents(judgePoint, bpmEvents)
            );

            // console.log(judgePoints);
            this.judgePointPool.createJudgePoints(judgePoints);
        });
    }

    convertJudgePointEvents(judgePoint: JudgePoint, bpmEvents: BPMEvent[]): JudgePoint {
        const convertEventTimings = (events: Event[]): Event[] =>
            events.map(event => ({
                ...event,
                startTime: Array.isArray(event.startTime) ? this.convertToSeconds(event.startTime, bpmEvents) : event.startTime,
                endTime: Array.isArray(event.endTime) ? this.convertToSeconds(event.endTime, bpmEvents) : event.endTime,
            }))

        return {
            ...judgePoint,
            speedEvents: convertEventTimings(judgePoint.speedEvents),
            positionEvents: convertEventTimings(judgePoint.positionEvents),
            rotateEvents: convertEventTimings(judgePoint.rotateEvents),
            opacityEvents: convertEventTimings(judgePoint.opacityEvents)
        };
    }

    convertToSeconds(barBeat: [number, number], bpmEvents: BPMEvent[]): number {
        let totalTime = 0;
        let prevEndBar = 0, prevEndBeat = 0;

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
            if (barBeat[0] > endBar || (barBeat[0] === endBar && barBeat[1] > endBeat)) {
                totalTime += (endBar - startBar) * barDuration + (endBeat - startBeat) * beatDuration;
            } else {
                totalTime += (barBeat[0] - startBar) * barDuration + (barBeat[1] - startBeat) * beatDuration;
                break;
            }

            prevEndBar = endBar;
            prevEndBeat = endBeat;
        }

        return totalTime;
    }

    startGame() {
        this.audioSource.stop();
        this.globalTime = 0;

        this.scheduleOnce(() => {
            this.playMusic();
        }, 1);
    }

    getGlobalTime() {
        return this.globalTime;
    }
}