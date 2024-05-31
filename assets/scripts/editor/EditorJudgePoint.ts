import { _decorator, instantiate, Node, UIOpacity, v3 } from "cc";
import { JudgePoint } from "../chart/JudgePoint";
import { ClickNote } from "../chart/notes/ClickNote";
import { KeyNote } from "../chart/notes/KeyNote";
import { DragNote } from "../chart/notes/DragNote";
import { HoldNote } from "../chart/notes/HoldNote";
import { Note } from "../chart/notes/Note";
import { ChartPlayer } from "../chart/ChartPlayer";
import { MeasureLinePool } from "./MeasureLinePool";
import { ChartEditor } from "./ChartEditor";
import { NoteProperties } from "./NoteProperties";

const { ccclass, property } = _decorator;

@ccclass("EditorJudgePoint")
export class EditorJudgePoint extends JudgePoint {
    index: number = 0;

    update(dt: number) {
        const globalTime = this.chartPlayer.getGlobalTime() || 0;

        // Reset search indexes if time rewinds
        if (globalTime < this.lastGlobalTime) this.lastEventIndexes = {};
        
        if (globalTime !== this.lastGlobalTime) {
            // Update NoteContainer position
            const offset = this.calculatePositionOffset(globalTime);
            this.topNoteContainer.setPosition(0, -offset, 0);
            this.bottomNoteContainer.setPosition(0, offset, 0);

            // Update last global time
            this.lastGlobalTime = globalTime;
        }

        for (const note of this.node.children) {
            let noteComponent: Note;
            switch (note.name) {
                case "ClickNotePrefab":
                    noteComponent = note.getComponent(ClickNote) as ClickNote;
                    break;
                case "KeyNotePrefab":
                    noteComponent = note.getComponent(KeyNote) as KeyNote;
                    break;
                case "DragNotePrefab":
                    noteComponent = note.getComponent(DragNote) as DragNote;
                    break;
                case "HoldNotePrefab":
                    noteComponent = note.getComponent(HoldNote) as HoldNote;
                    break;
            }
            if (!noteComponent) continue;
            note.position = v3(0, MeasureLinePool.Instance.barHeight * (noteComponent.noteTime[0] - MeasureLinePool.Instance.currentTime[0] + (noteComponent.noteTime[1] - MeasureLinePool.Instance.currentTime[1]) / ChartPlayer.Instance.UPB / ChartEditor.Instance.bpb));
            if (note.position.y < 0 || this.node.position.y > this.resolution.height * 0.75) {
                note.active = false;
            } else {
                note.active = true;
            }
        }
    }

    createNote(noteData: any): Node {
        let note: Node, noteComponent: Note;
        switch (noteData.type) {
            case 0:
                note = instantiate(this.chartPlayer.clickNotePrefab);
                noteComponent = note.getComponent(ClickNote) as ClickNote;
                break;
            case 1:
                note = instantiate(this.chartPlayer.keyNotePrefab);
                noteData = {...noteData, key: ChartEditor.Instance.noteProperties.key};
                noteComponent = note.getComponent(KeyNote) as KeyNote;
                break;
            case 2:
                note = instantiate(this.chartPlayer.dragNotePrefab);
                noteComponent = note.getComponent(DragNote) as DragNote;
                break;
            case 3:
                note = instantiate(this.chartPlayer.holdNotePrefab);
                noteComponent = note.getComponent(HoldNote) as HoldNote;
                break;
        }

        if (noteComponent) {
            noteComponent.initialize(noteData, this);
            noteComponent.enabled = false;
        }

        ChartPlayer.Instance.chartData.judgePointList[ChartEditor.Instance.selectedJudgePoint.index].noteList.push(noteData);

        note.active = true;
        this.node.addChild(note);
        return note;
    }
}