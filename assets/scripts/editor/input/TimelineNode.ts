import { _decorator, Button, Component, EditBox, Enum, Label, Node, NodeEventType, Sprite, UITransform, v3 } from 'cc';
import { Timeline, TimelineColor } from './Timeline';
import { NumericInput } from './NumericInput';
const { ccclass, property } = _decorator;

enum TimelineNodeType {
    position = 0, opacity = 1, speed = 2, text = 3
}

@ccclass('TimelineNode')
export class TimelineNode extends Component {
    @property(Node)
    nodeDataBox: Node = null;
    @property(Button)
    nodeButton: Button = null;
    @property(Sprite)
    nodeSprite: Sprite = null;
    @property(Label)
    label: Label = null;
    @property(EditBox)
    firstInput: EditBox = null;
    @property(EditBox)
    secondInput: EditBox = null;
    @property(NumericInput)
    easingTypeInput: NumericInput = null;
    @property({type: Enum(TimelineNodeType), serializable: true})
    type: TimelineNodeType = TimelineNodeType.position;

    timeline: Timeline = null;
    open: boolean = false;
    time: [number, number] = [0, 0];

    get value() {
        if (this.type == TimelineNodeType.position) {
            return [Number.parseFloat(this.firstInput.string), Number.parseFloat(this.secondInput.string)];
        }
        if (this.type == TimelineNodeType.text) {
            return this.firstInput.string;
        }
        return Number.parseFloat(this.firstInput.string);
    }

    set value(val) {
        if (this.type == TimelineNodeType.position) {
            this.firstInput.string = val[0];
            this.secondInput.string = val[1];
            return;
        }
        this.firstInput.string = val.toString();
    }

    onLoad() {
        this.nodeVariant();
        this.nodeDataBox.active = false;
        this.on();
    }

    on() {
        this.nodeButton.node.on("click", this.toggleData, this);
    }

    off() {
        this.nodeButton.node.off("click", this.toggleData, this);
    }

    toggleData() {
        this.open = !this.open;
        this.nodeDataBox.active = this.open;
    }

    close() {
        this.open = false;
        this.nodeDataBox.active = false;
    }

    nodeVariant() {
        this.firstInput.node.active = true;
        this.secondInput.node.active = true;
        this.nodeSprite.color = TimelineColor.get(this.type);
        if (this.type == TimelineNodeType.position) {
            this.label.string = "position";
            this.firstInput.placeholder = "x";
            this.secondInput.placeholder = "y";
        } else {
            this.secondInput.node.active = false;
            this.firstInput.node.position = v3(27, 0)
            this.firstInput.getComponent(UITransform).width = 150;
            if (this.type == TimelineNodeType.text) {
                this.firstInput.node.position = v3(75, 0)
                this.firstInput.getComponent(UITransform).width = 250;
                this.firstInput.maxLength = 40;
                this.firstInput.inputMode = EditBox.InputMode.SINGLE_LINE;
                this.label.string = "text";
                this.firstInput.placeholder = "text";
                this.easingTypeInput.node.active = false;
            } else if (this.type == TimelineNodeType.opacity) {
                this.label.string = "opacity";
                this.firstInput.placeholder = "opacity";
            } else if (this.type == TimelineNodeType.speed) {
                this.label.string = "speed";
                this.firstInput.placeholder = "speed";
            }
        }
    }
}


