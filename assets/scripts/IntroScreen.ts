import { _decorator, Button, Camera, Component, director, EventMouse, Input, input, RichText, Tween, tween, UIOpacity, Vec3 } from "cc";
import { AuthManager } from "./lib/AuthManager";
import { DatabaseManager } from "./lib/DatabaseManager";
import { GlobalSettings } from "./settings/GlobalSettings";
import { LoaderCommon } from "./ui/loader/LoaderCommon";
const { ccclass, property } = _decorator;

@ccclass("Intro")
export class Intro extends Component {
    @property(Camera)
    camera: Camera

    @property(Button)
    logoutButton: Button

    @property(UIOpacity)
    uiOpacity: UIOpacity

    @property(UIOpacity)
    subUIOpacity: UIOpacity

    @property(UIOpacity)
    coverUIOpacity: UIOpacity

    @property(LoaderCommon)
    loader: LoaderCommon

    @property(RichText)
    statusText: RichText

    private globalSettings: GlobalSettings
    private isSignOutProcess: boolean = false;
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
                tween(this.uiOpacity)
                    .to(0.5, { opacity: 255 }, { easing: "smooth" })
                    .start();

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
        const userData = await DatabaseManager.createUserData(user.uid);
        this.globalSettings.userData = userData;

        // Update loader status
        this.loader.showStatus("success");
        this.statusText.string = `useR: ${user.displayName}`;
        
        // Attach on touch listener
        input.on(Input.EventType.TOUCH_END, this.onTouchEnd, this);
        this.applySubtitleBlink();
    }

    async onUserSignedOut() {
        // Update loader status
        this.loader.showStatus("warning");
        this.statusText.string = "Not logged in";

        if (!this.isSignOutProcess) {
            this.scheduleOnce(function() {
                const googleProvider = new firebase.auth.GoogleAuthProvider();
                AuthManager.signInRedirect(googleProvider);
            }, 1);
        }
    }

    async signOut() {
        try {
            this.isSignOutProcess = true;
            await AuthManager.signOut();
            this.globalSettings.userData = {};
            director.loadScene(director.getScene().name);
        } catch (error) {
            this.isSignOutProcess = false;
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
                    this.scheduleOnce(function() {
                        this.loadScene();
                    }, 2);
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