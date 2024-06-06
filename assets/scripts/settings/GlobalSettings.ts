import { SelectedSong } from "./song"

export class GlobalSettings {
    private static instance: GlobalSettings

    // Game Logic
    private _selectedChapterId: string = ""
    private _selectedSong: SelectedSong

    // User Settings
    private _userData: any = {}
    public flowSpeed: number = 4.0
    public offset: number = 0.0



    // # Constructor
    private constructor() {
        // Private constructor to prevent direct construction calls with the `new` operator.
    }

    public static getInstance(): GlobalSettings {
        if (!GlobalSettings.instance) {
            GlobalSettings.instance = new GlobalSettings();
        }
        return GlobalSettings.instance;
    }



    // # Functions
    public saveSettings() {
        localStorage.setItem("flowSpeed", this.flowSpeed.toString());
        localStorage.setItem("offset", this.offset.toString());
    }

    public loadSettings() {
        const flowSpeed = parseFloat(localStorage.getItem("flowSpeed") ?? "4.0");
        const offset = parseInt(localStorage.getItem("offset") ?? "0", 10);

        this.flowSpeed = flowSpeed;
        this.offset = offset;
    }

    // User Settings
    get userData(): any {
        return this._userData;
    }
    set userData(data: any) {
        if (typeof data === "object") {
            this._userData = data;
        } else {
            throw new Error("Invalid data object");
        }
    }

    get selectedChapterId(): string {
        return this._selectedChapterId;
    }
    set selectedChapterId(chapterId: string) {
        this._selectedChapterId = chapterId;
    }

    get selectedSong(): any {
        return this._selectedSong;
    }
    set selectedSong(song: any) {
        if (this.isValidSelectedSong(song)) {
            this._selectedSong = song;
        } else {
            throw new Error("Invalid song object");
        }
    }
    private isValidSelectedSong(song: any): song is SelectedSong {
        return (
            typeof song === "object" &&
            song.type === "vanilla" || song.type === "custom" &&
            typeof song.id === "string"
        );
    }
}