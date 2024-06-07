import { _decorator, EventKeyboard, KeyCode, RichText } from "cc";
import { JudgePoint } from "../JudgePoint";
import { ClickNote } from "./ClickNote";
const { ccclass, property } = _decorator;

const keyCodeMap: { [key: string]: KeyCode } = {
    A: KeyCode.KEY_A,
    B: KeyCode.KEY_B,
    C: KeyCode.KEY_C,
    D: KeyCode.KEY_D,
    E: KeyCode.KEY_E,
    F: KeyCode.KEY_F,
    G: KeyCode.KEY_G,
    H: KeyCode.KEY_H,
    I: KeyCode.KEY_I,
    J: KeyCode.KEY_J,
    K: KeyCode.KEY_K,
    L: KeyCode.KEY_L,
    M: KeyCode.KEY_M,
    N: KeyCode.KEY_N,
    O: KeyCode.KEY_O,
    P: KeyCode.KEY_P,
    Q: KeyCode.KEY_Q,
    R: KeyCode.KEY_R,
    S: KeyCode.KEY_S,
    T: KeyCode.KEY_T,
    U: KeyCode.KEY_U,
    V: KeyCode.KEY_V,
    W: KeyCode.KEY_W,
    X: KeyCode.KEY_X,
    Y: KeyCode.KEY_Y,
    Z: KeyCode.KEY_Z
};

@ccclass("KeyNote")
export class KeyNote extends ClickNote {
    @property(RichText)
    richText: RichText



    // # Lifecycle
    update() {
        super.update();
    }

    protected onKeyDown(event: EventKeyboard): void {
        super.onKeyDown(event);
    }

    protected onKeyPressing(event: EventKeyboard): void {
        super.onKeyPressing(event);
    }

    protected onKeyUp(event: EventKeyboard): void {
        super.onKeyUp(event);
    }



    // # Functions
    initialize(data: any, judgePoint: JudgePoint) {
        super.initialize(data, judgePoint);

        const keyChar = data.key;
        this.richText.string = keyChar;
        this.key = keyCodeMap[keyChar.toUpperCase()];
    }
}