import { _decorator, Button, Component, Node } from "cc";
import { ChartEditor } from "./ChartEditor";
import { ChartPlayer } from "../chart/ChartPlayer";
import { TimelinePool } from "./TimelinePool";
const { ccclass, property } = _decorator;

@ccclass("EditStateManager")
export class EditStateManager extends Component {
    @property(Node)
    playerControls: Node = null;
    @property(Node)
    editerControls: Node = null;

    @property(Button)
    switchToEditorButton: Button = null;
    @property(Button)
    switchToPlayerButton: Button = null;

    currentEditing: boolean = true;

    private static instance: EditStateManager = null;
    private initializing = true;



    // # Constructor
    public static getInstance(): EditStateManager {
        if (!EditStateManager.instance) {
            EditStateManager.instance = new EditStateManager();
        }
        return EditStateManager.instance;
    }



    // # Lifecycle
    onLoad() {
        EditStateManager.instance = this;
    }
    
    start() {
        this.currentEditing = true;
        this.playerControls.active = false;
        this.editerControls.active = true;
        this.switchToEditorButton.node.on("click", () => this.pageSwitch(true), this);
        this.switchToPlayerButton.node.on("click", () => this.pageSwitch(false), this);
    }



    // # Functions
    /*
    onDestroy() {
        this.switchToEditorButton.node.off("click", () => this.pageSwitch(true), this);
        this.switchToPlayerButton.node.off("click", () => this.pageSwitch(false), this);
    }*/

    pageSwitch(editing: boolean) {
        this.currentEditing = editing;
        this.playerControls.active = !editing;
        this.editerControls.active = editing;
        if (editing) {
            ChartPlayer.Instance.pauseGame();
            ChartPlayer.Instance.quitGame();
            ChartPlayer.Instance.node.active = false;
        } else {
            TimelinePool.Instance.publishTimelines();
            TimelinePool.Instance.publishTextEvent();
            ChartEditor.Instance.audioSource.stop();

            ChartPlayer.Instance.node.active = true;
            ChartPlayer.Instance.editorChartData = {chart: ChartEditor.Instance.publishChart(), audio: ChartEditor.Instance.audioSource.clip};
            console.log(ChartEditor.Instance.publishChart());
            if (this.initializing) {
                ChartPlayer.Instance.prepareGame();
                this.initializing = false;
            } else {
                ChartPlayer.Instance.reloadGame();
            }
        }
    }

    public static get editing() {
        return EditStateManager.instance ? EditStateManager.instance.currentEditing : false;
    }

    public static get playerInit() {
        return EditStateManager.instance ? EditStateManager.instance.initializing : false;
    }
}