import { _decorator, Component, director, Node } from "cc";
import { AuthManager } from "./lib/AuthManager";
import { DatabaseManager } from "./lib/DatabaseManager";
const { ccclass, property } = _decorator;

@ccclass("Intro")
export class Intro extends Component {
    onLoad() {
        AuthManager.checkLoginStatus(
            (user) => this.onUserLoggedIn(user),
            () => this.onUserLoggedOut()
        )
    }

    async onUserLoggedIn(user: firebase.User) {
        console.log('Logged in user:', user.displayName, "ID:", user.uid);
        // Transition to the main game scene or perform other actions
        console.log("DATA:", await DatabaseManager.getUserData(user.uid));
        // director.loadScene("ChapterSelect");
    }

    async onUserLoggedOut() {
        console.log('No user is logged in, showing login popup');
        AuthManager.showLoginRedirect();
    }
}

