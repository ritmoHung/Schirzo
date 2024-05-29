import { _decorator, AudioClip, AudioSource, Button, Component, director, JsonAsset, Prefab, resources } from "cc";
import { GlobalSettings } from "../GlobalSettings";
import { ChartData, FirebaseManager } from "../lib/FirebaseManager";
import { JudgePointPool } from "../chart/JudgePointPool";
import { ProgressSlider } from "../chart/ProgressSlider";
import { ChartText } from "../chart/ChartText";
import { BPMEventData, EventData, JudgePointData } from "../lib/Chart";
import { UIManager } from "./UIManager";
const { ccclass, property } = _decorator;

@ccclass("ChartEditor")
export class ChartEditor extends Component {
    @property(Button)
    startButton: Button | null = null
    @property(Button)
    restartButton: Button | null = null

    @property(Prefab)
    clickNotePrefab: Prefab | null = null
    @property(Prefab)
    keyNotePrefab: Prefab | null = null
    @property(Prefab)
    dragNotePrefab: Prefab | null = null
    @property(Prefab)
    holdNotePrefab: Prefab | null = null

    @property(AudioSource)
    audioSource: AudioSource | null = null

    @property(JudgePointPool)
    judgePointPool: JudgePointPool

    @property(ProgressSlider)
    progressSlider: ProgressSlider

    @property(ChartText)
    chartText: ChartText

    private static instance: ChartEditor
    
    public chartData: ChartData = {chart: null, audio: null};

    private songDuration: number = 0;
    private globalTime: number = 0
    private settings: GlobalSettings
    private UPB = 120  // Units per beat

    

    // # Lifecycle
    constructor() {
        super();
        this.settings = GlobalSettings.getInstance();
    }

    public static get Instance() {
        return this.instance;
    }

    onLoad() {
        GlobalSettings.getInstance().editing = true;
        ChartEditor.instance = this;
        this.startButton.node.on("click", this.toggleMusic, this);
        this.restartButton.node.on("click", this.restartGame, this);
        console.log(this.audioSource);
    }

    onAudioEnded() {
        console.log("SONG ENDED");
        this.scheduleOnce(function() {
            director.loadScene("result");
        }, 3);
    }

    update(deltaTime: number) {
        if (this.audioSource && this.audioSource.playing) {
            this.globalTime += deltaTime;

            const progress = this.audioSource.currentTime / this.songDuration;
            this.progressSlider.updateProgress(progress);
        }
    }

    onDestroy() {
        this.audioSource.node.off("ended", this.onAudioEnded, this);
    }


    // # Functions
    loadMusic(clip: AudioClip) {
        this.audioSource.clip = clip;
        this.songDuration = clip.getDuration();
        this.progressSlider.initialize(clip.getDuration());
    }

    playMusic() {
        if (this.audioSource && this.audioSource.clip) {
            this.audioSource.play();
        }
    }

    pauseMusic() {
        if (this.audioSource && this.audioSource.playing) {
            this.audioSource.pause();
        }
    }

    resumeMusic() {
        if (this.audioSource) {
            this.audioSource.play();
        }
    }

    toggleMusic() {
        if (this.audioSource) {
            UIManager.Instance.togglePauseButton(this.audioSource.playing);
            if (this.audioSource.playing) {
                this.pauseMusic();
            } else {
                this.resumeMusic();
            }
        }
    }

    setGlobalTimeByProgress(progress: number) {
        if (this.audioSource && this.audioSource.clip) {
            this.audioSource.pause();

            const time = progress * this.songDuration;
            this.audioSource.currentTime = time;
            this.globalTime = time;
            this.audioSource.play();
        }
    }

    playSfx(clip: AudioClip) {
        if (this.audioSource && clip) {
            this.audioSource.playOneShot(clip, 1.0);
        } else {
            console.log("ERROR");
        }
    }

    loadChart(chart: Record<string, any>) {
        this.judgePointPool.reset();
        if (!chart) return;
        const bpmEvents = chart.bpmEvents;
        const textEvents = chart.textEventList.map(textEvent =>
            this.covertTextEvent(textEvent, bpmEvents)
        )
        const judgePoints = chart.judgePointList.map(judgePoint =>
            this.convertJudgePointEvents(judgePoint, bpmEvents)
        );

        this.judgePointPool.createJudgePoints(judgePoints);
        this.chartText.initialize(textEvents);
    }

    covertTextEvent(textEvent: any, bpmEvents: BPMEventData[]) {
        return {
            ...textEvent,
            time: Array.isArray(textEvent.time) ? this.convertToSeconds(textEvent.time, bpmEvents) + this.settings.offset : textEvent.time + this.settings.offset,
        }
    }

    convertJudgePointEvents(judgePoint: JudgePointData, bpmEvents: BPMEventData[]): JudgePointData {
        const convertEventTimings = (events: EventData[]): EventData[] =>
            events.map(event => ({
                ...event,
                startTime: Array.isArray(event.startTime) ? this.convertToSeconds(event.startTime, bpmEvents) + this.settings.offset : event.startTime + this.settings.offset,
                endTime: Array.isArray(event.endTime) ? this.convertToSeconds(event.endTime, bpmEvents) + this.settings.offset : event.endTime + this.settings.offset,
            }))

        const convertNoteTimings = (notes: any[]): any[] => {
            return notes.map(note => {
                const convertedNote = {
                    ...note, 
                    time: Array.isArray(note.time) ? this.convertToSeconds(note.time, bpmEvents) + this.settings.offset : note.time + this.settings.offset,
                };

                if (note.endTime) {
                    convertedNote.endTime = Array.isArray(note.endTime) ? this.convertToSeconds(note.endTime, bpmEvents) + this.settings.offset : note.endTime + this.settings.offset;
                }
        
                return convertedNote;
            })
        }
            

        return {
            ...judgePoint,
            noteList: convertNoteTimings(judgePoint.noteList),
            speedEvents: convertEventTimings(judgePoint.speedEvents),
            positionEvents: convertEventTimings(judgePoint.positionEvents),
            rotateEvents: convertEventTimings(judgePoint.rotateEvents),
            opacityEvents: convertEventTimings(judgePoint.opacityEvents)
        };
    }

    convertToSeconds(barBeat: [number, number], bpmEvents: BPMEventData[]): number {
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
        if (!this.audioSource.playing) {
            this.globalTime = 0;
            this.progressSlider.updateProgress(0);
    
            this.scheduleOnce(() => {
                this.playMusic();
            }, 1);
        }
    }

    restartGame() {
        this.audioSource.stop();
        this.loadChart(this.chartData);
        this.startGame();
    }

    getGlobalTime() {
        return this.globalTime;
    }
}