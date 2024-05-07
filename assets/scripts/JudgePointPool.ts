import { _decorator, Component, instantiate, Node, Prefab } from "cc";
import { JudgePoint } from './JudgePoint';
const { ccclass, property } = _decorator;

@ccclass("JudgePointPool")
export class JudgePointPool extends Component {
    @property(Prefab)
    judgePointPrefab: Prefab | null = null

    private pool: Node[] = []

    

    // # Functions
    createJudgePoints(judgePointList: any[]) {
        judgePointList.forEach(judgePointData => {
            const node = this.createJudgePoint(judgePointData);
        });
    }

    createJudgePoint(judgePointData: any): Node {
        let judgePoint = this.pool.find(node => !node.active);

        if (!judgePoint) {
            judgePoint = instantiate(this.judgePointPrefab);
            this.pool.push(judgePoint);
        }

        judgePoint.active = true;
        judgePoint.parent = this.node;
        this.initializeJudgePoint(judgePoint, judgePointData);
        return judgePoint;
    }

    initializeJudgePoint(judgePoint: Node, judgePointData: any) {
        const judgePointComponent = judgePoint.getComponent(JudgePoint) as JudgePoint;
        if (judgePointComponent) {
            judgePointComponent.initialize(judgePointData);
        }
    }

    startAllTweens() {
        this.pool.forEach(node => {
            if (node.active) {
                const judgePointComponent = node.getComponent(JudgePoint);
                if (judgePointComponent) {
                    judgePointComponent.startAllTweens();
                }
            }
        });
    }

    stopAllTweens() {
        this.pool.forEach(node => {
            if (node.active) {
                const judgePointComponent = node.getComponent(JudgePoint);
                if (judgePointComponent) {
                    judgePointComponent.stopAllTweens();
                }
            }
        });
    }
}