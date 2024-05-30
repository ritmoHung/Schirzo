import { _decorator, assetManager, AudioClip, Button, Color, Component, Label, Node, Tween, tween, v2, v3 } from 'cc';
import { ChartPlayer } from '../chart/ChartPlayer';
import { NumericInput } from './input/NumericInput';
import { Toggles } from './input/Toggles';
import { Chart } from '../lib/Chart';
import { JudgePoint } from '../chart/JudgePoint';
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

    @property(Node)
    judgePointNotSelectedNode: Node = null;
    @property(Node)
    judgePointSelectedNode: Node = null;

    @property(NumericInput)
    judgePointInput: NumericInput = null;
    @property(NumericInput)
    editTargetInput: NumericInput = null;

    @property(Node)
    notePropertiesCtrl: Node = null;
    @property(Node)
    eventPropertiesCtrl: Node = null;

    public selectedJudgePoint: JudgePoint = null;

    private static instance: ChartEditor = null;

    public static get Instance(): ChartEditor {
        return this.instance;
    }

    onLoad() {
        ChartEditor.instance = this;
        this.clearData();
        this.renewButton.node.on("click", this.clearData, this);
        this.saveButton.node.on("click", this.saveChart, this);
        this.importChartButton.node.on("click", this.importChart, this);
        this.importMusicButton.node.on("click", this.importMusic, this);
        this.judgePointInput.node.on("change", this.updateJudgePointPool, this);
        this.editTargetInput.node.on("change", this.propsUpdate, this);
    }
    
    onDestroy() {
        ChartEditor.instance = null;
    }

    update(dt: number) {
        this.updateMusicProgress();
        this.updateJudgePointProps();
    }

    public togglePauseButton(pause: boolean) {
        if (pause) {
            this.startLabel.string = "STart";
        } else {
            this.startLabel.string = "pAuse";
        }
    }

    // Judge point selection
    selectJudgePoint(object: JudgePoint) {
        console.log("test");
        this.selectedJudgePoint = object;
        this.updateJudgePointProps();
        for (const sprite of ChartPlayer.Instance.judgePointPool.sprites) {
            if (sprite.node.parent.uuid == object.node.uuid) {
                sprite.color = new Color("#FFFFFF");
                tween(sprite.node).to(0.1, {scale: v3(1.1, 1.1, 1)}, {easing: "sineInOut"}).start();
            } else {
                sprite.color = new Color("#999999");
                tween(sprite.node).stop().to(0.1, {scale: v3(1, 1, 1)}, {easing: "sineInOut"}).start();
            }
        }
    }

    // Control
    updateJudgePointPool(value: string) {
        const count = Number.parseInt(value);
        const poolObj = ChartPlayer.Instance.judgePointPool;
        if (count > poolObj.pool.length) {
            ChartPlayer.Instance.chartData.judgePointList.push(Chart.distributedJudgePoint(count-1));

            const judgePoint = ChartPlayer.Instance.convertJudgePointEvents(Chart.distributedJudgePoint(count-1), ChartPlayer.Instance.chartData.bpmEvents);
            const node = ChartPlayer.Instance.judgePointPool.createJudgePoint(judgePoint);
        } else if (count < poolObj.pool.length) {
            ChartPlayer.Instance.chartData.judgePointList.pop();
            
            const removedNode = ChartPlayer.Instance.judgePointPool.popJudgePoint();
            if (this.selectedJudgePoint && this.selectedJudgePoint.node.uuid == removedNode.uuid) {
                this.selectedJudgePoint = null;
            }
            removedNode.destroy();
        }
        //ChartPlayer.Instance.reloadChart();
    }

    propsUpdate(value: string) {
        if (value == "note") {
            this.eventPropertiesCtrl.active = false;
            this.notePropertiesCtrl.active = true;
        } else if (value == "event") {
            this.notePropertiesCtrl.active = false;
            this.eventPropertiesCtrl.active = true;

        }
    }

    clearData() {
        ChartPlayer.Instance.chartData = Chart.defaultJson;
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
            this.startButton.interactable = true;
            this.restartButton.interactable = true;
            ChartPlayer.Instance.pauseButton.interactable = true;
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
            this.musicProgressLabel.string = "no bpM eVents"
        } else {
            const [bar, beat] = ChartPlayer.Instance.convertToChartTime(ChartPlayer.Instance.getGlobalTime(), ChartPlayer.Instance.chartData.bpmEvents);
            if (bar == -1 && beat == -1) {
                this.musicProgressLabel.string = `The End`
            } else {
                this.musicProgressLabel.string = ` bar ${bar}, beAt ${beat}`
            }
        }
    }

    updateJudgePointProps() {
        if (this.selectedJudgePoint) {
            this.judgePointNotSelectedNode.active = false;
            this.judgePointSelectedNode.active = true;
        } else {
            this.judgePointNotSelectedNode.active = true;
            this.judgePointSelectedNode.active = false;
        }
    }
}


