import { ChartPlayer } from "./chart/ChartPlayer";
import { ChartEditor } from "./editor/ChartEditor";

export class GlobalSettings {
    private static instance: GlobalSettings

    public editing: boolean = false;

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
    public getPlayer() {
        return this.editing ? ChartEditor.Instance : ChartPlayer.Instance;
    }
    
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
}