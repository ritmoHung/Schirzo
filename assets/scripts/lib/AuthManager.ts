declare const firebase: any;

export module AuthManager {
    export function checkLoginStatus(onUserLoggedIn: (user: firebase.User) => void, onUserLoggedOut: () => void) {
        firebase.auth().onAuthStateChanged((user) => {
            if (user) {
                console.log(`LOGGED IN AS: ${user}`);
                onUserLoggedIn(user);
            } else {
                console.log("NOT LOGGED IN");
                onUserLoggedOut();
            }
        })
    }

    export async function showLoginRedirect() {
        const provider = new firebase.auth.GoogleAuthProvider();
        try {
            await firebase.auth().signInWithRedirect(provider);
        } catch (error) {
            console.error('Error signing in:', error);
        }
    }

   export async function handleRedirectResult(): Promise<firebase.User | null> {
        try {
            const result = await firebase.auth().getRedirectResult();
            if (result.user) {
                console.log('User signed in with redirect:', result.user);
                return result.user;
            }
            return null;
        } catch (error) {
            console.error('Error handling redirect result:', error);
            return null;
        }
    }
}