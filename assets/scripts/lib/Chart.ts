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

    export function timeInRange([targetBar, targetUnit], [startBar, startUnit], [endBar, endUnit]) {
        return (startBar < targetBar || startBar == targetBar && startUnit <= targetUnit) && (targetBar < endBar || targetBar == endBar && targetUnit < endBar);
    }

    export function validateChart(text: string) {
        const json = JSON.parse(text);
        return json.formatVersion && json.bpmEvents && json.judgePointList;
    }
}