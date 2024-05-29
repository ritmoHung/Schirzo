import { _decorator, assetManager, AudioClip, Button, Component, Label, Node } from 'cc';
import { ChartEditor } from './ChartEditor';
const { ccclass, property } = _decorator;

@ccclass('UIManager')
export class UIManager extends Component {
    @property(Button)
    saveButton: Button = null;
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

    private static instance: UIManager = null;

    public static get Instance(): UIManager {
        return this.instance;
    }

    onLoad() {
        UIManager.instance = this;
        this.saveButton.node.on("click", this.saveChart);
        this.importChartButton.node.on("click", this.importChart);
        this.importMusicButton.node.on("click", this.importMusic);
    }

    public togglePauseButton(pause: boolean) {
        if (pause) {
            this.startLabel.string = "STart";
        } else {
            this.startLabel.string = "pAuse";
        }
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
            ChartEditor.Instance.chartData.chart = json;
            ChartEditor.Instance.loadChart(json);
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
            UIManager.Instance.musicNameLabel.string = file.name;
            assetManager.loadRemote<AudioClip>(URL.createObjectURL(file), { "ext": ".ogg" }, (err, data) => {
                if (!err) {
                    ChartEditor.Instance.chartData.audio = data;
                    ChartEditor.Instance.loadMusic(data);
                }
            })
        })
        input.click();
    }
}


