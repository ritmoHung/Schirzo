import { _decorator, Component, UIOpacity, view, Vec3, easing, lerp, Size, instantiate, Node } from "cc";
import { ChartPlayer } from "./ChartPlayer";
import { ClickNote } from "./notes/ClickNote";
import { GlobalSettings } from "./GlobalSettings";
const { ccclass, property } = _decorator;

@ccclass("JudgePoint")
export class JudgePoint extends Component {
    private resolution: Size
    private settings: GlobalSettings

    private topNoteContainer: Node = null
    private bottomNoteContainer: Node = null

    private PXPS: number = 300
    private isInvisible: boolean
    private notes: any = []
    private events: any = {}
    private lastGlobalTime: number = -1
    private lastEventIndexes: { [key: string]: number } = {}



    // # Lifecycle
    onLoad() {
        this.resolution = view.getDesignResolutionSize();
        this.settings = GlobalSettings.getInstance();

        this.topNoteContainer = new Node("TopNoteContainer");
        this.topNoteContainer.setPosition(0, 0, 0);
        this.node.addChild(this.topNoteContainer);

        this.bottomNoteContainer = new Node("BottomNoteContainer");
        this.bottomNoteContainer.setPosition(0, 0, 0);
        this.bottomNoteContainer.setRotationFromEuler(0, 0, 180);
        this.node.addChild(this.bottomNoteContainer);
    }

    update(dt: number) {
        const globalTime = ChartPlayer.Instance ? ChartPlayer.Instance.getGlobalTime() : 0;

        // Reset search indexes if time rewinds
        if (globalTime < this.lastGlobalTime) this.lastEventIndexes = {};
        
        if (globalTime !== this.lastGlobalTime) {
            // Global time changed, update properties
            this.node.position = this.getPropValueByTime("position", globalTime);
            this.node.angle = this.getPropValueByTime("rotate", globalTime);
            const uiOpacity = this.node.getChildByName("JudgePointSprite").getComponent(UIOpacity);
            if (uiOpacity) {
                this.isInvisible
                    ? uiOpacity.opacity = 0
                    : uiOpacity.opacity = this.getPropValueByTime("opacity", globalTime);
            }

            // Update NoteContainer position
            const offset = this.calculatePositionOffset(globalTime);
            this.topNoteContainer.setPosition(0, -offset, 0);
            this.bottomNoteContainer.setPosition(0, offset, 0);

            // Update last global time
            this.lastGlobalTime = globalTime;
        }
    }



    // # Functions
    // Initialization
    initialize(data: any) {
        this.isInvisible = data.isInvisible || false;

        this.notes = data.noteList || [];


        this.events.speedEvents = data.speedEvents || [];
        this.events.positionEvents = data.positionEvents || [];
        this.events.rotateEvents = data.rotateEvents || [];
        this.events.opacityEvents = data.opacityEvents || [];

        this.notes.forEach(noteData => {
            const node = this.createNote(noteData);
        });
    }

    // Update related
    calculatePositionOffset(targetTime: number): number {
        const speedEvents = this.events.speedEvents;

        let offset = 0;
        if (speedEvents.length > 0) {
            // ? Handle potential time gap before the first event
            if (speedEvents[0].startTime > 0) {
                let duration = Math.min(targetTime, speedEvents[0].startTime)
                offset += speedEvents[0].start * duration;
            }

            for (let i = 0; i < speedEvents.length; i++) {
                const event = speedEvents[i];
                if (targetTime < event.startTime) break;  // Break if targetTime is earlier

                const startTime = event.startTime;
                const endTime = Math.min(targetTime, event.endTime);
                const duration = endTime - startTime;

                // ? Handle current event
                if (duration > 0) {
                    switch (event.easing) {
                        case "constant":
                            offset += event.start * duration;
                            break;
                        case "linear":
                            const startSpeed = event.start;
                            const endSpeed = lerp(event.start, event.end, (endTime - event.startTime) / (event.endTime - event.startTime));
                            offset += (startSpeed + endSpeed) * duration / 2;
                            break;
                    }
                }

                // ? Handle potential time gap to the next event
                if (i < speedEvents.length - 1) {
                    let nextEvent = speedEvents[i + 1];
                    if (event.endTime < nextEvent.startTime) {
                        let duration = Math.min(targetTime, nextEvent.startTime) - event.endTime;
                        offset += event.end * duration;
                    }
                } else {
                    if (event.endTime < targetTime) {
                        let duration = targetTime - event.endTime;
                        offset += event.end * duration;
                    }
                }
            }
        } else {
            offset = targetTime;
        }
        
        return this.settings.flowSpeed * this.PXPS * offset;
    }

    getPropValueByTime(property: string, time: number) {
        const events = this.events[property + "Events"];
        if (!events || events.length === 0) {
            let value: any;
            switch (property) {
                case "position":
                    value = [0.5, 0.5];
                    break;
                case "rotate":
                    value = 0;
                    break;
                case "speed":
                case "opacity":
                    value = 1;
                    break;
                default:
                    return value;
            }
            return this.extractValue(value, property);
        }

        // ? Case 1: Before the first event
        if (time < events[0].startTime) {
            const value = this.extractValue(events[0].start, property);
            return value;
        }

        // ? Case 2: After the last event
        const lastEvent = events[events.length - 1];
        if (time >= lastEvent.endTime) {
            const value = this.extractValue(lastEvent.end, property);
            return value;
        }

        // Search for matching event
        let value = null;
        let startIndex = this.lastEventIndexes[property] || 0;
        for (let i = startIndex; i < events.length; i++) {
            const event = events[i];

            // ? Case 3: During an event
            if (time >= event.startTime && time < event.endTime) {
                // Ease by event.easing
                const t = (time - event.startTime) / (event.endTime - event.startTime);
                const easingFunction = easing[event.easing] || easing.linear;
                const easedT = easingFunction(t);

                // Calculate actual value by lerping with eased t
                const start = this.extractValue(event.start, property);
                const end = this.extractValue(event.end, property);
                if (property === "position") {
                    value = new Vec3();
                    Vec3.lerp(value, start, end, easedT);
                } else {
                    value = lerp(start, end, easedT);
                }

                // Save index to cache and return
                this.lastEventIndexes[property] = i;
                return value;
            }

            // ? Case 4: Between events
            if (i < events.length - 1 && (time >= event.endTime && time < events[i + 1].startTime)) {
                value = this.extractValue(event.end, property);

                // Save index to cache and return
                this.lastEventIndexes[property] = i;
                return value;
            }
        }
    }

    extractValue(value: any, property: string) {
        switch (property) {
            case "position":
                const x = this.linear(value[0], 0, 1, 0, this.resolution.width);
                const y = this.linear(value[1], 0, 1, 0, this.resolution.height);
                return new Vec3(x, y, 0);
            case "speed":
            case "rotate":
                return value;
            case "opacity":
                return 255 * value;
            default:
                return value;
        }
    }

    linear(input: number, inputMin: number, inputMax: number, outputMin: number, outputMax: number): number {
        return ((input - inputMin) / (inputMax - inputMin)) * (outputMax - outputMin) + outputMin;
    }

    // Notes
    createNote(noteData: any): Node {
        let chartPlayer = ChartPlayer.Instance;

        let note;
        switch (noteData.type) {
            case 0:
                note = instantiate(chartPlayer.clickNotePrefab);
                const noteComponent = note.getComponent(ClickNote) as ClickNote;
                if (noteComponent) {
                    noteComponent.initialize(noteData, this);
                }
            case 1:
            case 2:
            case 3:
            default:
        }

        note.active = true;
        noteData.direction === 1 ? note.parent = this.topNoteContainer : note.parent = this.bottomNoteContainer;
        return note;
    }
}