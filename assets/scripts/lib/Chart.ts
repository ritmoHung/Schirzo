import { ChartObject, JudgePoint } from "../chart/ChartPlayer";

export module Chart {
    export const defaultJson: ChartObject = {
        formatVersion: "1.1",
        offset: 0,
        bpm: [170, 4, 4],
        bpmEvents: [
            {
                startTime: [0, 0],
                endTime: [10, 0],
                bpm: [170, 4, 4]
            }
        ],
        judgePointList: [],
        textEventList: []
    }
    
    export const defaultJudgePoint = {
        isInvisible: false,
        noteList: [],
        speedEvents: [],
        positionEvents: [],
        rotateEvents: [],
        opacityEvents: []
    }

    export function distributedJudgePoint(index: number): any {
        return {
            ...defaultJudgePoint,
            positionEvents: [
				{
					"startTime": [0, 0],
		            "endTime": [1, 0],
		            "easing": "constant",
		            "start": [0.2 + 0.15 * index, 0.2],
		            "end": [0.2 + 0.15 * index, 0.2]
				}
            ]
        }
    }
}