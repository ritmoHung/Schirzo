import { assetManager, AudioClip } from "cc"
import { ChartData, SelectedSong } from "../settings/song";

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

    export function loadCustomSongs(onComplete: (songs: SelectedSong[]) => void) {
        firebase.database().ref("custom_charts").on("value", (snapshot) => {
            const obj = snapshot.val();
            if (!obj) {
                onComplete([]);
                return
            }
            onComplete(Object.keys(obj).map((key) => obj[key]));
        });
    }

    export function checkCustomSongValidate(id: string, onComplete: (pass: boolean) => void) {
        firebase.database().ref("custom_charts").once("value", (snapshot) => {
            let pass = true;
            snapshot.forEach((child) => {
                if (child.val().id == id) {
                    pass = false;
                }
            });
            onComplete(pass);
        });
    }

    export function publishCustomSong(songData: SelectedSong, chartFile: File, audioFile: File, onComplete: (err) => void) {
        try {
            if (chartFile.type != "application/json") {
                throw `Chart file type is not json! Received ${chartFile.type}`
            } else if (audioFile.type != "audio/ogg") {
                throw `Chart file type is not audio/ogg! Received ${audioFile.type}`
            }
            publishCustomSongDataToDB(songData, (id) => {
                if (id == null) {
                    onComplete("Unknown error from firebase database")
                }
                firebase.storage().ref(`songs/custom/${id}/2.json`).put(chartFile).catch((err) => {
                    throw err;
                });
                firebase.storage().ref(`songs/custom/${id}/base.ogg`).put(audioFile).catch((err) => {
                    throw err;
                });
                onComplete(null);
            })
        } catch (err) {
            onComplete(err);
        }
    }

    export function publishCustomSongDataToDB(songData: SelectedSong, onComplete: (id: string) => void) {
        checkCustomSongValidate(songData.id, (pass) => {
            let id = songData.id;
            if (!pass) {
                const randomCode = Math.random().toString().replace(/[^a-zA-Z0-9]/g, '').slice(0, 5)
                id += `-${randomCode}`;
            }
            console.log(pass, id);
            onComplete(id);

            firebase.database().ref(`custom_charts/${id}`).set(songData, (err) => {
                if (err) {
                    onComplete(null);
                } else {
                    onComplete(id);
                }
            });

        })
    }
}