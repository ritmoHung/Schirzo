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
    export function setUserData(userId: string, data: any) {
        return firebase.database().ref(`${USER_BASE_PATH}/${userId}`).set(data);
    }
}