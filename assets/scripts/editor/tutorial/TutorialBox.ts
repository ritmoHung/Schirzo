import { _decorator, Button, Component, Node, tween, UIOpacity } from 'cc';
import { ChartEditor } from '../ChartEditor';
import { NumericInput } from '../input/NumericInput';
const { ccclass, property } = _decorator;

@ccclass('TutorialBox')
export class TutorialBox extends Component {
    @property(Button)
    openButton: Button = null;
    @property(Button)
    closeButton: Button = null;
    @property(NumericInput)
    pageInput: NumericInput = null;
    @property([Node])
    pages: Node[] = [];
    @property(UIOpacity)
    boxOpacity: UIOpacity = null;

    onLoad() {
        this.openButton.node.on("click", this.openTutorial, this);
        this.closeButton.node.on("click", this.closeTutorial, this);
        this.pageInput.node.on("change", this.flip, this);
        this.boxOpacity.opacity = 0;
        this.flip();
        
        this.node.active = false;
    }

    openTutorial() {
        this.node.active = true;
        this.boxOpacity.opacity = 0;
        tween(this.boxOpacity).to(0.25, {opacity: 255}).start();
    }

    flip() {
        for (let i = 0; i < this.pages.length; i++) {
            this.pages[i].active = this.pageInput.index == i;
        }
    }

    closeTutorial() {
        tween(this.boxOpacity).to(0.25, {opacity: 0}).start();
        this.scheduleOnce(() => this.node.active = false, 0.25);
    }
}


