import { _decorator, Button, CCString, Component, Label, Node } from 'cc';
import { Chart } from '../lib/Chart';
const { ccclass, property } = _decorator;

@ccclass('ImportButton')
export class ImportButton extends Component {
    @property(Button)
    trigger: Button = null;
    @property(Label)
    label: Label = null;
    @property(CCString)
    acceptType: string = "";

    file: File = null;

    onLoad() {
        this.trigger.node.on("click", this.importFile, this);
    }

    importFile() {
        let input = document.createElement("input");
        input.setAttribute("type", "file");
        input.setAttribute("accept", this.acceptType);
        input.setAttribute("style", "display:none");
        document.body.appendChild(input);
        input.addEventListener("input", async (event) => {
            const file = (event.target as HTMLInputElement).files[0];
            if (this.acceptType == ".json") {
                fetch(URL.createObjectURL(file)).then((r) => r.text()).then(Chart.validateChart)
                .then((pass) => {
                    if (pass) {
                        this.file = file;
                        this.label.string = file.name;
                        this.node.emit("file-change");
                    } else {
                        this.file = null;
                        this.label.string = "wrong format!";
                    }
                })
            } else {
                this.file = file;
                this.label.string = file.name;
                this.node.emit("file-change");
            }
        })
        input.click();
    }
}


