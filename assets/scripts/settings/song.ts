// Vanilla: default; Custom: fanmade
// ? Object.values() is not usable in ES2015, thus making it a type instead of enum
export type ChartType = "vanilla" | "custom";

// Data is saved in Firebase storage, folder: songs/{type}/{id}
export interface SelectedSong {
    type: ChartType;
    id: string;  // ID of the song
}