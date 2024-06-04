import { _decorator, Component, director, tween, TweenEasing, UIOpacity } from "cc";
const { ccclass, property } = _decorator;

@ccclass("SceneTransition")
export class SceneTransition extends Component {
    @property(UIOpacity)
    uiOpacity: UIOpacity

    @property
    fadeInDuration: number = 0.75

    @property
    fadeOutDuration: number = 0.75

    @property
    easeType: TweenEasing = "smooth"



    // # Lifecycle
    onLoad() {
        this.uiOpacity.opacity = 255;
    }

    start() {
        this.fadeIn();
    }



    // # Functions
    fadeIn() {
        tween(this.uiOpacity)
            .to(this.fadeInDuration, { opacity: 0 }, { easing: this.easeType })
            .start();
    }

    fadeOutAndLoadScene(sceneName: string) {
        tween(this.uiOpacity)
            .to(this.fadeOutDuration, { opacity: 255 }, { easing: this.easeType })
            .call(() => {
                director.loadScene(sceneName);
            })
            .start();
    }
}