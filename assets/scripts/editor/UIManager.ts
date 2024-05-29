import { _decorator, assetManager, AudioClip, Button, Component, Label, Node } from 'cc';
import { ChartPlayer } from '../chart/ChartPlayer';
const { ccclass, property } = _decorator;

@ccclass('ChartEditor')
export class ChartEditor extends Component {
    @property(Button)
    saveButton: Button = null;
    @property(Button)
    renewButton: Button = null;
    @property(Button)
    startButton: Button = null;
    @property(Button)
    restartButton: Button = null;
    @property(Label)
    startLabel: Label = null;
    @property(Button)
    importChartButton: Button = null;
    @property(Button)
    importMusicButton: Button = null;
    @property(Label)
    musicNameLabel: Label = null;
    @property(Label)
    musicProgressLabel: Label = null;

    private static instance: ChartEditor = null;

    public static get Instance(): ChartEditor {
        return this.instance;
    }

    onLoad() {
        ChartEditor.instance = this;
        this.renewButton.node.on("click", this.clearData, this);
        this.saveButton.node.on("click", this.saveChart, this);
        this.importChartButton.node.on("click", this.importChart, this);
        this.importMusicButton.node.on("click", this.importMusic, this);
    }

    update(dt: number) {
        this.updateMusicProgress();
    }

    public togglePauseButton(pause: boolean) {
        if (pause) {
            this.startLabel.string = "STart";
        } else {
            this.startLabel.string = "pAuse";
        }
    }

    clearData() {
        ChartPlayer.Instance.chartData = {};
        ChartPlayer.Instance.clearData();
        this.musicNameLabel.string = "";
    }

    saveChart() {
    }
    
    importChart() {
        let input = document.createElement("input");
        input.setAttribute("type", "file");
        input.setAttribute("accept", ".json");
        input.setAttribute("style", "display:none");
        document.body.appendChild(input);
        input.addEventListener("input", async (event) => {
            const file = (event.target as HTMLInputElement).files[0];
            const json = JSON.parse(await file.text()) as Record<string, any>;
            ChartPlayer.Instance.chartData = json;
            ChartPlayer.Instance.loadChart(json);
            this.startButton.enabled = true;
            this.restartButton.enabled = true;
            ChartPlayer.Instance.pauseButton.enabled = true;
        })
        input.click();
    }
    
    importMusic() {
        let input = document.createElement("input");
        input.setAttribute("type", "file");
        input.setAttribute("accept", "audio/ogg");
        input.setAttribute("style", "display:none");
        document.body.appendChild(input);
        input.addEventListener("input", (event) => {
            let file = (event.target as HTMLInputElement).files[0];
            ChartEditor.Instance.musicNameLabel.string = file.name;
            assetManager.loadRemote<AudioClip>(URL.createObjectURL(file), { "ext": ".ogg" }, (err, data) => {
                if (!err) {
                    ChartPlayer.Instance.loadMusic(data);
                }
            })
        })
        input.click();
    }

    updateMusicProgress() {
        if (ChartPlayer.Instance.chartData?.bpmEvents == null) {
            this.musicProgressLabel.string = "No Chart Found"
        } else {
            const [bar, beat] = ChartPlayer.Instance.convertToChartTime(ChartPlayer.Instance.getGlobalTime(), ChartPlayer.Instance.chartData.bpmEvents);
            if (bar == -1 && beat == -1) {
                this.musicProgressLabel.string = `The End`
            } else {
                this.musicProgressLabel.string = ` BaR ${bar}, BeAt ${beat}`
            }
        }
    }
}


