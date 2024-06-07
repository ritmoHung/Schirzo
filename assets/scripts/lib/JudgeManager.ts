import { KeyCode } from "cc";

export enum JudgementType {
    PDecrypt = "perfect decrypt",
    Decrypt = "decrypt",
    Good = "good",
    Cypher = "cypher",
}

export interface Judgements {
    [JudgementType.PDecrypt]: { count: number; early: number; late: number };
    [JudgementType.Decrypt]: { count: number; early: number; late: number };
    [JudgementType.Good]: { count: number; early: number; late: number };
    [JudgementType.Cypher]: { count: number; early: number; late: number };
}

const BASE_SCORE: number = 1000000;
const BASE_ACCURACY: number = 100;
export const P_DECRYPT_RANGE: number = 40;
export const DECRYPT_RANGE: number = 80;
export const GOOD_RANGE: number = 120;
export const ACTIVE_RANGE: number = 120;

export class JudgeManager {
    private static instance: JudgeManager
    private _judgements: Judgements = {
        [JudgementType.PDecrypt]: { count: 0, early: 0, late: 0 },
        [JudgementType.Decrypt]: { count: 0, early: 0, late: 0 },
        [JudgementType.Good]: { count: 0, early: 0, late: 0 },
        [JudgementType.Cypher]: { count: 0, early: 0, late: 0 },
    };

    public activeKeys: Map<KeyCode, boolean> = new Map()
    public noteCount: number = 0
    private maxCombo: number = 0
    private _combo: number = 0
    private _score: number = 0
    private _accuracy: string = "0.00"


    
    // # Constructor
    private constructor() {
        // Private constructor to prevent direct construction calls with the `new` operator.
    }

    public static getInstance(): JudgeManager {
        if (!JudgeManager.instance) {
            JudgeManager.instance = new JudgeManager();
        }
        return JudgeManager.instance;
    }



    // # Functions
    public addNoteCount() {
        this.noteCount++;
    }

    public judgeNote(dt: number) {
        const absDt = Math.abs(dt);
        if (absDt <= P_DECRYPT_RANGE) {
            this.addJudgement(JudgementType.PDecrypt, dt);
            this.addCombo();
        } else if (absDt <= DECRYPT_RANGE) {
            this.addJudgement(JudgementType.Decrypt, dt);
            this.addCombo();
        } else if (absDt <= GOOD_RANGE) {
            this.addJudgement(JudgementType.Good, dt);
            this.addCombo();
        } else {
            this.addJudgement(JudgementType.Cypher, dt);
            this.resetCombo();
        }

        this.calculateScoreAndAccuracy();
    }

    private addJudgement(type: JudgementType, dt: number) {
        console.log(type.toUpperCase());
        if (this._judgements.hasOwnProperty(type)) {
            this._judgements[type].count++;

            if (dt >= 0) {
                this._judgements[type].early++;
            } else{
                this._judgements[type].late++;
            }
        }
    }

    private calculateScoreAndAccuracy() {
        this._score = Math.round(
            ((this._judgements[JudgementType.PDecrypt].count + this._judgements[JudgementType.Decrypt].count)
            + 0.7 * this._judgements[JudgementType.Good].count)
            * (BASE_SCORE / this.noteCount)
        ) + this.maxCombo;
        this._accuracy = Number(
            (this._judgements[JudgementType.PDecrypt].count
            + 0.9 * this._judgements[JudgementType.Decrypt].count
            + 0.7 * this._judgements[JudgementType.Good].count)
            * (BASE_ACCURACY / this.noteCount)
        ).toFixed(2);
    }

    addCombo() {
        this._combo++;
        if (this.combo > this.maxCombo) {
            this.maxCombo = this.combo;
        }
    }

    resetCombo() {
        this._combo = 0;
    }

    get judgements(): Judgements {
        return this._judgements;
    }

    get combo(): number {
        return this._combo;
    }

    get score(): number {
        return this._score;
    }

    get accuracy(): string {
        return this._accuracy;
    }

    public reset() {
        this._judgements = {
            [JudgementType.PDecrypt]: { count: 0, early: 0, late: 0 },
            [JudgementType.Decrypt]: { count: 0, early: 0, late: 0 },
            [JudgementType.Good]: { count: 0, early: 0, late: 0 },
            [JudgementType.Cypher]: { count: 0, early: 0, late: 0 },
        };
    
        this.activeKeys = new Map();
        this.noteCount = 0;
        this.maxCombo = 0;
        this._combo = 0;
        this._score = 0;
        this._accuracy = "00.00";
    }
}