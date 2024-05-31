import { _decorator, Component, EditBox, Node } from 'cc';
import { NumericInput } from './input/NumericInput';
import { ChartEditor } from './ChartEditor';
const { ccclass, property } = _decorator;

@ccclass('NoteProperties')
export class NoteProperties extends Component {
    @property(NumericInput)
    noteTypeInput: NumericInput = null;
    @property(EditBox)
    buttonPressEditbox: EditBox = null;

    get noteIndex() {
        return this.noteTypeInput.index;
    }

    get key() {
        return this.buttonPressEditbox.string;
    }

    onLoad() {
        this.noteTypeInput.node.on("change", this.specificNoteSettings, this);
    }

    specificNoteSettings(value: string) {
        this.buttonPressEditbox.node.parent.active = value == "key";
        ChartEditor.Instance.updatePreviewNote();
    }

    editBoxLowerCase(text: string) {
        if (text.toLowerCase() != text) {
            this.buttonPressEditbox.string = text.toLowerCase();
        }
    }
}


