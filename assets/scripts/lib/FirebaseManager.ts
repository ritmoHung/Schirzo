import { assetManager, AudioClip, JsonAsset, ParticleSystem } from "cc"

declare const firebase: any;

export interface ChartData {
    chart: Record<string, any>,
    audio: AudioClip
}

export interface CustomSongData {
    id: string,
    name: string,
    artist: string
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

    export function loadCustomSongs(onComplete: (songs: CustomSongData[]) => void) {
        firebase.database().ref("custom_charts").on("value", (snapshot) => {
            const obj = snapshot.val();
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

    export function publishCustomSong(songData: CustomSongData, chartFile: File, audioFile: File, onComplete: (err) => void) {
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

    export function publishCustomSongDataToDB(songData: CustomSongData, onComplete: (id: string) => void) {
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