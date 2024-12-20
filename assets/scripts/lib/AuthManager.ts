declare const firebase: any;

export module AuthManager {
    export function checkUserStatus(
        onUserSignedIn: (user: firebase.User) => void,
        onUserSignedOut: () => void
    ) {
        firebase.auth().onAuthStateChanged((user: firebase.User) => {
            if (user) {
                console.log(`LOGGED IN AS: ${user.displayName}`);
                onUserSignedIn(user);
            } else {
                console.warn("NOT LOGGED IN");
                onUserSignedOut();
            }
        })
    }

    export async function signInPopup(provider: firebase.auth.AuthProvider) {
        try {
            await firebase.auth().signInWithPopup(provider);
        } catch (error) {
            console.error("Error signing in:", error);
        }
    }

    export async function signOut(): Promise<void> {
        return firebase.auth().signOut().then(() => {
            console.log(`SIGNED OUT`);
        }).catch((error) => {
            console.error("Error signing out:", error);
            throw error;
        })
    }
}