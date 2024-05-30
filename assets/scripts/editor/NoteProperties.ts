import { _decorator, Component, EditBox, Node } from 'cc';
import { NumericInput } from './input/NumericInput';
const { ccclass, property } = _decorator;

@ccclass('NoteProperties')
export class NoteProperties extends Component {
    @property(NumericInput)
    noteTypeInput: NumericInput = null;
    @property(EditBox)
    buttonPressEditbox: EditBox = null;

    onLoad() {
        this.noteTypeInput.node.on("change", this.specificNoteSettings, this);
    }

    specificNoteSettings(value: string) {
        this.buttonPressEditbox.node.parent.active = value == "key";
    }

    editBoxLowerCase(text: string) {
        if (text.toLowerCase() != text) {
            this.buttonPressEditbox.string = text.toLowerCase();
        }
    }
}


