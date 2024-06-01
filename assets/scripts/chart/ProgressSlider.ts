import { _decorator, Component, ProgressBar, Slider } from "cc";
import { ChartPlayer } from "./ChartPlayer";
import { EditStateManager } from "../editor/EditStateManager";
import { ChartEditor } from "../editor/ChartEditor";
import { MeasureLine } from "../editor/MeasureLine";
import { MeasureLinePool } from "../editor/MeasureLinePool";
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
        if (!EditStateManager.editing) {
            this.chartPlayer.pauseMusic();
        }
    }

    onSliderChange() {
        if (!EditStateManager.editing) {
            this.chartPlayer.setGlobalTimeByProgress(this.slider.progress);
        } else {
            ChartEditor.Instance.setEditorTimeByProgress(this.slider.progress);
        }
    }

    onSliderEnd() {
        if (!EditStateManager.editing) {
            this.chartPlayer.resumeMusic();
        }
    }



    // # Functions
    updateProgress(progress: number) {
        this.slider.progress = progress;
        this.progressBar.progress = progress;
    }
}