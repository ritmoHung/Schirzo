import { _decorator, AudioClip, Component, Vec3, tween, find } from 'cc';
import { ChartPlayer } from './ChartPlayer';
const { ccclass, property } = _decorator;

@ccclass('ClickNote')
export class ClickNote extends Component {
    @property(AudioClip)
    sfx: AudioClip | null = null;

    private chartPlayer: ChartPlayer | null = null;
    private noteData: any;
    private travelTime: number = 1;

    

    // # Lifecycle
    onLoad() { }



    // # Functions
    initialize(chartPlayer: ChartPlayer, noteData) {
        this.chartPlayer = chartPlayer;
        this.noteData = noteData;
        this.setupNoteMovement();
    }

    setupNoteMovement() {
        const startPosition = new Vec3(960, 980, 0);
        const endPosition = new Vec3(960, 100, 0);

        this.node.setPosition(startPosition);
        tween(this.node)
            .to(this.travelTime, { position: endPosition }, { easing: "linear" })
            .call(() => {
                if (this.chartPlayer && this.sfx) {
                    this.chartPlayer.playSfx(this.sfx);
                } else {
                    console.error("ERROR");
                }
                this.node.destroy();
            })
            .start();
    }
}


