export module Chart {
    export const defaultJson = {
        formatVersion: "1.1",
        offset: 0,
        bpmEvents: [
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

    export function distributedJudgePoint(index: number) {
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