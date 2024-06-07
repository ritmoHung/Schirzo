// Vanilla: default; Custom: fanmade

import { AudioClip } from "cc";

// ? Object.values() is not usable in ES2015, thus making it a type instead of enum
export type ChartType = "vanilla" | "custom";
export type ChartMode = "gameplay" | "autoplay";

export interface ChartData {
    chart: Record<string, any>,
    audio: AudioClip
}

// Data is saved in Firebase storage, folder: songs/{type}/{id}
export interface SelectedSong {
    type: ChartType
    id: string  // ID of the song
    mode: ChartMode
    anomaly: boolean
}