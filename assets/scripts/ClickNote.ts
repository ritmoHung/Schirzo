import { _decorator, AudioClip, Component, Vec3 } from "cc";
import { GlobalSettings } from "./GlobalSettings";
import { ChartPlayer } from "./ChartPlayer";
const { ccclass, property } = _decorator;

@ccclass("ClickNote")
export class ClickNote extends Component {
    @property(AudioClip)
    sfx: AudioClip | null = null

    private settings: GlobalSettings
    private direction: number
    private isFake: boolean
    private time: number
    private speed: number

    

    // # Lifecycle
    update() {
        const globalTime = ChartPlayer.Instance ? ChartPlayer.Instance.getGlobalTime() : 0;
    }



    // # Functions
    initialize(data: any) {
        this.direction = data.direction;
        this.isFake = data.isFake;
        this.time = data.time;
        this.speed = data.speed;

        this.node.position = new Vec3(0, this.direction * (this.time[0] + this.time[1] / 4) * 100, 0);
    }
}