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
    private lastPropValues: { [key: string]: any } = {}



    // # Lifecycle
    update(dt: number) {
        const globalTime = ChartPlayer.Instance ? ChartPlayer.Instance.getGlobalTime() : 0;
        
        if (globalTime !== this.lastGlobalTime) {
            // Global time changed, update properties
            this.node.position = this.getPropertyByTime("position", globalTime);
            this.node.angle = this.getPropertyByTime("rotate", globalTime);
            const uiOpacity = this.node.getComponent(UIOpacity);
            if (uiOpacity) uiOpacity.opacity = this.getPropertyByTime("opacity", globalTime);

            // Update last global time
            this.lastGlobalTime = globalTime;
        } else {
            this.node.position = this.lastPropValues["position"];
            this.node.angle = this.lastPropValues["rotate"];
            const uiOpacity = this.node.getComponent(UIOpacity);
            if (uiOpacity) uiOpacity.opacity = this.lastPropValues["opacity"];
        }

        // console.log(this.node.position);
    }


    // # Functions
    initialize(data: any) {
        console.log(data);
        this.events.speedEvents = data.speedEvents || [];
        this.events.positionEvents = data.positionEvents || [];
        this.events.rotateEvents = data.rotateEvents || [];
        this.events.opacityEvents = data.opacityEvents || [];
    }

    getPropertyByTime(property: string, time: number) {
        const events = this.events[property + "Events"];
        if (!events || events.length === 0) return;  // TODO: Handle 0 event cases

        // Initialize with first event's start value
        if (time < events[0].startTime) {
            return this.extractValue(events[0].start, property);
        }

        let lastValue = null;
        for (let i = 0; i < events.length; i++) {
            const event = events[i];

            if (time >= event.startTime && time < event.endTime) {
                // Ease by event.easing
                const t = (time - event.startTime) / (event.endTime - event.startTime);
                const easingFunction = easing[event.easing] || easing.linear;
                const easedT = easingFunction(t);

                // Extract actual value
                const start = this.extractValue(event.start, property);
                const end = this.extractValue(event.end, property);
                const value = lerp(start, end, easedT);
                console.log(`Start: ${JSON.stringify(start)}, End: ${JSON.stringify(end)}, t: ${easedT}, value: ${value}`);
                this.lastPropValues[property] = value;
                return value;
            }

            lastValue = this.extractValue(event.end, property);
            if (i < events.length - 1 && time >= event.endTime && time < events[i + 1].startTime) {
                this.lastPropValues[property] = lastValue;
                return lastValue;
            }
        }

        const lastEvent = events[events.length - 1];
        const value = this.extractValue(lastEvent.end, property);
        this.lastPropValues[property] = value;
        return value;
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