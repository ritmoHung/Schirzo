import { _decorator, Color, Component, instantiate, Node, Prefab, Sprite } from "cc";
import { JudgePoint } from "./JudgePoint";
import { ChartEditor } from "../editor/ChartEditor";
import { EditorJudgePoint } from "../editor/EditorJudgePoint";
const { ccclass, property } = _decorator;

@ccclass("JudgePointPool")
export class JudgePointPool extends Component {
    @property(Prefab)
    judgePointPrefab: Prefab | null = null

    private _pool: Node[] = []
    private _sprites: Sprite[] = []

    public get pool() {
        return this._pool;
    }

    public get sprites() {
        return this._sprites;
    }

    // # Functions
    createJudgePoints(judgePointList: any[]) {
        judgePointList.forEach(judgePointData => {
            const node = this.createJudgePoint(judgePointData);
        });
    }

    createJudgePoint(judgePointData: any): Node {
        let judgePoint = this._pool.find(node => !node.active);

        if (!judgePoint) {
            judgePoint = instantiate(this.judgePointPrefab);
            if (ChartEditor.Instance) {
                judgePoint.getChildByName("JudgePointSprite").on("click", () => ChartEditor.Instance.selectJudgePoint(judgePoint.getComponent(EditorJudgePoint)), ChartEditor.Instance);
            }
            this._pool.push(judgePoint);
            
            const sprite = judgePoint.getChildByName("JudgePointSprite").getComponent(Sprite);
            sprite.color = new Color("#999999");
            this._sprites.push(sprite);
        }

        judgePoint.active = true;
        judgePoint.parent = this.node;
        this.initializeJudgePoint(judgePoint, judgePointData);
        return judgePoint;
    }

    popJudgePoint() {
        this._sprites.pop();
        return this._pool.pop();
    }

    initializeJudgePoint(judgePoint: Node, judgePointData: any) {
        const judgePointComponent = judgePoint.getComponent(JudgePoint) as JudgePoint;
        if (judgePointComponent) {
            judgePointComponent.initialize(judgePointData);
        }
    }

    reset() {
        this._pool.forEach(node => {
            node.destroy();
        });

        this._pool = [];
        this._sprites = [];
    }
}