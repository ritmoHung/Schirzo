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
}