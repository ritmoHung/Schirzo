export class GlobalSettings {
    private static instance: GlobalSettings

    public flowSpeed: number = 4.0
    public musicOffset: number = 0


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
        localStorage.setItem("musicOffset", this.musicOffset.toString());
    }

    public loadSettings() {
        const flowSpeed = parseFloat(localStorage.getItem("flowSpeed") ?? "4.0");
        const musicOffset = parseInt(localStorage.getItem("musicOffset") ?? "0", 10);

        this.flowSpeed = flowSpeed;
        this.musicOffset = musicOffset;
    }
}