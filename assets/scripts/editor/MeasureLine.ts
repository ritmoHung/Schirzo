import { _decorator, Component, Node, Prefab } from 'cc';
import { ChartEditor } from './ChartEditor';
const { ccclass, property } = _decorator;

@ccclass('MeasureLine')
export class MeasureLine extends Component {
    bar = 0;
    beat = 0;
    
    update(dt: number) {
        ChartEditor.Instance.selectedJudgePoint;
    }

    updateLineHeight() {
    }
}


