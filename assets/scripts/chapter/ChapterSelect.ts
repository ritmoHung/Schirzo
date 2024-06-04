import { _decorator, Button, Component, director, Label, Node } from "cc";
import { GlobalSettings } from "../settings/GlobalSettings";
import { SceneTransition } from "../ui/SceneTransition";
const { ccclass, property } = _decorator;

@ccclass("ChapterSelect")
export class ChapterSelect extends Component {
    @property(SceneTransition)
    sceneTransition: SceneTransition

    @property(Node)
    chapterContainer: Node = null;

    private globalSettings: GlobalSettings



    // # Lifecycle
    onLoad() {
        this.globalSettings = GlobalSettings.getInstance();
        this.loadChapters();
    }



    // # Functions
    loadChapters() {
        this.globalSettings.chapters.sort((a, b) => a.index - b.index);
        this.globalSettings.chapters.forEach(chapterData => {
            this.createChapterButton(chapterData);
        });
    }

    createChapterButton(chapterData: any) {
        const chapterButton = new Node();
        const buttonComponent = chapterButton.addComponent(Button);
        const labelComponent = chapterButton.addComponent(Label);
        labelComponent.string = chapterData.name;

        buttonComponent.node.on(Button.EventType.CLICK, () => {
            this.globalSettings.selectedChapterId = chapterData.id;
            this.sceneTransition.fadeOutAndLoadScene("SongSelect");
        });
        this.chapterContainer.addChild(chapterButton);
    }
}