import { _decorator, Button, Camera, Component, director, EventMouse, Input, input, Tween, tween, UIOpacity, Vec3 } from "cc";
import { AuthManager } from "./lib/AuthManager";
import { DatabaseManager } from "./lib/DatabaseManager";
import { GlobalSettings } from "./settings/GlobalSettings";
const { ccclass, property } = _decorator;

@ccclass("Intro")
export class Intro extends Component {
    @property(Camera)
    camera: Camera

    @property(Button)
    logoutButton: Button

    @property(UIOpacity)
    subUIOpacity: UIOpacity

    @property(UIOpacity)
    coverUIOpacity: UIOpacity

    private globalSettings: GlobalSettings
    private blinkTween: Tween<any> = null
    private zPosition: number = 1000



    // # Lifecycle
    onLoad() {
        this.globalSettings = GlobalSettings.getInstance();
        input.on(Input.EventType.MOUSE_MOVE, this.onMouseMove, this);
    }

    start() {
        this.camera.node.setPosition(new Vec3(0, 0, 0));
        tween(this.camera.node)
            .to(4, { position: new Vec3(0, 0, this.zPosition) }, { easing: "quartOut" })
            .call(() => {
                AuthManager.checkUserStatus(
                    (user) => this.onUserSignedIn(user),
                    () => this.onUserSignedOut()
                );
                this.logoutButton.node.on(Button.EventType.CLICK, this.signOut, this);
            })
            .start();
    }



    // # Functions
    async onUserSignedIn(user: firebase.User) {
        const userData = await DatabaseManager.getUserData(user.uid);
        this.globalSettings.userData = userData ? userData : {};
        
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        this.applySubtitleBlink();
    }

    async onUserSignedOut() {
        const googleProvider = new firebase.auth.GoogleAuthProvider();
        AuthManager.signInRedirect(googleProvider);
    }

    async signOut() {
        try {
            await AuthManager.signOut();
        } catch (error) {
            console.error("SIGNOUT: Failed");
        }
    }

    onMouseMove(e: EventMouse) {
        // console.log(e.getLocation());
    }
    
    onTouchEnd() {
        input.off(Input.EventType.TOUCH_END, this.onTouchEnd, this);

        if (this.blinkTween) {
            this.blinkTween.stop();
            this.blinkTween = null;
        }
        tween(this.subUIOpacity)
            .to(0.25, { opacity: 0 }, { easing: "smooth" })
            .call(() => {
                const cameraTween = tween(this.camera.node)
                    .to(1, { position: new Vec3(0, 0, 0) }, { easing: "quartIn" });
                const opacityTween = tween(this.coverUIOpacity)
                    .to(1, { opacity: 255 }, { easing: "quartIn" });

                cameraTween.start();
                opacityTween.call(() => {
                    this.loadScene();
                }).start();
            })
            .start();
    }

    loadScene() {
        const isNewPlayer = this.globalSettings.userData?.isNewPlayer;
        if (isNewPlayer) {
            director.loadScene("ChapterSelect");
        } else {
            director.loadScene("ChapterSelect");
        }
    }

    applySubtitleBlink() {
        this.subUIOpacity.opacity = 255;
        this.blinkTween = tween(this.subUIOpacity)
        .repeatForever(
            tween()
            .to(2, { opacity: 0 }, { easing: "smooth" })
            .to(2, { opacity: 255 }, { easing: "smooth" })
        )
        .start();
    }
}