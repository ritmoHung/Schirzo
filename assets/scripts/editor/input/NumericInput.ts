import { _decorator, Button, CCString, clamp, Component, EventTarget, Label, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('NumericInput')
export class NumericInput extends Component {
    @property(Button)
    subButton: Button = null;
    @property(Button)
    addButton: Button = null;
    @property(Label)
    numberLabel: Label = null;

    @property([CCString])
    public values: string[] = [];

    private selectIdx: number = 0;

    public get index() {
        return this.selectIdx;
    }

    public get string() {
        return this.values[this.selectIdx].toLowerCase();
    }

    public get rawString() {
        return this.values[this.selectIdx];
    }

    public setString(value: string, defaultIndex = 0) {
        this.selectIdx = this.values.indexOf(value);
        if (this.selectIdx == -1) {
            this.selectIdx = defaultIndex;
        }
    }

    public set interactable(value: boolean) {
        this.subButton.interactable = value;
        this.addButton.interactable = value;
    }

    onLoad() {
        this.subButton.node.on("click", () => this.selectionChange(-1), this);
        this.addButton.node.on("click", () => this.selectionChange(1), this);
        this.numberLabel.string = this.values[this.selectIdx];
        this.subButton.interactable = false;
    }

    selectionChange(offset: number) {
        this.selectIdx = clamp(this.selectIdx + offset, 0, this.values.length-1);
        this.numberLabel.string = this.values[this.selectIdx];
        this.subButton.interactable = this.selectIdx > 0;
        this.addButton.interactable = this.selectIdx < this.values.length - 1;
        this.node.emit("change", this.numberLabel.string.toLowerCase());
    }

    clear() {
        this.selectIdx = 0;
        this.numberLabel.string = this.values[this.selectIdx];
        this.subButton.interactable = this.selectIdx > 0;
        this.addButton.interactable = this.selectIdx < this.values.length - 1;
        this.node.emit("change", this.numberLabel.string.toLowerCase());
    }
}


