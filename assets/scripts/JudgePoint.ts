import { _decorator, Component, TweenEasing, UIOpacity, Vec3, easing, lerp } from "cc";
import { ChartPlayer } from "./ChartPlayer";
const { ccclass, property } = _decorator;

interface Event {
    startTime: number;
    endTime: number;
    easing: TweenEasing;
    start: any;
    end: any;
}

@ccclass("JudgePoint")
export class JudgePoint extends Component {
    private events: any = {}
    private lastGlobalTime: number = -1
    private lastEventIndexes: { [key: string]: number } = {}
    private lastPropValues: { [key: string]: any } = {}



    // # Lifecycle
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
        } else {
            // this.node.position = this.lastPropValues["position"];
            // this.node.angle = this.lastPropValues["rotate"];
            // const uiOpacity = this.node.getComponent(UIOpacity);
            // if (uiOpacity) uiOpacity.opacity = this.lastPropValues["opacity"];
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
                return new Vec3(value[0], value[1], 0);
            case "speed":
            case "rotate":
            case "opacity":
                return value;
            default:
                return value;
        }
    }
}