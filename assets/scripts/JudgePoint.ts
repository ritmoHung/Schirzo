import { _decorator, Component, Tween, tween, TweenEasing, UIOpacity, Vec3, easing } from "cc";
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
    private tweens: Map<string, Tween<any>[]> = new Map()



    // # Lifecycle



    // # Functions
    initialize(data: any) {
        if (data.speedEvents) this.setupEvents(data.speedEvents, "speed");
        if (data.moveEvents) this.setupEvents(data.moveEvents, "position");
        if (data.rotateEvents) this.setupEvents(data.rotateEvents, "angle");
        if (data.alphaEvents) this.setupEvents(data.alphaEvents, "opacity");
    }

    setupEvents(events: Event[], property: string) {
        const target = property === "opacity" ? this.node.getComponent(UIOpacity) : this.node;
        if (events.length > 0) {
            const initialEvent = events[0];
            const startValue = this.extractValue(initialEvent.start, property);
            target[property] = startValue;
        }

        events.forEach(event => {
            const startValue = this.extractValue(event.start, property);
            const endValue = this.extractValue(event.end, property);

            const tw = tween(target)
                .delay(event.startTime)
                .set({ [property]: startValue })
                .to(event.endTime - event.startTime, { [property]: endValue }, { easing: event.easing });

            this.addTween(property, tw);
        });
    }

    extractValue(value: any, property: string) {
        switch (property) {
            case "position":
                return new Vec3(value[0], value[1], 0);
            case "angle":
            case "opacity":
                return value;
            default:
                return value;
        }
    }

    addTween(property: string, tween: Tween<any>) {
        if (!this.tweens.has(property)) {
            this.tweens.set(property, []);
        }
        this.tweens.get(property)!.push(tween);
    }

    startAllTweens() {
        this.tweens.forEach(tweenList => tweenList.forEach(tw => tw.start()));
    }

    stopAllTweens() {
        this.tweens.forEach(tweenList => tweenList.forEach(tw => tw.stop()));
    }
}