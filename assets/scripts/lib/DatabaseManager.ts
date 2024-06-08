import { GlobalSettings } from "../settings/GlobalSettings";

declare const firebase: any;

const USER_BASE_PATH = "users"

export module DatabaseManager {
    // Scope: user/{userId}
    export async function createUserData(userId: string) {
        const userData = await getUserData(userId);
        if (!userData) {
            const defaultData = {
                isNewPlayer: true,
                chapters: [],
                songs: [],
                settings: {
                    flowSpeed: 4.0,
                    offset: 0.0,
                },
                createdAt: firebase.database.ServerValue.TIMESTAMP,
            }
            await setUserData(userId, defaultData);
            return defaultData;
        }
        return userData;
    }
    export async function getUserData(userId: string): Promise<any> {
        const snapshot = await firebase.database().ref(`${USER_BASE_PATH}/${userId}`).once("value");
        return snapshot.exists() ? snapshot.val() : null;
    }
    export async function setUserData(userId: string, data: any): Promise<void> {
        return firebase.database().ref(`${USER_BASE_PATH}/${userId}`).set(data);
    }
    export async function updateData() {
        const globalSettings = GlobalSettings.getInstance();
        const userId = globalSettings.user.uid;
        const data = globalSettings.userData;

        try {
            await setUserData(userId, data);
            console.log("DATABASE::UPDATE: Success");
        } catch (error) {
            console.error(`DATABASE::UPDATE: Failed, reason: ${error.message}`);
        }
    }
    //return the data of leaderboard
    export async function getLeaderBoard(SongId: string): Promise<any> {
        let songRef = firebase.database().ref(`leaderboard/songs/vanilla/${SongId}`);

        // console.log(`Fetching data from: leaderboard/songs/vanilla/${SongId}/test`);
    
        try {
            let snapshot = await songRef.orderByChild("score").limitToLast(5).once("value");
            let data = snapshot.val();
    
            let leaderboardArray = [];
            if (data) {
                for (let key in data) {
                    if (data.hasOwnProperty(key)) {
                        leaderboardArray.push(data[key]);
                    }
                }
            }
    
            leaderboardArray.sort((a, b) => {
                if (a.accuracy === b.accuracy) {
                    return b.score - a.score;
                }
                return b.accuracy - a.accuracy;
            });
    
            return leaderboardArray;
        } catch (error) {
            console.error("Error fetching data: ", error);
            throw error;
        }
    }

    export async function setLeaderBoard(SongId: string, data: any): Promise<void> {
        const globalSettings = GlobalSettings.getInstance();
        let songRef = firebase.database().ref(`leaderboard/songs/vanilla/${SongId}`);
        const name = globalSettings.user.displayName;
        console.log(name);

        /*let snapshot = await songRef.once("value").val();
        if(!snapshot){
            let vanillaRef =  firebase.database().ref(`leaderboard/songs/vanilla`);
            snapshot = await vanillaRef.once("value").val();
            snapshot[SongId] = {};
            snapshot[SongId][name] = {};
            snapshot[SongId][name] = {...snapshot[SongId][name], ...data};
            return firebase.database().ref(`leaderboard/songs/vanilla`).set(snapshot);
        }
        else if(!snapshot[name]){
            snapshot[name] = {};
            snapshot[name] = {...snapshot[name], ...data};
            return songRef.set(snapshot);
        }*/
        return firebase.database().ref(`leaderboard/songs/vanilla/${SongId}/${name}`).set(data);
    }
}