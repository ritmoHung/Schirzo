import { _decorator, Button, Component, director } from "cc";
const { ccclass, property } = _decorator;

@ccclass("ResultScreen")
export class ResultScreen extends Component {
    @property(Button)
    retryButton: Button | null = null


    // # Lifecycle
    onLoad() {
        this.retryButton.node.on("click", () => this.retry());
    }



    // # Functions
    retry() {
        director.loadScene("chart");
    }
}