import { _decorator, AudioClip, AudioSource, Button, Component, director, JsonAsset, Prefab, resources } from "cc";
import { GlobalSettings } from "../settings/GlobalSettings";
import { JudgePointPool } from "./JudgePointPool";
import { ProgressSlider } from "./ProgressSlider";
import { ChartText } from "./ChartText";
import { FirebaseManager } from "../lib/FirebaseManager";
import { SceneTransition } from "../ui/SceneTransition";
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
    @property(SceneTransition)
    sceneTransition: SceneTransition

    @property(Button)
    pauseButton: Button | null = null
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

    private static instance: ChartPlayer
    private song: any = {}
    private songDuration: number = 0
    private globalTime: number = 0
    private globalSettings: GlobalSettings
    private UPB = 120  // Units per beat

    private initializing = true

    // # Lifecycle
    constructor() {
        super();
        this.globalSettings = GlobalSettings.getInstance();
    }

    public static get Instance() {
        return this.instance;
    }

    onLoad() {
        ChartPlayer.instance = this;
        this.song = this.globalSettings.selectedSong
            ? this.globalSettings.selectedSong
            : { type: "vanilla", id: "tpvsshark", anomaly: false }
        console.log(`CHART::${this.song.type.toUpperCase()}: ${this.song.id}, anomaly: ${this.song.anomaly}`);

        // Load song audio & chart
        FirebaseManager.loadChartFromFirebaseStorage(this.song.type, this.song.id, (chartData) => {
            this.loadChartFrom(chartData.chart);
            this.pauseButton.node.on("click", () => this.pauseMusic());
            this.startButton.node.on("click", () => this.startGame());
            this.restartButton.node.on("click", () => this.restartGame());

            if (this.audioSource) {
                this.loadMusicFrom(chartData.audio);
                this.audioSource.node.on("ended", this.onAudioEnded, this);
            } else {
                console.error("AudioSource component is not attached.");
            }

            this.initializing = false;
        });

        // Preload ResultScreen
        director.preloadScene("ResultScreen", (err) => {
            if (err) {
                console.log("SCENE::RESULTSCREEN: Failed");
                return;
            }
            console.log("SCENE::RESULTSCREEN: Preloaded");
        });
    }

    onAudioEnded() {
        console.log(`SONG::${this.song.id.toUpperCase()}: Ended`);

        this.checkAnomaly();
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
    loadMusic() {
        resources.load(`songs/${this.song.id}/base`, AudioClip, (error, clip: AudioClip) => {
            if (error) {
                console.error("Failed to load music:", error);
                return;
            }

            if (this.audioSource) {
                this.audioSource.clip = clip;
                this.songDuration = clip.getDuration();
            }
        });
    }

    loadMusicFrom(clip: AudioClip) {
        if (!clip) {
            console.error("Failed to load music");
            return;
        }
        if (this.audioSource) {
            this.audioSource.clip = clip;
            this.songDuration = clip.getDuration();
        }
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

    loadChart() {
        this.judgePointPool.reset();
        resources.load(`songs/${this.song.id}/2`, JsonAsset, (error, res: JsonAsset) => {
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

    loadChartFrom(chart: Record<string, any>) {
        this.judgePointPool.reset();
        if (!chart) {
            console.error("Failed to load chart.");
            return;
        }

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

    covertTextEvent(textEvent: any, bpmEvents: BPMEvent[]) {
        return {
            ...textEvent,
            time: Array.isArray(textEvent.time)
                ? this.convertToSeconds(textEvent.time, bpmEvents) + this.globalSettings.offset
                : textEvent.time + this.globalSettings.offset,
        }
    }

    convertJudgePointEvents(judgePoint: JudgePoint, bpmEvents: BPMEvent[]): JudgePoint {
        const convertEventTimings = (events: Event[]): Event[] =>
            events.map(event => ({
                ...event,
                startTime: Array.isArray(event.startTime)
                    ? this.convertToSeconds(event.startTime, bpmEvents) + this.globalSettings.offset
                    : event.startTime + this.globalSettings.offset,
                endTime: Array.isArray(event.endTime)
                    ? this.convertToSeconds(event.endTime, bpmEvents) + this.globalSettings.offset
                    : event.endTime + this.globalSettings.offset,
            }))

        const convertNoteTimings = (notes: any[]): any[] => {
            return notes.map(note => {
                const convertedNote = {
                    ...note, 
                    time: Array.isArray(note.time)
                        ? this.convertToSeconds(note.time, bpmEvents) + this.globalSettings.offset
                        : note.time + this.globalSettings.offset,
                };

                if (note.endTime) {
                    convertedNote.endTime = Array.isArray(note.endTime)
                        ? this.convertToSeconds(note.endTime, bpmEvents) + this.globalSettings.offset
                        : note.endTime + this.globalSettings.offset;
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
        this.loadChart();
        this.startGame();
    }

    getGlobalTime() {
        return this.globalTime;
    }
    
    checkAnomaly(songId: string = this.song.id) {
        const selectedChapterId = this.globalSettings.selectedChapterId;
        const chapterProgressState = this.globalSettings.getUserData("chapters", selectedChapterId)?.progress_state ?? 0;
        const songScore = this.globalSettings.getUserData("songs", songId)?.score ?? 0;

        if (songId === "marenol" && songScore >= 900000) {  // TODO: Change last condition
            switch (chapterProgressState) {
                // ? To: R.I.P.
                case 0:
                    console.warn("ANOMALY");
                    this.globalSettings.patchUserData({
                        key: "chapters",
                        id: selectedChapterId,
                        data: { progress_state: 1 }
                    });
                    this.scheduleOnce(() => {
                        this.globalSettings.selectedSong = { type: "vanilla", id: "rip", anomaly: true };
                        this.sceneTransition.fadeOutAndLoadScene(director.getScene().name);
                    }, 3);
                    break;
                // ? To: Hope for the Flowers
                case 2:
                    console.warn("ANOMALY");
                    this.globalSettings.patchUserData({
                        key: "chapters",
                        id: selectedChapterId,
                        data: { progress_state: 3 }
                    });
                    this.scheduleOnce(() => {
                        this.globalSettings.selectedSong = { type: "vanilla", id: "hopefortheflowers", anomaly: true };
                        this.sceneTransition.fadeOutAndLoadScene(director.getScene().name);
                    }, 3);
                    break;
                default: break;
            }
        } else {
            if (songId === "rip" && chapterProgressState === 1 && this.globalSettings.selectedSong.anomaly) {
                this.globalSettings.patchUserData({
                    key: "chapters",
                    id: this.globalSettings.selectedChapterId,
                    data: { progress_state: 2 }
                });
            } else if (songId === "hopefortheflowers" && chapterProgressState === 3 && this.globalSettings.selectedSong.anomaly) {
                this.globalSettings.patchUserData({
                    key: "chapters",
                    id: this.globalSettings.selectedChapterId,
                    data: { progress_state: 4 }
                });
            }

            this.scheduleOnce(function() {
                director.loadScene("ResultScreen");
            }, 3);
        }
    }
}