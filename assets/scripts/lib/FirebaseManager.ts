import { assetManager, AudioClip } from "cc"
import { ChartData } from "../settings/song";

declare const firebase: any;

export module FirebaseManager {
    export async function getChartData(type: "vanilla" | "custom", id: string): Promise<ChartData> {
        const chartRef = firebase.storage().ref(`songs/${type}/${id}`);
        const chartUrl = await chartRef.child("2.json").getDownloadURL();
        const songUrl = await chartRef.child("base.ogg").getDownloadURL();
        return getChartDataFromURL(chartUrl, songUrl);
    };

    export async function getChartDataFromURL(chartURL: string, songURL: string): Promise<ChartData> {
        const chartRes = await fetch(chartURL);
        const chartJson = await chartRes.json();

        const chartData: ChartData = {
            chart: chartJson as Record<string, any>,
            audio: null as any,
        }

        return new Promise((resolve, reject) => {
            assetManager.loadRemote<AudioClip>(songURL, { "ext": ".ogg" }, (error, audioClip) => {
                if (error) {
                    console.error(`FIREBASE::AUDIO: Failed to load audio clip, reason: ${error.message}`);
                    reject(error);
                }

                chartData.audio = audioClip;
                resolve(chartData);
            });
        });
    }
}