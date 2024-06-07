import { _decorator, Button, EventMouse, Input, input, instantiate, Node, UIOpacity, v3 } from "cc";
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
import { EditorHoldNote } from "../chart/notes/EditorHoldNote";
import { Chart } from "../lib/Chart";

const { ccclass, property } = _decorator;

@ccclass("EditorJudgePoint")
export class EditorJudgePoint extends JudgePoint {
    index: number = 0;
    holdNote: EditorHoldNote = null;

    update(dt: number) {
        const globalTime = this.chartPlayer.getGlobalTime() || 0;

        // Reset search indexes if time rewinds
        if (globalTime < this.lastGlobalTime) this.lastEventIndexes = {};
        /*
        if (globalTime !== this.lastGlobalTime) {
            // Update NoteContainer position
            const offset = this.calculatePositionOffset(globalTime);
            this.topNoteContainer.setPosition(0, -offset, 0);
            this.bottomNoteContainer.setPosition(0, offset, 0);

            // Update last global time
            this.lastGlobalTime = globalTime;
        }*/

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
                case "EditorHoldNotePrefab":
                    noteComponent = note.getComponent(EditorHoldNote) as EditorHoldNote;
                    break;
            }
            if (!noteComponent) continue;
            note.position = v3(0, MeasureLinePool.Instance.barHeight * (noteComponent.noteTime[0] - MeasureLinePool.Instance.currentTime[0] + (noteComponent.noteTime[1] - MeasureLinePool.Instance.currentTime[1]) / ChartPlayer.Instance.editorUPB / ChartEditor.Instance.bpb));
            if (note.name == "EditorHoldNotePrefab") {
                const holdNote = noteComponent as EditorHoldNote;
                note.active = !(holdNote.endPos.y < 0 || holdNote.startPos.y > this.resolution.height * 0.75)
            } else {
                note.active = !(note.position.y < 0 || this.node.position.y > this.resolution.height * 0.75);
            }
        }

        if (this.holdNote) {
            this.holdNote.updateEnd(ChartEditor.Instance.hoverTime);
        }
    }

    hasNote(time: [number, number]) {
        for (const note of ChartEditor.Instance.selectedJudgePointData.noteList) {
            if (note.type == 3 && Chart.timeInRange(time, note.time, note.endTime)) {
            } else if (note.time[0] == time[0] && note.time[1] == time[1]) {
                return true;
            }
        }
        return false;
    }

    createNote(noteData: any): Node {
        let note: Node, noteComponent: Note;
        if (this.holdNote) {
            ChartEditor.Instance.selectedJudgePointData.noteList.push(this.holdNote.note);
            ChartEditor.Instance.holdSetting = false;
            this.holdNote.enabled = false;
            this.holdNote = null;
            return;
        }
        switch (noteData.type) {
            case 0:
                note = instantiate(this.chartPlayer.clickNotePrefab);
                noteComponent = note.getComponent(ClickNote) as ClickNote;
                break;
            case 1:
                note = instantiate(this.chartPlayer.keyNotePrefab);
                noteData = { ...noteData, key: ChartEditor.Instance.noteProperties.key };
                noteComponent = note.getComponent(KeyNote) as KeyNote;
                break;
            case 2:
                note = instantiate(this.chartPlayer.dragNotePrefab);
                noteComponent = note.getComponent(DragNote) as DragNote;
                break;
            case 3:
                note = instantiate(ChartEditor.Instance.editorHoldNotePrefab);
                noteComponent = note.getComponent(EditorHoldNote) as EditorHoldNote;
                break;
        }

        if (noteComponent) {
            noteComponent.initialize(noteData, this);
            noteComponent.keydownListen = false;
            if (noteData.type == 3) {
                ChartEditor.Instance.holdSetting = true;
                this.holdNote = noteComponent as EditorHoldNote;
                this.holdNote.updateEnd(noteData.time);
            } else {
                ChartEditor.Instance.selectedJudgePointData.noteList.push(noteData);
            }
        }
        this.node.addChild(note);
        return note;
    }

    removeNote(time: [number, number]) {
        const list: Record<string, any>[] = ChartEditor.Instance.selectedJudgePointData.noteList;
        let i
        for (i = 0; i < list.length; i++) {
            if (list[i].time[0] == time[0] && list[i].time[1] == time[1]) {
                list.splice(i, 1);
                break;
            }
        }
        this.node.children[i + 3].destroy();
    }

    calculatePositionOffset(targetTime: number): number {
        return
    }
}