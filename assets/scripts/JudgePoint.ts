import { _decorator, Component, UIOpacity, view, Vec3, easing, lerp, Size } from "cc";
import { ChartPlayer } from "./ChartPlayer";
const { ccclass, property } = _decorator;

@ccclass("JudgePoint")
export class JudgePoint extends Component {
    private resolution: Size
    private events: any = {}
    private lastGlobalTime: number = -1
    private lastEventIndexes: { [key: string]: number } = {}
    private lastPropValues: { [key: string]: any } = {}



    // # Lifecycle
    onLoad() {
        this.resolution = view.getDesignResolutionSize();
    }

    update(dt: number) {
        const globalTime = ChartPlayer.Instance ? ChartPlayer.Instance.getGlobalTime() : 0;

        // Reset search indexes if time rewinds
        if (globalTime < this.lastGlobalTime) this.lastEventIndexes = {};
        
        if (globalTime !== this.lastGlobalTime) {
            // Global time changed, update properties
            this.node.position = this.getPropValueByTime("position", globalTime);
            this.node.angle = this.getPropValueByTime("rotate", globalTime);
            const uiOpacity = this.node.getComponent(UIOpacity);
            if (uiOpacity) uiOpacity.opacity = this.getPropValueByTime("opacity", globalTime);

            // Update last global time
            this.lastGlobalTime = globalTime;
        }
    }


    // # Functions
    initialize(data: any) {
        this.events.speedEvents = data.speedEvents || [];
        this.events.positionEvents = data.positionEvents || [];
        this.events.rotateEvents = data.rotateEvents || [];
        this.events.opacityEvents = data.opacityEvents || [];
    }

    getPropValueByTime(property: string, time: number) {
        const events = this.events[property + "Events"];
        if (!events || events.length === 0) return null;  // Returns null if no events

        // ? Case 1: Before the first event
        if (time < events[0].startTime) {
            const value = this.extractValue(events[0].start, property);
            this.lastPropValues[property] = value;
            return value;
        }

        // ? Case 2: After the last event
        const lastEvent = events[events.length - 1];
        if (time >= lastEvent.endTime) {
            const value = this.extractValue(lastEvent.end, property);
            this.lastPropValues[property] = value;
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

                // Save to cache and return
                this.lastEventIndexes[property] = i;
                this.lastPropValues[property] = value;
                return value;
            }

            // ? Case 4: Between events
            if (i < events.length - 1 && (time >= event.endTime && time < events[i + 1].startTime)) {
                value = this.extractValue(event.end, property);

                // Save to cache and return
                this.lastEventIndexes[property] = i;
                this.lastPropValues[property] = value;
                return value;
            }
        }
    }

    extractValue(value: any, property: string) {
        switch (property) {
            case "position":
                const x = this.linear(value[0], -1, 1, 0, this.resolution.width);
                const y = this.linear(value[1], -1, 1, 0, this.resolution.height);
                return new Vec3(x, y, 0);
            case "speed":
            case "rotate":
            case "opacity":
                return value;
            default:
                return value;
        }
    }

    linear(input: number, inputMin: number, inputMax: number, outputMin: number, outputMax: number): number {
        return ((input - inputMin) / (inputMax - inputMin)) * (outputMax - outputMin) + outputMin;
    }
}