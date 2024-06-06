import { _decorator, AudioClip, AudioSource, Button, Component, director, JsonAsset, Prefab, resources } from "cc";
import { GlobalSettings } from "../settings/GlobalSettings";
import { JudgePointPool } from "./JudgePointPool";
import { ProgressSlider } from "./ProgressSlider";
import { ChartText } from "./ChartText";
import { FirebaseManager } from "../lib/FirebaseManager";
import { SceneTransition } from "../ui/SceneTransition";
import { ChartData } from "../settings/song";
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

enum DataSource {
    Local = 0,
    Firebase = 1,
}

@ccclass("ChartPlayer")
export class ChartPlayer extends Component {
    @property(SceneTransition)
    sceneTransition: SceneTransition

    // Prefabs
    @property(Prefab)
    clickNotePrefab: Prefab | null = null
    @property(Prefab)
    keyNotePrefab: Prefab | null = null
    @property(Prefab)
    dragNotePrefab: Prefab | null = null
    @property(Prefab)
    holdNotePrefab: Prefab | null = null

    // Buttons
    @property(Button)
    pauseButton: Button | null = null
    @property(Button)
    startButton: Button | null = null
    @property(Button)
    restartButton: Button | null = null

    @property(AudioSource)
    audioSource: AudioSource | null = null

    @property(JudgePointPool)
    judgePointPool: JudgePointPool

    @property(ProgressSlider)
    progressSlider: ProgressSlider

    @property(ChartText)
    chartText: ChartText

    private static instance: ChartPlayer
    private globalSettings: GlobalSettings
    private dataSource: DataSource = DataSource.Firebase
    private chartData: ChartData
    private song: any = {}
    private songDuration: number = 0
    private globalTime: number = 0
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
            : { type: "vanilla", id: "marenol", anomaly: false }
        console.log(`CHART::${this.song.type.toUpperCase()}: ${this.song.id}\nAnomaly: ${this.song.anomaly}\nMode: `);

        // Get chart & audio from source, then execute callback (load chart)
        this.loadChartData();

        // Preload ResultScreen
        director.preloadScene("ResultScreen", (error) => {
            if (error) {
                console.log("SCENE::RESULTSCREEN: Failed");
                return;
            }
            console.log("SCENE::RESULTSCREEN: Preloaded");
        });
    }

    onAudioEnded() {
        console.log(`SONG::${this.song.id.toUpperCase()}: Ended`);

        const sceneName = this.processAndGetNextScene();
        this.sceneTransition.fadeOutAndLoadScene(sceneName);
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
    // * Game related
    async loadChartData() {
        this.getChartData(this.dataSource, (chartData: ChartData) => {
            // Save to cache
            this.chartData = chartData;

            // Prepare chart
            this.loadChart(chartData.chart);

            // Prepare audio
            if (this.audioSource) {
                this.audioSource.clip = chartData.audio;
                this.songDuration = chartData.audio.getDuration();
                this.audioSource.node.on("ended", this.onAudioEnded, this);
            }

            // Buttons
            this.pauseButton.node.on("click", () => this.pauseMusic());
            this.startButton.node.on("click", () => this.startGame());
            this.restartButton.node.on("click", () => this.restartGame());
        });
    }

    async getChartData(source: DataSource, callback: (chartData: ChartData) => void) {
        try {
            let chartData: ChartData
            switch (source) {
                case DataSource.Firebase:
                    chartData = await FirebaseManager.getChartData("vanilla", this.song.id);
                    break;
                case DataSource.Local:
                default:
                    chartData.chart = await this.getChartFromLocal(this.song.id);
                    chartData.audio = await this.getSongFromLocal(this.song.id);
                    break;
            }

            callback(chartData);
        } catch (error) {
            console.error(`CHART::LOAD: Failed to load chart data, reason: ${error.message}`);
        }
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

    resumeGame() {
        if (!this.audioSource.playing) {
            this.resumeMusic();
        }
    }

    restartGame() {
        this.audioSource.stop();

        // Prepare chart
        this.loadChart(this.chartData.chart);

        this.startGame();
    }

    getGlobalTime() {
        return this.globalTime;
    }



    // * Chart related
    getChartFromLocal(songId: string): Promise<Record<string, any>> {
        return new Promise((resolve, reject) => {
            const path = `songs/${songId}/2`;
            resources.load(path, JsonAsset, (error, asset) => {
                if (error) {
                    console.error(`CHART::CHART: Failed to load JSON, reason: ${error.message}`);
                    reject(error);
                    return;
                }

                const chart = asset.json!;
                resolve(chart);
            });
        });
    }

    loadChart(chart: Record<string, any>) {
        // Clear judgepoints
        this.judgePointPool.reset();

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



    // * Audio related
    getSongFromLocal(songId: string): Promise<AudioClip> {
        return new Promise((resolve, reject) => {
            const path = `songs/${songId}/base`;
            resources.load(path, AudioClip, (error, audioClip) => {
                if (error) {
                    console.error(`CHART::SONG: Failed to load audio clip, reason: ${error.message}`);
                    reject(error);
                    return;
                }
    
                resolve(audioClip);
            });
        });
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
        this.audioSource.playOneShot(clip, 1.0);
    }


    
    // * Scene transitions
    // ? Also checks for anomaly
    processAndGetNextScene(songId: string = this.song.id): string {
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

                    this.globalSettings.selectedSong = {
                        type: "vanilla",
                        id: "rip",
                        mode: "gameplay",
                        anomaly: true
                    };
                    return director.getScene().name;
                // ? To: Hope for the Flowers
                case 2:
                    console.warn("ANOMALY");
                    this.globalSettings.patchUserData({
                        key: "chapters",
                        id: selectedChapterId,
                        data: { progress_state: 3 }
                    });

                    this.globalSettings.selectedSong = {
                        type: "vanilla",
                        id: "hopefortheflowers",
                        mode: "gameplay",
                        anomaly: true
                    };
                    return director.getScene().name;
                default:
                    return "ResultScreen";
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

            return "ResultScreen";
        }
    }
}