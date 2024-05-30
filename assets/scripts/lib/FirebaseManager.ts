import { assetManager, AudioClip, JsonAsset } from "cc"

declare const firebase: any;

export interface ChartData {
    chart: Record<string, any>,
    audio: AudioClip
}

export module FirebaseManager {
    export async function loadChartFromFirebaseStorage(type: "vanilla" | "custom", name: string, onComplete: ({ chart, audio }: ChartData) => void) {
        const chartRef = firebase.storage().ref(`songs/${type}/${name}`);
        const chartUrl = await chartRef.child("2.json").getDownloadURL();
        const songUrl = await chartRef.child("base.ogg").getDownloadURL();
        FirebaseManager.loadChartFromURL(chartUrl, songUrl, onComplete);
    };

    export async function loadChartFromURL(chartURL: string, songURL: string, onComplete: ({ chart, audio }: ChartData) => void) {
        let chart: ChartData = {
            chart: null,
            audio: null
        };
        const res = await fetch(chartURL);
        const chartJson = await res.json();
        chart.chart = chartJson as Record<string, any>;
        assetManager.loadRemote<AudioClip>(songURL, { "ext": ".ogg" }, (err, data) => {
            if (!err) {
                chart.audio = data;
            }
            onComplete(chart);
        })
    }
}