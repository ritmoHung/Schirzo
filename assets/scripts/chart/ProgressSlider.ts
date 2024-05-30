import { _decorator, Component, ProgressBar, Slider } from "cc";
import { ChartPlayer } from "./ChartPlayer";
const { ccclass, property } = _decorator;

@ccclass("ProgressSlider")
export class ProgressSlider extends Component {
    @property(Slider)
    slider: Slider

    @property(ProgressBar)
    progressBar: ProgressBar

    private chartPlayer: ChartPlayer



    // # Lifecycle
    onLoad() {
        this.chartPlayer = ChartPlayer.Instance;

        this.slider.progress = 0;
        this.slider.node.on("slideStart", this.onSliderStart, this);
        this.slider.node.on("slide", this.onSliderChange, this);
        this.slider.node.on("slideEnd", this.onSliderEnd, this);
    }

    onSliderStart() {
        this.chartPlayer.pauseMusic();
    }

    onSliderChange() {
        this.chartPlayer.setGlobalTimeByProgress(this.slider.progress);
    }

    onSliderEnd() {
        this.chartPlayer.resumeMusic();
    }



    // # Functions
    updateProgress(progress: number) {
        this.slider.progress = progress;
        this.progressBar.progress = progress;
    }
}