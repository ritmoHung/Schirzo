import { _decorator, Button, Component, Node } from 'cc';
import { ChartEditor } from './ChartEditor';
import { ChartPlayer } from '../chart/ChartPlayer';
import { TimelinePool } from './TimelinePool';
const { ccclass, property } = _decorator;

@ccclass('EditStateManager')
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

    public static get editing() {
        return EditStateManager.instance ? EditStateManager.instance.currentEditing : false;
    }

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

    pageSwitch(editing: boolean) {
        this.currentEditing = editing;
        this.playerControls.active = !editing;
        this.editerControls.active = editing;
        if (editing) {
            ChartPlayer.Instance.stopGame();
            ChartPlayer.Instance.node.active = false;
        } else {
            TimelinePool.Instance.publishTimelines();
            TimelinePool.Instance.publishTextEvent();
            ChartEditor.Instance.audioSource.stop();

            ChartPlayer.Instance.node.active = true;
            ChartPlayer.Instance.loadChartFrom(ChartEditor.Instance.publishChart());
            ChartPlayer.Instance.loadMusicFrom(ChartEditor.Instance.audioSource.clip);
        }
    }
}

