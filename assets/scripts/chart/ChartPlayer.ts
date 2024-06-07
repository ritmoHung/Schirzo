import { _decorator, AudioClip, AudioSource, Button, CCBoolean, Component, director, EventKeyboard, input, Input, JsonAsset, KeyCode, Node, Prefab, resources, RichText, tween, UIOpacity, Vec3 } from "cc";
import { GlobalSettings } from "../settings/GlobalSettings";
import { FirebaseManager } from "../lib/FirebaseManager";
import { SceneTransition } from "../ui/SceneTransition";
import { JudgeManager } from "../lib/JudgeManager";
import { ChartData, SelectedSong } from "../settings/song";
import { JudgePointPool } from "./JudgePointPool";
import { ProgressSlider } from "./ProgressSlider";
import { ChartText } from "./ChartText";
import { ButtonIconOutline } from "../ui/button/ButtonIcon";
import { ButtonSquare } from "../ui/button/ButtonSquare";
import { EditStateManager } from "../editor/EditStateManager";
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
    start: number | [number, number];
    end: number | [number, number];
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
    pauseButton: Button
    @property(Button)
    resumeButton: Button
    @property(Button)
    retryButton: Button
    @property(Button)
    quitButton: Button

    // Node
    @property(Node)
    comboNode: Node
    @property(Node)
    scoreNode: Node
    @property(Node)
    accuracyNode: Node

    // UIOpacity
    @property(UIOpacity)
    loadUiOpacity: UIOpacity
    @property(UIOpacity)
    menuUiOpacity: UIOpacity

    @property(AudioSource)
    audioSource: AudioSource

    @property(AudioClip)
    hintSFX: AudioClip

    @property(JudgePointPool)
    private judgePointPool: JudgePointPool

    @property(ProgressSlider)
    progressSlider: ProgressSlider

    @property(ChartText)
    chartText: ChartText

    @property(CCBoolean)
    editing: boolean = false

    private static instance: ChartPlayer
    private globalSettings: GlobalSettings
    private judgeManager: JudgeManager

    private menuOpened: boolean = false
    private dataSource: DataSource = DataSource.Firebase
    private chartData: ChartData
    private song: any = {}
    private hintDuration: number = 0
    private hintAmount: number = 4
    private songDuration: number = 0
    private globalTime: number = 0
    private offset: number = 0;
    private UPB = 120  // Units per beat

    private combo: number = 0
    private score: number = 0
    private accuracy: string = "0.00"



    // # Lifecycle
    constructor() {
        super();
        this.globalSettings = GlobalSettings.getInstance();
    }

    public static get Instance() {
        if (!ChartPlayer.instance) {
            ChartPlayer.instance = new ChartPlayer();
        }

        return ChartPlayer.instance;
    }

    onLoad() {
        ChartPlayer.instance = this;
        this.judgeManager = JudgeManager.getInstance();
        this.audioSource.volume = this.globalSettings.musicVolume;

        this.loadUiOpacity.opacity = 255;
        this.offset = this.globalSettings.getUserSettings()?.offset ?? 0;
        this.song = this.globalSettings.selectedSong
            ? this.globalSettings.selectedSong
            : { type: "vanilla", id: "marenol", mode: "gameplay", anomaly: false };

        if (this.editing) return;
        // Get chart & audio from source, then execute callback (load chart)
        this.loadChartData().then(() => {
            tween(this.loadUiOpacity)
                .to(1, { opacity: 0 }, { easing: "smooth" })
                .start();
            this.startGame();
        }).catch((error) => {
            console.error(error);
        });

        // Preload ResultScreen
        director.preloadScene("ResultScreen", (error) => {
            if (error) {
                console.log("SCENE::RESULTSCREEN: Failed");
                return;
            }
            console.log("SCENE::RESULTSCREEN: Preloaded");
        });
    }

    update(deltaTime: number) {
        if (this.audioSource.playing) {
            this.globalTime += deltaTime;

            // Progress Slider
            const progress = this.audioSource.currentTime / this.songDuration;
            this.progressSlider.updateProgress(progress);

            // Scores
            this.updateText({});
        }
    }

    onAudioEnded() {
        if (this.editing) return;
        console.log(`CHART::SONG: Ended`);

        const sceneName = this.processAndGetNextScene();
        this.sceneTransition.fadeOutAndLoadScene(sceneName);
    }

    onKeyDown(event: EventKeyboard) {
        switch (event.keyCode) {
            case KeyCode.KEY_Q:
                if (this.menuOpened) {
                    this.globalSettings.audioManager.playSFX(this.quitButton.getComponent(ButtonSquare).sfx);
                    this.quitGame();
                }
                break;
            case KeyCode.ESCAPE:
                if (this.menuOpened) {
                    this.globalSettings.audioManager.playSFX(this.resumeButton.getComponent(ButtonSquare).sfx);
                    this.resumeGame();
                } else {
                    this.globalSettings.audioManager.playSFX(this.pauseButton.getComponent(ButtonIconOutline).sfx);
                    this.pauseGame();
                }
                break;
            default:
                break;
        }
    }

    onDestroy() {
        if (!EditStateManager.playerInit) {
            this.audioSource.node.off("ended", this.onAudioEnded, this);
        }
    }

    // # Functions
    // * Game related
    async loadChartData() {
        await this.getChartData(this.dataSource, (chartData: ChartData) => {
            // Save to cache
            this.chartData = chartData;

            // Prepare game (including chart / audio / onClick / onKeyDown)
            this.prepareGame();
        });
    }

    async getChartData(source: DataSource, callback: (chartData: ChartData) => void) {
        try {
            let chartData: ChartData = { chart: {}, audio: null };
            switch (source) {
                case DataSource.Firebase:
                    chartData = await FirebaseManager.getChartData(this.song.type, this.song.id);
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

    /** Update chart data only, without adding listener */
    reloadGame() {
        this.loadChart();

        if (this.audioSource) {
            this.audioSource.clip = this.chartData.audio;
            this.songDuration = this.chartData.audio.getDuration();
        }
    }

    prepareGame() {
        this.loadChart();

        if (this.audioSource) {
            this.audioSource.clip = this.chartData.audio;
            this.songDuration = this.chartData.audio.getDuration();
            this.audioSource.node.on(AudioSource.EventType.ENDED, this.onAudioEnded, this);
        }

        // Buttons
        this.setMenuButtonsInteractive(false);
        this.pauseButton.node.on(Button.EventType.CLICK, this.pauseGame, this);
        this.resumeButton.node.on(Button.EventType.CLICK, this.resumeGame, this);
        this.retryButton.node.on(Button.EventType.CLICK, this.restartGame, this);
        this.quitButton.node.on(Button.EventType.CLICK, this.quitGame, this);

        // Key Down
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    startGame() {
        this.globalTime = 0;
        this.progressSlider.updateProgress(0);
        console.log(`NOTE COUNT: ${this.judgeManager.noteCount}`);

        this.scheduleOnce(() => {
            for(let i = 0; i < this.hintAmount; i++) {
                const delay = (i + this.hintAmount) * this.hintDuration;
                this.scheduleOnce(() => {
                    this.playSfx(this.hintSFX, 1.0);
                }, delay);
            }

            this.scheduleOnce(() => {
                if (this.audioSource.clip) {
                    this.audioSource.play();
                }
            }, 2 * this.hintAmount * this.hintDuration);
        }, this.hintDuration * this.hintAmount);
    }

    pauseGame() {
        // Pause music, chart will also be stopped automatically
        this.pauseMusic();
        this.openMenu();
    }

    resumeGame() {
        this.closeMenu(() => {
            // Resume music, chart will also continue automatically
            this.scheduleOnce(() => {
                this.resumeMusic();
            }, 3);
        });
    }

    restartGame() {
        this.audioSource.stop();
        this.closeMenu();
        this.comboNode.getComponent(RichText).string = "0";
        this.scoreNode.getComponent(RichText).string = "0";
        this.accuracyNode.getComponent(RichText).string = `00.00%`;
        this.judgeManager.reset();

        // Prepare chart
        this.loadChart();

        this.startGame();
    }

    quitGame() {
        // Clear judgepoints
        this.chartData = null;
        this.judgePointPool.reset();
        this.judgeManager.reset();

        if (!this.editing) {
            if (this.song.type == "custom") {
                this.sceneTransition.fadeOutAndLoadScene("CustomChartSelect");
            } else {
                this.sceneTransition.fadeOutAndLoadScene("SongSelect");
            }
        }
    }

    openMenu() {
        if (!this.menuOpened) {
            this.menuOpened = true;
            this.setMenuButtonsInteractive(true);
            tween(this.menuUiOpacity)
                .to(0.5, { opacity: 255 }, { easing: "smooth" })
                .start();
        }
    }

    closeMenu(callback?: () => void) {
        if (this.menuOpened) {
            this.menuOpened = false;
            this.setMenuButtonsInteractive(false);
            tween(this.menuUiOpacity)
                .to(0.5, { opacity: 0 }, { easing: "smooth" })
                .call(() => {
                    if (callback) {
                        callback();
                    }
                })
                .start();
        }
    }

    setMenuButtonsInteractive(state: boolean) {
        this.resumeButton.interactable = state;
        this.retryButton.interactable = state;
        this.quitButton.interactable = state;
    }

    getGlobalTime() {
        return this.globalTime;
    }

    getMode() {
        return this.song.mode;
    }

    updateText({ combo, score, accuracy }: { combo?: number, score?: number, accuracy?: string }) {
        const comboValue = combo ?? this.judgeManager.combo;
        const scoreValue = score ?? this.judgeManager.score;
        const accuracyValue = accuracy ?? this.judgeManager.accuracy;
        if (comboValue !== this.combo) {
            this.combo = comboValue;
            this.comboNode.getComponent(RichText).string = comboValue.toString();
            tween(this.comboNode)
                .to(0.05, { scale: new Vec3(1, 1.1, 1) }, { easing: "expoOut" })
                .delay(0.05)
                .to(0.1, { scale: new Vec3(1, 1, 1) }, { easing: "sineOut" })
                .start();
        }
        if (scoreValue !== this.score) {
            this.score = scoreValue;
            this.scoreNode.getComponent(RichText).string = scoreValue.toString();
            tween(this.scoreNode)
                .to(0.05, { scale: new Vec3(1, 1.1, 1) }, { easing: "expoOut" })
                .delay(0.05)
                .to(0.1, { scale: new Vec3(1, 1, 1) }, { easing: "sineOut" })
                .start();
        }
        if (accuracyValue !== this.accuracy) {
            this.accuracy = accuracyValue;
            this.accuracyNode.getComponent(RichText).string = `${accuracyValue}%`;
        }
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

    loadChart(chart: Record<string, any> = this.chartData.chart) {
        // Clear judgepoints
        this.judgePointPool.reset();

        const bpmEvents = chart.bpmEvents;
        this.hintDuration = this.convertToSeconds([0, this.UPB], chart.bpmEvents);
        this.hintAmount = chart.bpmEvents[0].bpm[2] ?? 4;
        const textEvents = chart.textEventList.map((textEvent: any) =>
            this.covertTextEvent(textEvent, bpmEvents)
        )
        const judgePoints = chart.judgePointList.map((judgePoint: any) =>
            this.convertJudgePointEvents(judgePoint, bpmEvents)
        );

        this.judgePointPool.createJudgePoints(judgePoints);
        this.chartText.initialize(textEvents);
    }

    covertTextEvent(textEvent: any, bpmEvents: BPMEvent[]) {
        return {
            ...textEvent,
            time: Array.isArray(textEvent.time)
                ? this.convertToSeconds(textEvent.time, bpmEvents) + this.offset
                : textEvent.time + this.offset,
        }
    }

    convertJudgePointEvents(judgePoint: JudgePoint | any, bpmEvents: BPMEvent[]): JudgePoint {
        const convertEventTimings = (events: Event[]): Event[] =>
            events.map(event => ({
                ...event,
                startTime: Array.isArray(event.startTime)
                    ? this.convertToSeconds(event.startTime, bpmEvents) + this.offset
                    : event.startTime + this.offset,
                endTime: Array.isArray(event.endTime)
                    ? this.convertToSeconds(event.endTime, bpmEvents) + this.offset
                    : event.endTime + this.offset,
            }))

        const convertNoteTimings = (notes: any[]): any[] => {
            return notes.map(note => {
                const convertedNote = {
                    ...note,
                    time: Array.isArray(note.time)
                        ? this.convertToSeconds(note.time, bpmEvents) + this.offset
                        : note.time + this.offset,
                };

                if (note.endTime) {
                    convertedNote.endTime = Array.isArray(note.endTime)
                        ? this.convertToSeconds(note.endTime, bpmEvents) + this.offset
                        : note.endTime + this.offset;
                }

                // ? Contribute to note count if not fake
                const isFake = note?.isFake ?? false;
                if (!isFake) this.judgeManager.addNoteCount();

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

    convertToSeconds(barBeat: [number, number], bpmEvents: BPMEvent[] = this.chartData.chart.bpmEvents): number {
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

    setGlobalTimeByProgress(progress: number) {
        if (this.audioSource && this.audioSource.clip) {
            this.audioSource.pause();

            const time = progress * this.songDuration;
            this.audioSource.currentTime = time;
            this.globalTime = time;
            this.audioSource.play();
        }
    }

    pauseMusic() {
        if (this.audioSource.playing) {
            this.audioSource.pause();
        }
    }

    resumeMusic() {
        if (!this.audioSource.playing) {
            this.audioSource.play();
        }
    }

    playSfx(clip: AudioClip, volume: number = this.globalSettings.sfxVolume) {
        this.audioSource.playOneShot(clip, volume);
    }



    // * Get & Sets
    public get editorUPB() {
        return this.UPB;
    }

    public set editorChartData(data: ChartData) {
        this.chartData = data;
    }

    public set editorSongData(data: SelectedSong) {
        this.song = data
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