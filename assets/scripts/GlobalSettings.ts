export class GlobalSettings {
    private static instance: GlobalSettings

    /** the path in firebase storage as "charts/${type}/${chart}". Change the path before entering chart scene so that ChartPlayer can fully load the chart. */
    public currentChart: {
        /** Vanilla = default, Custom = player-made */
        type: "vanilla" | "custom",
        /** The name of the chart. */
        chart: string
    } = {
        type: "vanilla",
        chart: "miserable"
    }
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
}