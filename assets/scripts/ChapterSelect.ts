import { _decorator, Button, Component, director, JsonAsset, Label, Node, resources } from "cc";
import { GlobalSettings } from "./settings/GlobalSettings";
const { ccclass, property } = _decorator;

@ccclass("ChapterSelect")
export class ChapterSelect extends Component {
    @property(Node)
    chapterContainer: Node = null;

    private globalSettings: GlobalSettings



    // # Lifecycle
    onLoad() {
        this.globalSettings = GlobalSettings.getInstance();
        this.loadChapters();

        director.preloadScene("SongSelect", (err) => {
            if (err) {
                console.log("SCENE::SONGSELECT: Failed");
                return;
            }
            console.log("SCENE::SONGSELECT: Preloaded");
        });
    }



    // # Functions
    loadChapters() {
        resources.loadDir("chapters", JsonAsset, (error, assets) => {
            if (error) {
                console.error(`CHAPTERS: Failed to load JSON, reason: ${error.message}`);
                return;
            }

            const chapters = assets.map((asset: JsonAsset) => asset.json);
            chapters.sort((a, b) => a.index - b.index);
            chapters.forEach(chapterData => {
                this.createChapterButton(chapterData);
            });
        })
    }

    createChapterButton(chapterData: any) {
        const chapterButton = new Node();
        const buttonComponent = chapterButton.addComponent(Button);
        const labelComponent = chapterButton.addComponent(Label);
        labelComponent.string = chapterData.name;

        buttonComponent.node.on(Button.EventType.CLICK, () => {
            this.globalSettings.selectedChapterId = chapterData.id;
            director.loadScene("SongSelect");
        });
        this.chapterContainer.addChild(chapterButton);
    }
}