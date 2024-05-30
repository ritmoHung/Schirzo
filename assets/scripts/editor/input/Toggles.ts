import { _decorator, Button, Color, Component, Node, Sprite } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Toggles')
export class Toggles extends Component {
    @property([Button])
    toggles: Button[] = [];
    @property([String])
    keys: string[] = [];
    @property([Color])
    toggleColors: Color[] = [];

    private _map: Record<string, boolean> = {};

    public get selectionObject() {
        return this._map;
    }

    public get selectionArray() {
        return this.keys.filter((key) => this._map[key]);
    }
    
    onLoad() {
        this._map = Object.assign({}, ...this.keys.map((key) => ({[key]: false})));
        for (let i = 0; i < this.keys.length; i++) {
            this.toggles[i].node.on("click", () => this.onAnyPressed(i), this);
        }
    }

    onAnyPressed(idx: number) {
        const before = this._map[this.keys[idx]];
        this._map[this.keys[idx]] = !before;
        this.updateButton(idx, !before);
    }

    updateButton(idx: number, value: boolean) {
        if (value) {
            this.toggles[idx].getComponent(Sprite).color = this.toggleColors[idx];
        } else {
            this.toggles[idx].getComponent(Sprite).color = Color.WHITE;
        }
    }
}


