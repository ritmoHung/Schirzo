export enum JudgementType {
    Decoded = "decoded",
    Perfect = "perfect",
    Good = "good",
    Bad = "bad",
    Miss = "miss",
}

export interface Judgements {
    [JudgementType.Decoded]: { count: number; early: number; late: number };
    [JudgementType.Perfect]: { count: number; early: number; late: number };
    [JudgementType.Good]: { count: number; early: number; late: number };
    [JudgementType.Bad]: { count: number; early: number; late: number };
    [JudgementType.Miss]: { count: number; early: number; late: number };
}

const BASE_SCORE: number = 1000000;
const BASE_ACCURACY: number = 100;
const DECODED_RANGE: number = 40;
export const PERFECT_RANGE: number = 80;
export const GOOD_RANGE: number = 120;
export const BAD_RANGE: number = 160;

export class JudgeManager {
    private static instance: JudgeManager
    private _judgements: Judgements = {
        [JudgementType.Decoded]: { count: 0, early: 0, late: 0 },
        [JudgementType.Perfect]: { count: 0, early: 0, late: 0 },
        [JudgementType.Good]: { count: 0, early: 0, late: 0 },
        [JudgementType.Bad]: { count: 0, early: 0, late: 0 },
        [JudgementType.Miss]: { count: 0, early: 0, late: 0 },
    };

    public noteCount: number = 0
    private maxCombo: number = 0
    private _combo: number = 0
    private _score: number = 0
    private _accuracy: string = "00.00"


    
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
        if (absDt <= DECODED_RANGE) {
            this.addJudgement(JudgementType.Decoded, dt);
            this.addCombo();
        } else if (absDt <= PERFECT_RANGE) {
            this.addJudgement(JudgementType.Perfect, dt);
            this.addCombo();
        } else if (absDt <= GOOD_RANGE) {
            this.addJudgement(JudgementType.Good, dt);
            this.addCombo();
        } else if (absDt <= BAD_RANGE) {
            this.addJudgement(JudgementType.Bad, dt);
            this.resetCombo();
        } else {
            this.addJudgement(JudgementType.Miss, dt);
            this.resetCombo();
        }

        this.calculateScoreAndAccuracy();
    }

    private addJudgement(type: JudgementType, dt: number) {
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
            ((this._judgements[JudgementType.Decoded].count + this._judgements[JudgementType.Perfect].count)
            + 0.7 * this._judgements[JudgementType.Good].count
            + 0.3 * this._judgements[JudgementType.Bad].count)
            * (BASE_SCORE / this.noteCount)
        ) + this.maxCombo;
        this._accuracy = Number(
            (this._judgements[JudgementType.Decoded].count
            + 0.7 * this._judgements[JudgementType.Perfect].count
            + 0.3 * this._judgements[JudgementType.Good].count)
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
            [JudgementType.Decoded]: { count: 0, early: 0, late: 0 },
            [JudgementType.Perfect]: { count: 0, early: 0, late: 0 },
            [JudgementType.Good]: { count: 0, early: 0, late: 0 },
            [JudgementType.Bad]: { count: 0, early: 0, late: 0 },
            [JudgementType.Miss]: { count: 0, early: 0, late: 0 },
        };
    
        this.noteCount = 0
        this.maxCombo = 0
        this._combo = 0
        this._score = 0
        this._accuracy = "00.00"
    }
}