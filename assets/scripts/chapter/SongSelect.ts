import { _decorator, Button, Component, director, JsonAsset, Label, Node, resources } from "cc";
import { GlobalSettings } from "../settings/GlobalSettings";
const { ccclass, property } = _decorator;

@ccclass("SongSelect")
export class SongSelect extends Component {
    @property(Node)
    songContainer: Node = null;

    @property(Button)
    logsButton: Button

    private globalSettings: GlobalSettings



    // # Lifecycle
    onLoad() {
        this.globalSettings = GlobalSettings.getInstance();
        this.loadSongs(this.globalSettings.selectedChapterId);

        this.logsButton.node.on(Button.EventType.CLICK, this.loadChapterLogsScene, this);

        director.preloadScene("ChartPlayer", (err) => {
            if (err) {
                console.log("SCENE::CHARTPLAYER: Failed");
                return;
            }
            console.log("SCENE::CHARTPLAYER: Preloaded");
        });
    }

    
    
    // # Functions
    loadSongs(chapterId: string) {
        resources.load(`chapters/${chapterId}`, JsonAsset, (error, asset: JsonAsset) => {
            if (error) {
                console.error(`CHAPTER::${chapterId}: Failed to load JSON, reason: ${error.message}`);
                return;
            }

            const chapterData = asset.json!;
            const songs = chapterData.songs;
            songs.sort((a: any, b: any) => a.index - b.index)
            songs.forEach(song => {
                this.createSongButton(song.id);
            });
        });
    }

    createSongButton(songId: any) {
        resources.load(`songs/${songId}/info`, JsonAsset, (error, asset: JsonAsset) => {
            if (error) {
                console.error(`SONG::${songId}: Failed to load JSON, reason: ${error.message}`);
                return;
            }

            const songData = asset.json!;
            const songButton = new Node();
            const buttonComponent = songButton.addComponent(Button);
            const labelComponent = songButton.addComponent(Label);
            labelComponent.string = songData.name;
    
            buttonComponent.node.on(Button.EventType.CLICK, () => {
                this.globalSettings.selectedSong = { type: "vanilla", id: songData.id };
                director.loadScene("ChartPlayer");
            });
            this.songContainer.addChild(songButton);
        });
    }

    loadChapterLogsScene() {
        director.loadScene("ChapterLogs");
    }
}