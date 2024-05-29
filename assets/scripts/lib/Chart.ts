export interface BPMEventData {
    startTime: [number, number];
    endTime: [number, number];
    bpm: [number, number, number];
}

export interface EventData {
    startTime: [number, number] | number;
    endTime: [number, number] | number;
    easing: string;
    start: number;
    end: number;
}

export interface JudgePointData {
    noteList: any[];
    speedEvents: EventData[];
    positionEvents: EventData[];
    rotateEvents: EventData[];
    opacityEvents: EventData[];
}