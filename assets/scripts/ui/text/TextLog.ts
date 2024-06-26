import { _decorator, Component, RichText } from "cc";
const { ccclass, property } = _decorator;

@ccclass("TextLog")
export class TextLog extends Component {
    @property(RichText)
    richText: RichText

    @property
    text: string = ""



    // # Lifecycle
    onLoad() {
        this.richText.string = this.text;
    }
}