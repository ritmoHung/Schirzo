import { JsonAsset, resources } from "cc";
import { AudioManager } from "./AudioManager";
import { UnlockManager } from "../lib/unlock/UnlockManager";
import { SelectedSong } from "./song"

export class GlobalSettings {
    private static instance: GlobalSettings

    // Game Logic
    private _audioManager: AudioManager
    private _unlockManager: UnlockManager;
    private _chapters: any[] = []
    private _songs: any[] = []
    private _logs: any[] = []
    private _selectedChapterId: string = ""
    private _selectedSong: SelectedSong

    // User Settings
    private _user: any = {}
    private _userData: any = {}
    public flowSpeed: number = 4.0
    public offset: number = 0.0



    // # Constructor
    private constructor() {
        // Private constructor to prevent direct construction calls with the `new` operator.
        this._audioManager = new AudioManager();
        this._unlockManager = new UnlockManager();
    }

    public static getInstance(): GlobalSettings {
        if (!GlobalSettings.instance) {
            GlobalSettings.instance = new GlobalSettings();
        }
        return GlobalSettings.instance;
    }



    // # Functions
    public async initialize(): Promise<void> {
        try {
            if (this._chapters.length === 0) await this.loadChapters();
            if (this._songs.length === 0) await this.loadSongs();
            if (this._logs.length === 0) await this.loadLogMetadata();
            if (this.unlockManager.unlockTargets.length === 0) this.initializeUnlocks();
        } catch (error) {
            console.log("Error initializing:", error);
            throw error;
        }
    }

    public reset(): void {
        // Game Logic
        this._unlockManager = new UnlockManager();
        this._chapters = [];
        this._songs = [];
        this._logs = [];
        this._selectedChapterId = "";
        this._selectedSong = null;

        // User Settings
        this._userData = {};
        localStorage.clear();
    }

    // Game Logic
    private async loadChapters(): Promise<void> {
        return new Promise((resolve, reject) => {
            resources.loadDir("chapters", JsonAsset, (error, assets) => {
                if (error) {
                    console.error(`CHAPTERS: Failed to load JSON, reason: ${error.message}`);
                    reject(error);
                    return;
                }

                this._chapters = assets.map((asset: JsonAsset) => asset.json);
                resolve();
            });
        })
    }
    get chapters(): any[] {
        return this._chapters;
    }

    private async loadSongs(): Promise<void> {
        const songIds = this.getSongsIdsByChapter(this._chapters);

        const promises = songIds.map(songId => {
            return new Promise<void>((resolve, reject) => {
                const path = `songs/${songId}/info`;

                resources.load(path, JsonAsset, (error, asset) => {
                    if (error) {
                        console.error(`SONG::${songId}: Failed to load JSON, reason: ${error.message}`);
                        reject(error);
                        return;
                    }
    
                    this._songs.push(asset.json);
                    resolve();
                });
            });
        })

        return Promise.all(promises).then(() => {
            // console.log("All song info JSONs loaded");
        })
    }
    public getSongsIdsByChapter(chapters: any[]): string[] {
        const songIds: string[] = [];
        chapters.forEach(chapter => {
            chapter.songs.forEach((song: any) => {
                songIds.push(song.id);
            });
        });
        return songIds;
    }
    get songs(): any[] {
        return this._songs;
    }

    private async loadLogMetadata(): Promise<void> {
        return new Promise((resolve, reject) => {
            resources.loadDir("logs", JsonAsset, (error, assets) => {
                if (error) {
                    console.error(`LOGS: Failed to load JSON, reason: ${error.message}`);
                    reject(error);
                    return;
                }

                this._logs = assets.map((asset: JsonAsset) => {
                    const log = asset.json;
                    const { contents, ...filteredLog } = log;
                    return filteredLog;
                });
                resolve();
            });
        });
    }
    
    get audioManager(): AudioManager {
        return this._audioManager;
    }
    
    public initializeUnlocks(): void {
        this._songs.forEach(song => {
            if (song && song.id && song.unlock_requirements) {
                this._unlockManager.addUnlockTarget({
                    id: song.id,
                    type: "song",
                    unlock_requirements: song.unlock_requirements
                });
            }
        });
        this._logs.forEach(log => {
            if (log && log.id && log.unlock_requirements) {
                this._unlockManager.addUnlockTarget({
                    id: log.id,
                    type: "log",
                    unlock_requirements: log.unlock_requirements
                });
            }
        });
    }
    get unlockManager(): UnlockManager {
        return this._unlockManager;
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
            typeof song.id === "string" &&
            typeof song.anomaly === "boolean"
        );
    }



    // User Settings
    get user(): any {
        return this._user;
    }
    set user(u: firebase.User) {
        this._user = u;
    }

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
    getUserData(key: string, id: string = ""): any {
        if (!key) {
            return this._userData;
        }

        if (id) {
            if (this._userData[key] && this._userData[key][id]) {
                return this._userData[key][id];
            } else {
                return {};
            }
        } else {
            // Check if the key exists in _userData
            return this._userData[key] || {};
        }
    }
    setUserData({ key, id, data }: { key: string, id?: string, data: any }) {
        if (!key) {
            console.error("Key is required to set user data");
            return;
        }

        if (id) {
            // Ensure key exists
            if (!this._userData[key]) {
                this._userData[key] = {};
            }
            this._userData[key][id] = data;
        } else {
            this._userData[key] = data;
        }
    }
    patchUserData({ key, id, data }: { key: string, id?: string, data: any }) {
        if (!key) {
            console.error("Key is required to patch user data");
            return;
        }

        // Ensure key exists
        if (!this._userData[key]) {
            this._userData[key] = {};
        }

        if (id) {
            // Ensure id exists
            if (!this._userData[key][id]) {
                this._userData[key][id] = {};
            }
            this._userData[key][id] = { ...this._userData[key][id], ...data };
        } else {
            this._userData[key] = { ...this._userData[key], ...data };
        }
    }
}