declare const firebase: any;

const USER_BASE_PATH = "users"

export module DatabaseManager {
    // Scope: user/{userId}
    export async function getUserData(userId: string): Promise<any> {
        const snapshot = await firebase.database().ref(`${USER_BASE_PATH}/${userId}`).once("value");
        return snapshot.exists() ? snapshot.val() : null;
    }
    export function setUserData(userId: string, data: any) {
        return firebase.database().ref(`${USER_BASE_PATH}/${userId}`).set(data);
    }
}