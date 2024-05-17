import { _decorator, Component, easing, lerp, Node, RichText, TTFFont, UIOpacity } from "cc";
import { ChartPlayer } from "./ChartPlayer";
const { ccclass, property } = _decorator;

@ccclass("ChartText")
export class ChartText extends Component {
    @property(RichText)
    richText: RichText

    @property(UIOpacity)
    uiOpacity: UIOpacity

    @property(TTFFont)
    majorMonoDisplay: TTFFont

    @property(TTFFont)
    hinaMincho: TTFFont

    private textEvents: any[]
    private lastEventIndex: number = -1
    private lastGlobalTime: number = -1



    // # Lifecycle
    start() {
        this.richText = this.node.getComponent(RichText);
        this.uiOpacity = this.node.getComponent(UIOpacity);
    }

    update(deltaTime: number) {
        const globalTime = ChartPlayer.Instance ? ChartPlayer.Instance.getGlobalTime() : 0;

        // Reset search indexes if time rewinds
        if (globalTime < this.lastGlobalTime) this.lastEventIndex = 0;

        if (globalTime !== this.lastGlobalTime) {
            const eventIndex = this.getEventIndexByTime(globalTime);

            if (eventIndex !== this.lastEventIndex) {
                if (eventIndex < 0) {
                    this.uiOpacity.opacity = 0;
                    this.richText.string = "";
                } else {
                    const event = this.textEvents[eventIndex];
                    this.uiOpacity.opacity = 255;
                    switch (event.font) {
                        case "hinaMincho":
                            this.richText.font = this.hinaMincho;
                            break;
                        case "majorMonoDisplay":
                            this.richText.font = this.majorMonoDisplay;
                            break;
                        default:
                            this.richText.font = this.majorMonoDisplay;
                            break;
                    }
                    this.richText.string = event.text;
                }
                
                this.lastEventIndex = eventIndex;
            } else {
                if (eventIndex >= 0) {
                    const event = this.textEvents[eventIndex];
                    const dt = globalTime - event.time;
                    if (dt < 0.5) {
                        this.uiOpacity.opacity = 255;
                    } else {
                        const t = easing.expoIn(dt - 0.5);
                        this.uiOpacity.opacity = lerp(255, 0, t);
                    }
                }
            }

            // Update last global time
            this.lastGlobalTime = globalTime;
        }
    }



    // # Functions
    initialize(events: any) {
        this.textEvents = events || [];
    }

    getEventIndexByTime(time: number) {
        if (!this.textEvents || this.textEvents.length === 0) return -1;

        // ? Case 1: Before the first event
        if (time < this.textEvents[0].time) return -1;

        // ? Case 2: After any event
        let startIndex = this.lastEventIndex > 0 ? this.lastEventIndex : 0;
        for (let i = startIndex; i < this.textEvents.length; i++) {
            const event = this.textEvents[i];
            
            if (i !== this.textEvents.length - 1) {
                const nextEvent = this.textEvents[i + 1];
                if (time >= event.time && time < nextEvent.time) return i;
            } else {
                if (time >= event.time) return i;
            }
        }

        return -1;
    }
}